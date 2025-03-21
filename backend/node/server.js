const express = require('express');
const { MongoClient } = require('mongodb');
const { execFile } = require('child_process');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
const port = 8080;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:8000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let db;

const JWT_SECRET = 'mySuperSecretKey123!';

async function connectDB() {
    try {
        await client.connect();
        db = client.db('movieTicketDB');
        console.log('Connected to MongoDB');
        await initDB();
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}

async function initDB() {
    try {
        const movies = db.collection('movies');
        const users = db.collection('users');
        const bookings = db.collection('bookings');
        const seats = db.collection('seats');

        if (await movies.countDocuments() === 0) {
            await movies.insertMany([
                { _id: 1, title: 'Inception', duration: 148, genre: 'Sci-Fi', language: 'English', trailer_url: 'https://www.youtube.com/embed/YoHD9XEInc0', showtimes: [{ id: 1, time: '2025-03-22T18:00' }] },
                { _id: 2, title: 'The Matrix', duration: 136, genre: 'Action', language: 'English', trailer_url: 'https://www.youtube.com/embed/vKQi3bBA1y8', showtimes: [{ id: 2, time: '2025-03-22T20:00' }] }
            ]);
            console.log('Movies initialized');
        }
        if (await users.countDocuments() === 0) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            await users.insertOne({ username: 'testuser', password: hashedPassword });
            console.log('Users initialized with username: testusername');
        }
        if (await seats.countDocuments() === 0) {
            const seatData = [];
            for (let movieId = 1; movieId <= 2; movieId++) {
                for (let showtimeId = 1; showtimeId <= 1; showtimeId++) {
                    for (let i = 1; i <= 20; i++) {
                        seatData.push({ movie_id: movieId, showtime_id: showtimeId, seat_number: i, is_booked: false });
                    }
                }
            }
            await seats.insertMany(seatData);
            console.log('Seats initialized');
        }
        console.log('Database initialized');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

connectDB();

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the Movie Ticket Booking API. Use /movies, /login, /seats, /book, or /history.' });
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db.collection('users').findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/movies', async (req, res) => {
    try {
        const movies = await db.collection('movies').find().toArray();
        res.json(movies);
    } catch (error) {
        console.error('Movies fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});

app.get('/seats', async (req, res) => {
    try {
        const { movie_id, showtime_id } = req.query;
        const seats = await db.collection('seats').find({ 
            movie_id: parseInt(movie_id), 
            showtime_id: parseInt(showtime_id) 
        }).toArray();
        res.json(seats);
    } catch (error) {
        console.error('Seats fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch seats' });
    }
});

app.post('/book', authenticateToken, async (req, res) => {
    try {
        const { movie_id, showtime_id, seats } = req.body; // Removed payment_token
        const availableSeats = await db.collection('seats').find({
            movie_id: parseInt(movie_id),
            showtime_id: parseInt(showtime_id),
            seat_number: { $in: seats },
            is_booked: false
        }).toArray();

        if (availableSeats.length !== seats.length) {
            return res.json({ success: false, error: 'Some seats are already booked' });
        }

        execFile('../src/book_seat', [movie_id, showtime_id, JSON.stringify(seats)], async (err, stdout) => {
            if (err) {
                console.error('Booking exec error:', err);
                return res.json({ success: false, error: err.message });
            }
            const result = JSON.parse(stdout);
            if (result.success) {
                await db.collection('seats').updateMany(
                    { movie_id: parseInt(movie_id), showtime_id: parseInt(showtime_id), seat_number: { $in: seats } },
                    { $set: { is_booked: true } }
                );
                await db.collection('bookings').insertOne({
                    user: req.user.username,
                    movie_id: parseInt(movie_id),
                    showtime_id: parseInt(showtime_id),
                    seats,
                    date: new Date()
                });
            }
            res.json(result);
        });
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ error: 'Failed to book tickets' });
    }
});

app.get('/history', authenticateToken, async (req, res) => {
    try {
        if (!req.user || !req.user.username) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const bookings = await db.collection('bookings').find({ user: req.user.username }).toArray();
        res.json(bookings);
    } catch (error) {
        console.error('History endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch booking history' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});