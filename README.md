

# Movie Ticket Booking System

A simple web-based movie ticket booking application built with Node.js, MongoDB, and a static HTML/CSS/JS frontend. Users can browse movies, view showtimes, select seats, and book tickets, mimicking real-world ticketing systems like BookMyShow or AMC Theatres.

## Features
- **Browse Movies**: View a list of movies with posters, genres, durations, and languages.
- **Showtime Selection**: Choose from multiple showtimes per movie.
- **Seat Selection**: Interactive 6x10 seat grid (60 seats per showtime) with real-time availability.
- **Booking**: Reserve seats and store bookings in MongoDB.
- **Deployment**: One-click local deployment with a Bash script.



### Access the Application
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

