# Usage Examples

## Quick Start

### Using npx (Recommended)
```bash
npx mssql-to-dbml \
  -c "Server=localhost,5433;Database=SampleDatabase;User Id=sa;Password=SecureP@ssword;TrustServerCertificate=true"
```

### Using Bash Script
```bash
chmod +x mssql-to-dbml.sh

./mssql-to-dbml.sh \
  --host localhost \
  --port 5433 \
  --database SampleDatabase \
  --user sa \
  --password 'SecureP@ssword'
```

## Common Scenarios

### 1. Docker SQL Server (Azure SQL Edge)
```bash
# Using connection string
npx mssql-to-dbml \
  -c "Server=localhost,5433;Database=MyDB;User Id=sa;Password=MyP@ss123;TrustServerCertificate=true" \
  -o mydb-schema.dbml

# Using individual params
npx mssql-to-dbml \
  -h localhost \
  -p 5433 \
  -d MyDB \
  -u sa \
  -P 'MyP@ss123' \
  -o mydb-schema.dbml
```

### 2. Filter by Schemas

#### Include Only Business Schemas
```bash
npx mssql-to-dbml \
  -c "Server=localhost;Database=MyApp;User Id=sa;Password=pass" \
  --include-schemas "dbo,sales,inventory,hr" \
  -o business-schema.dbml
```

#### Exclude System and Test Schemas
```bash
npx mssql-to-dbml \
  -c "Server=localhost;Database=MyApp;User Id=sa;Password=pass" \
  --exclude-schemas "sys,temp,test,backup,archive,INFORMATION_SCHEMA" \
  -o production-schema.dbml
```

### 3. Multiple Databases
```bash
# Generate for multiple databases
for db in DB1 DB2 DB3; do
  npx mssql-to-dbml \
    -h localhost \
    -p 5433 \
    -d $db \
    -u sa \
    -P 'password' \
    -o "${db}-schema.dbml"
done
```

### 4. Remote Server
```bash
npx mssql-to-dbml \
  -h myserver.database.windows.net \
  -p 1433 \
  -d ProductionDB \
  -u admin \
  -P 'SecureP@ss' \
  -e "sys,INFORMATION_SCHEMA" \
  -o production.dbml
```

### 5. Using Environment Variables
```bash
# Set environment variables
export DB_HOST=localhost
export DB_PORT=5433
export DB_NAME=SampleDatabase
export DB_USER=sa
export DB_PASS='SecureP@ssword'

# Use them
npx mssql-to-dbml \
  -h $DB_HOST \
  -p $DB_PORT \
  -d $DB_NAME \
  -u $DB_USER \
  -P $DB_PASS
```

### 6. With Verbose Output
```bash
npx mssql-to-dbml \
  -c "Server=localhost;Database=MyDB;User Id=sa;Password=pass" \
  --verbose
```

## After Generation

### View Online
```bash
# Open the generated DBML file
open SampleDatabase.dbml

# Or go to https://dbdiagram.io/ and import the file
```

### Convert to Other Formats
```bash
# Install dbml CLI
npm install -g @dbml/cli

# Convert DBML to SQL
dbml2sql SampleDatabase.dbml --postgres > schema.sql
dbml2sql SampleDatabase.dbml --mysql > schema.sql

# Convert DBML to JSON
dbml2json SampleDatabase.dbml
```

### View in VS Code
```bash
# Install DBML Viewer extension
code --install-extension matt-meyers.vscode-dbml

# Open your DBML file
code SampleDatabase.dbml
```

## Automation Examples

### Daily Schema Backup
```bash
#!/bin/bash
# backup-schema.sh

DATE=$(date +%Y%m%d)
OUTPUT_DIR="./schema-backups"
mkdir -p $OUTPUT_DIR

npx mssql-to-dbml \
  -c "Server=localhost;Database=MyDB;User Id=sa;Password=pass" \
  -o "$OUTPUT_DIR/schema-$DATE.dbml"

echo "Schema backed up to: $OUTPUT_DIR/schema-$DATE.dbml"
```

### CI/CD Integration
```yaml
# .github/workflows/schema-export.yml
name: Export Database Schema

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
  workflow_dispatch:

jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Export Schema
        run: |
          npx mssql-to-dbml \
            -h ${{ secrets.DB_HOST }} \
            -d ${{ secrets.DB_NAME }} \
            -u ${{ secrets.DB_USER }} \
            -P ${{ secrets.DB_PASSWORD }} \
            -o schema.dbml
      
      - name: Commit Schema
        run: |
          git config user.name "Bot"
          git config user.email "bot@example.com"
          git add schema.dbml
          git commit -m "Update schema [skip ci]"
          git push
```

## Troubleshooting

### Connection Timeout
```bash
# Add connection timeout to connection string
npx mssql-to-dbml \
  -c "Server=localhost;Database=MyDB;User Id=sa;Password=pass;Connection Timeout=30"
```

### Special Characters in Password
```bash
# Use single quotes for passwords with special characters
npx mssql-to-dbml \
  -h localhost \
  -d MyDB \
  -u sa \
  -P 'P@ssw0rd!@#$%^&*()'
```

### Large Databases
```bash
# For large databases, exclude unnecessary schemas
npx mssql-to-dbml \
  -c "Server=localhost;Database=LargeDB;User Id=sa;Password=pass" \
  -e "sys,temp,backup,archive,logs,INFORMATION_SCHEMA" \
  -o large-db-core.dbml
```
