#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
cd web && npm install && cd ../server && npm install && cd ..

# Configure environment variables
echo "Setting up environment variables..."
touch server/.env
echo "DATABASE_URL=file:./dev.db?socket_timeout=10" > server/.env
echo "LISTEN_PORT=80" >> server/.env
echo "GPT_API_KEY=<your_openai_api_key>" >> server/.env
echo "WEB_IP=http://localhost" >> server/.env

touch web/.env
echo "VITE_API_URL=\"http://localhost:80/api\"" > web/.env

# Run database migrations
echo "Running database migrations..."
cd server && npm run db
  
# Build the web application
echo "Building the web application..."
cd ../web && npm run build

# Final instructions
echo "Setup complete. To start the server, run the following commands:"
echo "cd server"
echo "On Linux: sudo npm start -- -b"
echo "On Windows: sudo npm start -- -- -b"
