Below is a professional and concise `README.md` file tailored for your Movie Ticket Booking System repository on GitHub. It assumes the project structure and functionality we’ve been working on: a Node.js backend in a `node/` folder, a static frontend in a `frontend/` folder, a MongoDB database, and a `deploy.sh` script for local deployment. The README provides an overview, setup instructions, usage details, and troubleshooting tips, making it easy for others to understand and contribute to your project.

---

### `README.md`

```markdown
# Movie Ticket Booking System

A simple web-based movie ticket booking application built with Node.js, MongoDB, and a static HTML/CSS/JS frontend. Users can browse movies, view showtimes, select seats, and book tickets, mimicking real-world ticketing systems like BookMyShow or AMC Theatres.

## Features
- **Browse Movies**: View a list of movies with posters, genres, durations, and languages.
- **Showtime Selection**: Choose from multiple showtimes per movie.
- **Seat Selection**: Interactive 6x10 seat grid (60 seats per showtime) with real-time availability.
- **Booking**: Reserve seats and store bookings in MongoDB.
- **Deployment**: One-click local deployment with a Bash script.

## Project Structure
```
movie-ticket-booking/
├── frontend/             # Static frontend files
│   ├── index.html        # Main page
│   ├── script.js         # Frontend logic
│   └── styles.css        # Styling
├── node/                 # Node.js backend
│   ├── server.js         # Express server
│   ├── package.json      # Backend dependencies
│   └── package-lock.json # Dependency lock file
├── deploy.sh             # Deployment script
└── README.md             # This file
```

## Prerequisites
- **Node.js** (v14+ recommended): For the backend server.
- **MongoDB** (v4+): For storing movies, seats, and bookings.
- **Python 3**: For serving the frontend locally.
- **Git**: To clone and manage the repository.

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/movie-ticket-booking.git
cd movie-ticket-booking
```

### 2. Set Up MongoDB
1. Ensure MongoDB is installed and running:
   ```bash
   mongod
   ```
2. Open the MongoDB shell and initialize the database:
   ```bash
   mongo mongodb://localhost:27017/movieTicketDB
   ```
3. Run the following script to populate the database with 2 movies ("Inception" and "The Matrix") and a 60-seat layout:
   ```javascript
   use movieTicketDB;
   db.movies.drop();
   db.seats.drop();
   db.bookings.drop();
   db.movies.insertMany([
       {_id: 1, title: "Inception", genre: "Sci-Fi", language: "English", duration: 148, poster_url: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_FMjpg_UX1000_.jpg", showtimes: [{id: 1, time: ISODate("2025-03-22T18:00:00-07:00")}, {id: 2, time: ISODate("2025-03-23T20:30:00-07:00")}, {id: 3, time: ISODate("2025-03-24T15:00:00-07:00")}]},
       {_id: 2, title: "The Matrix", genre: "Action", language: "English", duration: 136, poster_url: "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_FMjpg_UX1000_.jpg", showtimes: [{id: 1, time: ISODate("2025-03-22T19:00:00-07:00")}, {id: 2, time: ISODate("2025-03-25T21:00:00-07:00")}, {id: 3, time: ISODate("2025-03-27T16:30:00-07:00")}]}
   ]);
   const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
   let seatData = [];
   for (let movieId = 1; movieId <= 2; movieId++) {
       const movie = db.movies.findOne({ _id: movieId });
       movie.showtimes.forEach(showtime => {
           rows.forEach(row => {
               for (let seatNum = 1; seatNum <= 10; seatNum++) {
                   seatData.push({movie_id: movieId, showtime_id: showtime.id, seat_number: `${row}${seatNum}`, is_booked: false});
               }
           });
       });
   }
   db.seats.insertMany(seatData);
   ```

### 3. Install Backend Dependencies
```bash
cd node
npm install
```

### 4. Deploy the Application
1. Make the deployment script executable:
   ```bash
   chmod +x deploy.sh
   ```
2. Run the deployment script from the root directory:
   ```bash
   ./deploy.sh
   ```

### 5. Access the Application
- **Frontend**: [http://localhost:8000](http://localhost:8000)
- **Backend API**: [http://localhost:8080](http://localhost:8080) (e.g., `/movies`, `/seats`)

## Usage
1. Open the frontend in your browser.
2. Browse the movie list (currently "Inception" and "The Matrix").
3. Select a showtime and choose seats from the 6x10 grid (A1–F10).
4. Book your tickets—selections are saved in MongoDB.
5. Stop the application by killing the processes:
   ```bash
   kill <backend_pid> <frontend_pid>  # PIDs displayed by deploy.sh
   ```

## Troubleshooting
- **"No such file or directory" Error**:
  - Ensure `node/` and `frontend/` folders exist with the required files.
  - Run `deploy.sh` from the root directory (`movie-ticket-booking/`).
- **"Failed to install Node.js dependencies"**:
  - Verify Node.js is installed: `node -v`.
  - Check the npm log: `cat ~/.npm/_logs/*.log`.
- **Ports Already in Use**:
  - Manually free ports:
    ```bash
    lsof -i :8000
    lsof -i :8080
    kill -9 <pid>
    ```
- **Booking History Persists**:
  - Drop the `bookings` collection:
    ```javascript
    use movieTicketDB;
    db.bookings.drop();
    ```

## Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.


## Acknowledgments
- Built with ❤️ by Arsalan Khan
- Inspired by real-world ticketing platforms.
```

