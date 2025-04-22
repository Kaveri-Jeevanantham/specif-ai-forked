#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up Knowledge Graph Module...${NC}\n"

# Function to check if a command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        return 1
    fi
    return 0
}

# Check prerequisites
echo "Checking prerequisites..."

# Check Node.js
if ! check_command "node"; then
    echo -e "${RED}Please install Node.js (>=18.17) first${NC}"
    exit 1
fi

# Check npm
if ! check_command "npm"; then
    echo -e "${RED}Please install npm first${NC}"
    exit 1
fi

# Check node version
NODE_VERSION=$(node -v | cut -d'v' -f2)
if [[ $(echo "$NODE_VERSION 18.17" | awk '{print ($1 < $2)}') -eq 1 ]]; then
    echo -e "${RED}Node.js version must be >= 18.17 (current: $NODE_VERSION)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites satisfied${NC}\n"

# Install dependencies
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Build TypeScript
echo "Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build TypeScript${NC}"
    exit 1
fi
echo -e "${GREEN}✓ TypeScript built successfully${NC}\n"

# Verify setup
echo "Verifying Knowledge Graph setup..."
npm run kg:verify

if [ $? -ne 0 ]; then
    echo -e "${RED}Setup verification failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Setup verified successfully${NC}\n"

# Run quick test
echo "Running quick test..."
npm run test:kg:quick

if [ $? -ne 0 ]; then
    echo -e "${RED}Quick test failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Quick test passed${NC}\n"

echo -e "${GREEN}Knowledge Graph Module setup completed successfully!${NC}\n"

echo -e "Available commands:"
echo -e "${YELLOW}npm run kg:visualize${NC} - Run visualization demo"
echo -e "${YELLOW}npm run test:kg:all${NC}  - Run all tests"
echo -e "${YELLOW}npm run kg:example${NC}    - Run document processor example"
echo -e "${YELLOW}npm run kg:clean${NC}      - Clean up generated files\n"

echo -e "For more information, see electron/knowledge-graph/README.md"
