#!/bin/bash

# Function to kill process on a port and verify
kill_port() {
    PORT=$1
    for i in {1..3}; do  # Retry up to 3 times
        PIDS=$(lsof -t -i :$PORT)
        if [ -n "$PIDS" ]; then
            echo "Killing processes on port $PORT (PIDs: $PIDS)"
            echo "$PIDS" | xargs kill -9
            sleep 1  # Wait for processes to terminate
            if lsof -t -i :$PORT > /dev/null; then
                echo "Warning: Processes on port $PORT still running, retrying..."
            else
                echo "Port $PORT cleared"
                return 0
            fi
        else
            echo "Port $PORT is already free"
            return 0
        fi
    done
    echo "Error: Failed to free port $PORT after retries"
    exit 1
}

# Fallback: Kill all Node.js and Python processes
echo "Killing all Node.js and Python processes as a precaution..."
pkill -9 node
pkill -9 python
sleep 2  # Ensure processes are fully terminated

# Free up ports 8000 and 8080
kill_port 8000
kill_port 8080

# Build C binary with custom json-c include path and booking.h


# Install Node.js dependencies
cd ../node
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install Node.js dependencies"
    exit 1
fi

# Start backend (Node.js server)
npm start &
BACKEND_PID=$!
echo "Backend started with PID $BACKEND_PID"
sleep 2  # Give backend time to start

# Verify backend is running
if lsof -t -i :8080 > /dev/null; then
    echo "Backend confirmed running on port 8080"
else
    echo "Error: Backend failed to start on port 8080"
    kill $BACKEND_PID
    exit 1
fi

# Serve frontend
cd ../../frontend
python -m http.server 8000 &
FRONTEND_PID=$!
echo "Frontend started with PID $FRONTEND_PID"
sleep 2  # Give frontend time to start

# Verify frontend is running
if lsof -t -i :8000 > /dev/null; then
    echo "Frontend confirmed running on port 8000"
else
    echo "Error: Frontend failed to start on port 8000"
    kill $FRONTEND_PID
    exit 1
fi

# Display running info
echo "Application running:"
echo "  - Frontend: http://localhost:8000"
echo "  - Backend API: http://localhost:8080"
echo "To stop, run: kill $BACKEND_PID $FRONTEND_PID"