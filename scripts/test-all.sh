#!/bin/bash

# Build all
npm run build

# Start backend in background
npm run start -w @neshca/backend &

# Save the PID of the backend start process
PERSISTENT_PID=$!

# Kill process when this script ends
function kill_persistent_process {
    pkill -P $PERSISTENT_PID
    kill $PERSISTENT_PID
}

# Build cache-testing app
npm run build -w @neshca/cache-testing

# Run tests
npm run e2e -w @neshca/cache-testing

npm test

# Kill backend process and all its child processes
kill_persistent_process
