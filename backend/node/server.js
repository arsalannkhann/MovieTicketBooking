const express = require('express');
const { MongoClient } = require('mongodb');
const { execFile } = require('child_process');
const app = express();
const port = 8080;

app.use(express.json());

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db('movieTicketDB');
        console.log('Connected to MongoDB');
        await initDB(); // Call initDB after connection is established
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1); // Exit if connection fails
    }
}

async function initDB() {
    const movies = db.collection('movies');
    const seats = db.collection('seats');
    if (await movies.countDocuments() === 0) {
        await movies.insertMany([
            { _id: 1, title: 'Inception', duration: 148, showtimes: [{ id: 1, time: '2025-03-22T18:00' }] },
            { _id: 2, title: 'The Matrix', duration: 136, showtimes: [{ id: 2, time: '2025-03-22T20:00' }] }
        ]);
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
    }
    console.log('Database initialized');
}

// Start the connection process
connectDB();

app.get('/movies', async (req, res) => {
    const movies = await db.collection('movies').find().toArray();
    res.json(movies);
});

app.get('/seats', async (req, res) => {
    const { movie_id, showtime_id } = req.query;
    const seats = await db.collection('seats').find({ 
        movie_id: parseInt(movie_id), 
        showtime_id: parseInt(showtime_id) 
    }).toArray();
    res.json(seats);
});

app.post('/book', async (req, res) => {
    const { movie_id, showtime_id, seats } = req.body;

    // Check seat availability in MongoDB
    const availableSeats = await db.collection('seats').find({
        movie_id: parseInt(movie_id),
        showtime_id: parseInt(showtime_id),
        seat_number: { $in: seats },
        is_booked: false
    }).toArray();

    if (availableSeats.length !== seats.length) {
        return res.json({ success: false, error: 'Some seats are already booked' });
    }

    // Call C binary for booking logic
    execFile('../src/book_seat', [movie_id, showtime_id, JSON.stringify(seats)], (err, stdout) => {
        if (err) {
            return res.json({ success: false, error: err.message });
        }
        const result = JSON.parse(stdout);
        if (result.success) {
            // Update MongoDB
            db.collection('seats').updateMany(
                { movie_id: parseInt(movie_id), showtime_id: parseInt(showtime_id), seat_number: { $in: seats } },
                { $set: { is_booked: true } }
            );
        }
        res.json(result);
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});