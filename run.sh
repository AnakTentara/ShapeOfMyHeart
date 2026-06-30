#!/bin/bash
# Print commands and exit on error
set -e

echo "=== Pterodactyl Setup & Start Script ==="

# 1. Install dependencies
echo "Installing dependencies..."
npm install

# 2. Build production assets
echo "Building project assets..."
npm run build

# 3. Start preview host binding to all interfaces
# Pterodactyl defines SERVER_PORT. We fallback to PORT or 8080.
TARGET_PORT="${PORT:-${SERVER_PORT:-8080}}"
echo "Starting host server on port $TARGET_PORT..."

# Run preview server
npx vite preview --host 0.0.0.0 --port "$TARGET_PORT"
