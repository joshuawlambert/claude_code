#!/bin/bash

# Check if running in WSL/Linux
if [[ "$(uname -a)" != *"Linux"* ]]; then
    echo "Error: This application must be run in Linux or WSL"
    echo "Please install and configure WSL if you're on Windows"
    exit 1
fi

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check if node version is >= 18
NODE_VERSION=$(node -v | cut -d'v' -f2)
if (( ${NODE_VERSION%%.*} < 18 )); then
    echo "Node.js version must be 18 or higher. Current version: $NODE_VERSION"
    exit 1
fi

# Install system dependencies
echo "Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y build-essential python3 python3-pip

# Clean install npm dependencies
echo "Installing npm dependencies..."
rm -rf node_modules package-lock.json
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "Creating .env.local..."
    echo "NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development" > .env.local
fi

# Try rebuilding node-pty specifically
echo "Rebuilding node-pty..."
npm rebuild node-pty

echo "Setup complete! You can now run 'npm run dev' to start the development server" 