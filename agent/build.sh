#!/bin/bash
set -e
mkdir -p dist
echo "Building for Linux amd64..."
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o dist/agent-linux-amd64 .
echo "Building for Linux arm64..."
GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o dist/agent-linux-arm64 .
echo "Building for Windows amd64..."
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o dist/agent-windows-amd64.exe .
echo ""
echo "Binaries built in agent/dist/:"
ls -lh dist/
