#!/bin/bash

# mssql-to-dbml.sh
# Generate DBML from Microsoft SQL Server databases
# Requires: sqlcmd or docker with SQL Server container

set -e

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

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help function
show_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Generate DBML from Microsoft SQL Server databases

OPTIONS:
    -h, --host HOST               Server host (default: localhost)
    -p, --port PORT               Server port (default: 1433)
    -d, --database DATABASE       Database name (required)
    -u, --user USER               Username (default: sa)
    -P, --password PASSWORD       Password (required)
    -o, --output FILE             Output file (default: <database>.dbml)
    -i, --include-schemas LIST    Comma-separated schemas to include
    -e, --exclude-schemas LIST    Comma-separated schemas to exclude
    -v, --verbose                 Show detailed output
    --help                        Show this help message

EXAMPLES:
    # Basic usage
    $0 -h localhost -p 5433 -d MyDB -u sa -P 'password'

    # Include only specific schemas
    $0 -d MyDB -P 'pass' -i "dbo,custom"

    # Exclude schemas
    $0 -d MyDB -P 'pass' -e "sys,temp,test"

    # With Docker container
    $0 -p 5433 -d SampleDatabase -P 'SecureP@ssword' -o schema.dbml

EOF
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
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
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

# Check if Node.js and the actual CLI tool is available
if command -v node &> /dev/null && [ -f "$(dirname "$0")/cli.js" ]; then
    echo -e "${BLUE}🚀 Using Node.js version...${NC}"
    
    ARGS=()
    ARGS+=(-h "$HOST")
    ARGS+=(-p "$PORT")
    ARGS+=(-d "$DATABASE")
    ARGS+=(-u "$USER")
    ARGS+=(-P "$PASSWORD")
    ARGS+=(-o "$OUTPUT")
    
    if [ -n "$INCLUDE_SCHEMAS" ]; then
        ARGS+=(-i "$INCLUDE_SCHEMAS")
    fi
    
    if [ -n "$EXCLUDE_SCHEMAS" ]; then
        ARGS+=(-e "$EXCLUDE_SCHEMAS")
    fi
    
    if [ "$VERBOSE" = true ]; then
        ARGS+=(-v)
    fi
    
    node "$(dirname "$0")/cli.js" "${ARGS[@]}"
    
else
    echo -e "${YELLOW}⚠️  Node.js not found or cli.js not available${NC}"
    echo -e "${BLUE}💡 Installing and running with npx...${NC}"
    
    # Build command
    CMD="npx mssql-to-dbml"
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
fi
