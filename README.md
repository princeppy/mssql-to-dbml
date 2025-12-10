# mssql-to-dbml

Generate DBML (Database Markup Language) files from Microsoft SQL Server databases running locally or in Docker.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start (No Installation Required!)

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -h localhost \
  -p 5433 \
  -d SampleDatabase \
  -u sa \
  -P 'SecureP@ssword'
```

That's it! The script will generate a `.dbml` file in your current directory.

## 📥 Installation Options

### Option 1: One-Line Command (Recommended)

No installation needed! Just run:

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- [OPTIONS]
```

### Option 2: Download Script Once, Use Multiple Times

```bash
# Download the script
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh -o mssql-to-dbml.sh
chmod +x mssql-to-dbml.sh

# Use it anytime
./mssql-to-dbml.sh -h localhost -p 5433 -d MyDB -u sa -P 'password'
./mssql-to-dbml.sh -h localhost -p 5433 -d AnotherDB -u sa -P 'password'
```

### Option 3: Clone Repository

```bash
git clone https://github.com/princeppy/mssql-to-dbml.git
cd mssql-to-dbml
npm install
node cli.js -h localhost -p 5433 -d MyDB -u sa -P 'password'
```

## 📖 Usage

### Basic Usage

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -h localhost \
  -p 5433 \
  -d SampleDatabase \
  -u sa \
  -P 'SecureP@ssword'
```

### With Connection String

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -c "Server=localhost,5433;Database=MyDB;User Id=sa;Password=pass;TrustServerCertificate=true"
```

### Include Only Specific Schemas

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -h localhost \
  -p 5433 \
  -d MyDB \
  -u sa \
  -P 'password' \
  --include-schemas "dbo,sales,inventory"
```

### Exclude Specific Schemas

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -h localhost \
  -p 5433 \
  -d MyDB \
  -u sa \
  -P 'password' \
  --exclude-schemas "sys,temp,test,INFORMATION_SCHEMA"
```

Default excluded schemas: `sys`, `INFORMATION_SCHEMA`

### Custom Output File

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -h localhost \
  -p 5433 \
  -d MyDB \
  -u sa \
  -P 'password' \
  -o my-custom-schema.dbml
```

## 🎯 Options

```
  -h, --host HOST               Server host (default: localhost)
  -p, --port PORT               Server port (default: 1433)
  -d, --database DATABASE       Database name (required)
  -u, --user USER               Username (default: sa)
  -P, --password PASSWORD       Password (required)
  -c, --connection-string       Use connection string instead
  -o, --output FILE             Output file (default: <database>.dbml)
  -i, --include-schemas LIST    Include only these schemas (comma-separated)
  -e, --exclude-schemas LIST    Exclude these schemas (comma-separated)
  -v, --verbose                 Show detailed error messages
  --help                        Display help
```

## 📋 Examples

### Docker SQL Server on Custom Port

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -h localhost \
  -p 5433 \
  -d SampleDatabase \
  -u sa \
  -P 'SecureP@ssword' \
  -o database-schema.dbml
```

### Save Script Locally for Repeated Use

```bash
# Download once
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh -o db2dbml
chmod +x db2dbml

# Use multiple times
./db2dbml -h localhost -p 5433 -d DB1 -u sa -P 'pass'
./db2dbml -h localhost -p 5433 -d DB2 -u sa -P 'pass'
./db2dbml -h localhost -p 5433 -d DB3 -u sa -P 'pass'
```

### Include Only Business Schemas

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -c "Server=localhost;Database=MyApp;User Id=sa;Password=pass" \
  -i "dbo,sales,inventory,hr" \
  -o myapp-schema.dbml
```

### Exclude Test and System Schemas

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -c "Server=localhost;Database=MyApp;User Id=sa;Password=pass" \
  -e "sys,temp,test,backup,INFORMATION_SCHEMA"
```

### Export Multiple Databases

```bash
#!/bin/bash
# Export all databases

DATABASES=("DB1" "DB2" "DB3" "DB4")

for db in "${DATABASES[@]}"; do
  echo "Exporting $db..."
  curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
    -h localhost \
    -p 5433 \
    -d "$db" \
    -u sa \
    -P 'password' \
    -o "${db}-schema.dbml"
done

echo "✅ All databases exported!"
```

## ✨ Features

- ✅ **Zero installation** - Run directly with curl
- ✅ Generates complete DBML schema
- ✅ Includes all tables, columns, and data types
- ✅ Captures primary keys and auto-increment fields
- ✅ Extracts foreign key relationships with cascade actions
- ✅ Includes unique constraints
- ✅ Captures default values
- ✅ Schema filtering (include/exclude)
- ✅ Works with Docker containers
- ✅ Connection string or individual parameters
- ✅ Auto-cleanup (no leftover files)

## 📊 Viewing Your Schema

Once you have the `.dbml` file:

### Option 1: Online (Easiest)
1. Go to https://dbdiagram.io/
2. Click "Import" or paste your DBML content
3. View your interactive database diagram!

### Option 2: VS Code Extension
```bash
code --install-extension matt-meyers.vscode-dbml
code YourDatabase.dbml
```

### Option 3: Convert to Other Formats
```bash
npm install -g @dbml/cli

# Convert to PostgreSQL
dbml2sql schema.dbml --postgres > schema.sql

# Convert to MySQL  
dbml2sql schema.dbml --mysql > schema.sql

# Convert to JSON
dbml2json schema.dbml
```

## 💡 Pro Tips

### Create an Alias

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
alias db2dbml='curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s --'
```

Then simply use:
```bash
db2dbml -h localhost -d MyDB -u sa -P 'pass'
```

### Use Environment Variables

```bash
export DB_HOST=localhost
export DB_PORT=5433
export DB_USER=sa
export DB_PASS='SecureP@ssword'

curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -d MyDatabase \
  -u "$DB_USER" \
  -P "$DB_PASS"
```

### Automated Daily Backup

```bash
#!/bin/bash
# backup-schema.sh

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="./schema-backups/$DATE"
mkdir -p "$BACKUP_DIR"

curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -h localhost \
  -p 5433 \
  -d MyDatabase \
  -u sa \
  -P 'password' \
  -o "$BACKUP_DIR/schema.dbml"

echo "✅ Schema backed up to: $BACKUP_DIR/schema.dbml"
```

Add to crontab for daily execution:
```bash
chmod +x backup-schema.sh
crontab -e
# Add: 0 2 * * * /path/to/backup-schema.sh
```

## 📦 Requirements

- **bash** or **sh** shell
- **curl** (pre-installed on most systems)
- **Node.js 14+** (will be installed temporarily if not available)
- Access to SQL Server database

## 🔧 Troubleshooting

### Connection Issues

```bash
# Check if SQL Server is running
docker ps | grep sql

# Test connection
docker exec -it <container-name> /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P 'password' -Q "SELECT @@VERSION"
```

### Port Issues

```bash
# Check if port is accessible
telnet localhost 5433

# Or use nc
nc -zv localhost 5433
```

### Permission Denied

Make sure your password and username are correct.

### Script Not Found

Wait a few moments after pushing to GitHub, then try again.

## 📚 Additional Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Fast setup and common examples
- **[Examples](EXAMPLES.md)** - Advanced usage scenarios
- **[GitHub Repository](https://github.com/princeppy/mssql-to-dbml)** - Source code

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built with:
- Node.js
- mssql package
- commander.js

## 📞 Support

If you encounter any issues:
1. Check the [Examples](EXAMPLES.md) documentation
2. Open an issue on [GitHub](https://github.com/princeppy/mssql-to-dbml/issues)

---

Made with ❤️ by [princeppy](https://github.com/princeppy)
