#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
cd web && npm install && cd ../server && npm install

# Configure environment variables
echo "Setting up environment variables..."
cat <<EOT > server/.env
DATABASE_URL=file:./dev.db?socket_timeout=10
LISTEN_PORT=3000
GPT_API_KEY=<your_openai_api_key>
WEB_IP=http://localhost
EOT

cat <<EOT > web/.env
VITE_API_URL="http://localhost:80/api"
EOT

# Run database migrations
echo "Running database migrations..."
cd server && npm run db

# Build the web application
echo "Building the web application..."
cd ../web && npm run build

# Final instructions
echo "Setup complete. To start the server, run the following command:"
echo "On Linux: npm start -- -b"
echo "On Windows: npm start -- -- -b"
