const API_URL = 'http://localhost:8080';
let token = null;
let selectedShowtimeId = null;
let selectedSeats = [];

document.addEventListener('DOMContentLoaded', () => {
    loadUser();
    fetchMovies();
});

function loadUser() {
    token = localStorage.getItem('token');
    if (token) {
        try {
            const decoded = jwt_decode(token);
            document.getElementById('user-info').style.display = 'inline';
            document.getElementById('username').innerText = decoded.username;
            document.getElementById('login-username').style.display = 'none';
            document.getElementById('login-password').style.display = 'none';
            document.getElementById('auth').querySelector('button').style.display = 'none';
            fetchBookingHistory();
        } catch (error) {
            console.error('Error decoding token:', error);
            logout();
        }
    }
}

function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
        .then(response => {
            if (!response.ok) throw new Error('Login failed');
            return response.json();
        })
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                token = data.token;
                loadUser();
            } else {
                alert('Login failed: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            alert('Login error: ' + error.message);
        });
}

function logout() {
    localStorage.removeItem('token');
    token = null;
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('login-username').style.display = 'inline';
    document.getElementById('login-password').style.display = 'inline';
    document.getElementById('auth').querySelector('button').style.display = 'inline';
    document.getElementById('booking-history').style.display = 'none';
}

function fetchMovies() {
    const genre = document.getElementById('genre-filter').value;
    const language = document.getElementById('language-filter').value;
    console.log('Fetching movies from:', `${API_URL}/movies`);
    fetch(`${API_URL}/movies`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(movies => {
            console.log('Movies fetched:', movies);
            let filteredMovies = movies;
            if (genre) filteredMovies = filteredMovies.filter(m => m.genre === genre);
            if (language) filteredMovies = filteredMovies.filter(m => m.language === language);
            displayMovies(filteredMovies);
        })
        .catch(error => {
            console.error('Fetch movies error:', error);
            document.getElementById('movies').innerHTML = '<p>Error loading movies. Please try again later.</p>';
        });
}

function displayMovies(movies) {
    const movieDiv = document.getElementById('movies');
    movieDiv.innerHTML = '';
    movies.forEach(movie => {
        console.log('Rendering movie:', movie);
        let trailerUrl = movie.trailer_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // Fallback
        if (!trailerUrl.startsWith('https://www.youtube.com/embed/')) {
            console.warn(`Invalid trailer URL for ${movie.title}: ${trailerUrl}, using fallback`);
            trailerUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
        }
        const div = document.createElement('div');
        div.className = 'movie';
        div.innerHTML = `
            <span>${movie.title} (${movie.duration} mins)</span>
            <button onclick="showShowtimes(${movie._id}, '${movie.title}', '${trailerUrl}')">Showtimes</button>
            <div class="trailer"><iframe width="200" height="150" src="${trailerUrl}" frameborder="0" allowfullscreen></iframe></div>
        `;
        movieDiv.appendChild(div);
    });
    document.getElementById('movie-list').style.display = 'block';
}

function showShowtimes(movieId, movieTitle, trailerUrl) {
    document.getElementById('movie-list').style.display = 'none';
    const showtimeSection = document.getElementById('showtime-selection');
    showtimeSection.style.display = 'block';
    fetch(`${API_URL}/movies`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch movies');
            return response.json();
        })
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
        })
        .catch(error => console.error('Showtimes fetch error:', error));
}

function showSeats(movieId, showtimeId, movieTitle) {
    selectedShowtimeId = showtimeId;
    selectedSeats = [];
    document.getElementById('showtime-selection').style.display = 'none';
    const seatSection = document.getElementById('seat-selection');
    seatSection.style.display = 'block';
    document.getElementById('selected-movie').innerText = `${movieTitle} (Showtime: ${showtimeId})`;

    fetch(`${API_URL}/seats?movie_id=${movieId}&showtime_id=${showtimeId}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch seats');
            return response.json();
        })
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
        })
        .catch(error => console.error('Seats fetch error:', error));

    // Changed to directly book tickets
    document.getElementById('proceed-btn').onclick = () => bookTickets(movieId, selectedShowtimeId);
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

// Removed proceedToPayment function since payment is no longer needed

function bookTickets(movieId, showtimeId) { // Adjusted parameters to use global selectedSeats
    if (!selectedSeats || selectedSeats.length === 0) {
        alert('Please select at least one seat!');
        return;
    }
    if (!token) {
        alert('Please log in to book tickets.');
        return;
    }
    fetch(`${API_URL}/book`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            movie_id: movieId,
            showtime_id: showtimeId,
            seats: selectedSeats
        })
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Tickets booked successfully!');
                document.getElementById('seat-selection').style.display = 'none';
                fetchBookingHistory(); // Refresh history after booking
            } else {
                alert('Booking failed: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Booking error:', error);
            alert('Booking error: ' + error.message);
        });
}

function fetchBookingHistory() {
    if (!token) return;
    fetch(`${API_URL}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch history');
            return response.json();
        })
        .then(bookings => {
            const historyDiv = document.getElementById('history');
            historyDiv.innerHTML = '';
            bookings.forEach(booking => {
                const div = document.createElement('div');
                div.innerText = `${booking.movie_id} - Showtime: ${booking.showtime_id}, Seats: ${booking.seats.join(', ')}, Booked on: ${new Date(booking.date).toLocaleString()}`;
                historyDiv.appendChild(div);
            });
            document.getElementById('booking-history').style.display = 'block';
        })
        .catch(error => console.error('History fetch error:', error));
}

document.getElementById('genre-filter').onchange = fetchMovies;
document.getElementById('language-filter').onchange = fetchMovies;