#!/bin/bash
#
# mssql-to-dbml - Generate DBML from Microsoft SQL Server
# Usage: curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- [OPTIONS]
#
# Standalone version - works without pre-installing anything
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Default values
HOST="localhost"
PORT="1433"
DATABASE=""
USER="sa"
PASSWORD=""
OUTPUT=""
INCLUDE_SCHEMAS=""
EXCLUDE_SCHEMAS="sys,INFORMATION_SCHEMA"
VERBOSE=false
TEMP_DIR=""

# Cleanup function
cleanup() {
    if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
}

trap cleanup EXIT

# Help function
show_help() {
    echo -e "${CYAN}mssql-to-dbml${NC} - Generate DBML from Microsoft SQL Server"
    echo ""
    echo -e "${YELLOW}USAGE:${NC}"
    echo "    curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- [OPTIONS]"
    echo ""
    echo -e "${YELLOW}OPTIONS:${NC}"
    echo "    -h, --host HOST               Server host (default: localhost)"
    echo "    -p, --port PORT               Server port (default: 1433)"
    echo -e "    -d, --database DATABASE       Database name ${RED}(required)${NC}"
    echo "    -u, --user USER               Username (default: sa)"
    echo -e "    -P, --password PASSWORD       Password ${RED}(required)${NC}"
    echo "    -o, --output FILE             Output file (default: <database>.dbml)"
    echo "    -i, --include-schemas LIST    Include only these schemas (comma-separated)"
    echo "    -e, --exclude-schemas LIST    Exclude these schemas (default: sys,INFORMATION_SCHEMA)"
    echo "    -v, --verbose                 Show detailed output"
    echo "    --help                        Show this help message"
    echo ""
    echo -e "${YELLOW}EXAMPLES:${NC}"
    echo "    # Basic usage"
    echo "    curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \\"
    echo "      -h localhost -p 5433 -d MyDB -u sa -P 'password'"
    echo ""
    echo "    # Include only specific schemas"
    echo "    curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \\"
    echo "      -d MyDB -P 'pass' -i \"dbo,custom\""
    echo ""
    echo "    # With custom output file"
    echo "    curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \\"
    echo "      -h localhost -p 5433 -d MyDB -P 'pass' -o schema.dbml"
    echo ""
    echo -e "${YELLOW}REQUIREMENTS:${NC}"
    echo "    - Node.js 14+ (will use npx if available)"
    echo "    - OR the script will install dependencies temporarily"
    echo ""
    echo -e "${YELLOW}REPOSITORY:${NC}"
    echo "    https://github.com/princeppy/mssql-to-dbml"
    echo ""
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            HOST="$2"
            shift 2
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -d|--database)
            DATABASE="$2"
            shift 2
            ;;
        -u|--user)
            USER="$2"
            shift 2
            ;;
        -P|--password)
            PASSWORD="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT="$2"
            shift 2
            ;;
        -i|--include-schemas)
            INCLUDE_SCHEMAS="$2"
            shift 2
            ;;
        -e|--exclude-schemas)
            EXCLUDE_SCHEMAS="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$DATABASE" ]; then
    echo -e "${RED}❌ Error: Database name is required${NC}"
    echo "Use --help for usage information"
    exit 1
fi

if [ -z "$PASSWORD" ]; then
    echo -e "${RED}❌ Error: Password is required${NC}"
    exit 1
fi

# Set output file
if [ -z "$OUTPUT" ]; then
    OUTPUT="${DATABASE}.dbml"
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  mssql-to-dbml - Database Schema Exporter${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if Node.js is available
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js found: $NODE_VERSION"
    
    # Check if npx is available
    if command -v npx &> /dev/null; then
        echo -e "${GREEN}✓${NC} Using npx to run mssql-to-dbml"
        echo ""
        
        # Build npx command
        CMD="npx -y mssql-to-dbml"
        CMD="$CMD -h \"$HOST\""
        CMD="$CMD -p \"$PORT\""
        CMD="$CMD -d \"$DATABASE\""
        CMD="$CMD -u \"$USER\""
        CMD="$CMD -P \"$PASSWORD\""
        CMD="$CMD -o \"$OUTPUT\""
        
        if [ -n "$INCLUDE_SCHEMAS" ]; then
            CMD="$CMD -i \"$INCLUDE_SCHEMAS\""
        fi
        
        if [ -n "$EXCLUDE_SCHEMAS" ]; then
            CMD="$CMD -e \"$EXCLUDE_SCHEMAS\""
        fi
        
        if [ "$VERBOSE" = true ]; then
            CMD="$CMD -v"
        fi
        
        eval $CMD
        exit 0
    fi
fi

# If Node.js is not available, create temporary Node.js environment
echo -e "${YELLOW}⚠️${NC}  Node.js not found. Installing temporarily..."
echo ""

# Create temporary directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo -e "${BLUE}📦 Setting up temporary environment...${NC}"

# Download package files from GitHub
REPO_URL="https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main"

echo "Downloading package.json..."
curl -sSL "$REPO_URL/package.json" -o package.json

echo "Downloading cli.js..."
curl -sSL "$REPO_URL/cli.js" -o cli.js

chmod +x cli.js

# Install dependencies
echo -e "${BLUE}📥 Installing dependencies...${NC}"
npm install --silent 2>/dev/null || {
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
}

echo ""
echo -e "${GREEN}✓${NC} Setup complete. Generating DBML..."
echo ""

# Build command
CMD="node cli.js"
CMD="$CMD -h \"$HOST\""
CMD="$CMD -p \"$PORT\""
CMD="$CMD -d \"$DATABASE\""
CMD="$CMD -u \"$USER\""
CMD="$CMD -P \"$PASSWORD\""
CMD="$CMD -o \"$(pwd)/$OUTPUT\""

if [ -n "$INCLUDE_SCHEMAS" ]; then
    CMD="$CMD -i \"$INCLUDE_SCHEMAS\""
fi

if [ -n "$EXCLUDE_SCHEMAS" ]; then
    CMD="$CMD -e \"$EXCLUDE_SCHEMAS\""
fi

if [ "$VERBOSE" = true ]; then
    CMD="$CMD -v"
fi

# Run the command
eval $CMD

# Copy output file back to original directory
if [ -f "$OUTPUT" ]; then
    cp "$OUTPUT" "$OLDPWD/$OUTPUT"
    echo ""
    echo -e "${GREEN}✓${NC} Output file: $OLDPWD/$OUTPUT"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"