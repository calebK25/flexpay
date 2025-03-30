#!/bin/bash

# Start the React development server on port 80
PORT=80 npm start &

# Wait for React server to start
sleep 5

# Start ngrok with configuration file
ngrok start --config ngrok.yml --all 