const API_URL = 'http://localhost:8080';
let currentUser = null;
let selectedShowtimeId = null;
let selectedSeats = [];
let bookingHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    loadUser();
    fetchMovies();
});

function loadUser() {
    currentUser = localStorage.getItem('username');
    if (currentUser) {
        document.getElementById('user-info').style.display = 'inline';
        document.getElementById('username').innerText = currentUser;
        document.getElementById('login-username').style.display = 'none';
        document.getElementById('auth').querySelector('button').style.display = 'none';
        fetchBookingHistory();
    }
}

function login() {
    const username = document.getElementById('login-username').value;
    if (username) {
        localStorage.setItem('username', username);
        currentUser = username;
        loadUser();
    }
}

function logout() {
    localStorage.removeItem('username');
    currentUser = null;
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('login-username').style.display = 'inline';
    document.getElementById('auth').querySelector('button').style.display = 'inline';
    document.getElementById('booking-history').style.display = 'none';
}

function fetchMovies() {
    const genre = document.getElementById('genre-filter').value;
    const language = document.getElementById('language-filter').value;
    fetch(`${API_URL}/movies`)
        .then(response => response.json())
        .then(movies => {
            let filteredMovies = movies;
            if (genre) filteredMovies = filteredMovies.filter(m => m.genre === genre);
            if (language) filteredMovies = filteredMovies.filter(m => m.language === language);
            displayMovies(filteredMovies);
        });
}

function displayMovies(movies) {
    const movieDiv = document.getElementById('movies');
    movieDiv.innerHTML = '';
    movies.forEach(movie => {
        const div = document.createElement('div');
        div.className = 'movie';
        div.innerHTML = `
            <span>${movie.title} (${movie.duration} mins)</span>
            <button onclick="showShowtimes(${movie._id}, '${movie.title}')">Showtimes</button>
            <div class="trailer"><iframe width="200" height="150" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe></div>
        `;
        movieDiv.appendChild(div);
    });
    document.getElementById('movie-list').style.display = 'block';
}

function showShowtimes(movieId, movieTitle) {
    document.getElementById('movie-list').style.display = 'none';
    const showtimeSection = document.getElementById('showtime-selection');
    showtimeSection.style.display = 'block';
    fetch(`${API_URL}/movies`)
        .then(response => response.json())
        .then(movies => {
            const movie = movies.find(m => m._id === movieId);
            const showtimesDiv = document.getElementById('showtimes');
            showtimesDiv.innerHTML = '';
            movie.showtimes.forEach(showtime => {
                const div = document.createElement('div');
                div.className = 'showtime';
                div.innerText = showtime.time;
                div.onclick = () => showSeats(movieId, showtime.id, movieTitle);
                showtimesDiv.appendChild(div);
            });
        });
}

function showSeats(movieId, showtimeId, movieTitle) {
    selectedShowtimeId = showtimeId;
    selectedSeats = [];
    document.getElementById('showtime-selection').style.display = 'none';
    const seatSection = document.getElementById('seat-selection');
    seatSection.style.display = 'block';
    document.getElementById('selected-movie').innerText = `${movieTitle} (Showtime: ${showtimeId})`;

    fetch(`${API_URL}/seats?movie_id=${movieId}&showtime_id=${showtimeId}`)
        .then(response => response.json())
        .then(seats => {
            const seatsDiv = document.getElementById('seats');
            seatsDiv.innerHTML = '';
            for (let i = 1; i <= 20; i++) {
                const seat = seats.find(s => s.seat_number === i) || { seat_number: i, is_booked: false };
                const div = document.createElement('div');
                div.className = `seat ${seat.is_booked ? 'booked' : ''}`;
                div.innerText = seat.seat_number;
                if (!seat.is_booked) {
                    div.onclick = () => toggleSeat(seat.seat_number, div);
                }
                seatsDiv.appendChild(div);
            }
        });

    document.getElementById('proceed-btn').onclick = () => proceedToPayment(movieId, movieTitle);
}

function toggleSeat(seatNumber, element) {
    const index = selectedSeats.indexOf(seatNumber);
    if (index === -1) {
        selectedSeats.push(seatNumber);
        element.classList.add('selected');
    } else {
        selectedSeats.splice(index, 1);
        element.classList.remove('selected');
    }
}

function proceedToPayment(movieId, movieTitle) {
    if (selectedSeats.length === 0) {
        alert('Please select at least one seat!');
        return;
    }
    document.getElementById('seat-selection').style.display = 'none';
    const paymentSection = document.getElementById('payment');
    paymentSection.style.display = 'block';
    document.getElementById('total-amount').innerText = selectedSeats.length * 10; // $10 per seat
    document.getElementById('pay-btn').onclick = () => bookTickets(movieId, movieTitle);
}

function bookTickets(movieId, movieTitle) {
    fetch(`${API_URL}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_id: movieId, showtime_id: selectedShowtimeId, seats: selectedSeats })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Payment successful! Tickets booked.');
                if (currentUser) {
                    bookingHistory.push({ movie: movieTitle, showtime: selectedShowtimeId, seats: selectedSeats, date: new Date().toLocaleString() });
                    localStorage.setItem('bookingHistory', JSON.stringify(bookingHistory));
                    fetchBookingHistory();
                }
                document.getElementById('payment').style.display = 'none';
                document.getElementById('movie-list').style.display = 'block';
                fetchMovies();
            } else {
                alert('Booking failed: ' + data.error);
            }
        });
}

function fetchBookingHistory() {
    if (!currentUser) return;
    bookingHistory = JSON.parse(localStorage.getItem('bookingHistory')) || [];
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = '';
    bookingHistory.forEach(booking => {
        const div = document.createElement('div');
        div.innerText = `${booking.movie} - Showtime: ${booking.showtime}, Seats: ${booking.seats.join(', ')}, Booked on: ${booking.date}`;
        historyDiv.appendChild(div);
    });
    document.getElementById('booking-history').style.display = 'block';
}

document.getElementById('genre-filter').onchange = fetchMovies;
document.getElementById('language-filter').onchange = fetchMovies;