#!/bin/bash

# Build C binary with custom json-c include path and booking.h
cd backend/src
gcc -o book_seat booking.c -I/opt/homebrew/opt/json-c/include -I../include -L/opt/homebrew/opt/json-c/lib -ljson-c
if [ $? -ne 0 ]; then
    echo "Failed to compile C code. Check json-c installation or paths."
    exit 1
fi

# Install Node.js dependencies
cd ../node
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install Node.js dependencies"
    exit 1
fi

# Start MongoDB (assumes Docker; adjust if installed differently)

# Start backend (Node.js server)
npm start &
BACKEND_PID=$!
echo "Backend started with PID $BACKEND_PID"

# Serve frontend
cd ../../frontend
python -m http.server 8000 &
FRONTEND_PID=$!
echo "Frontend started with PID $FRONTEND_PID"

# Display running info
echo "Application running:"
echo "  - Frontend: http://localhost:8000"
echo "  - Backend API: http://localhost:8080"
echo "To stop, run: kill $BACKEND_PID $FRONTEND_PID"