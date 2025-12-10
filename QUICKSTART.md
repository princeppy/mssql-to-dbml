# Quick Start Guide

## 🚀 Fastest Way (Zero Installation)

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -h localhost \
  -p 5433 \
  -d MyDatabase \
  -u sa \
  -P 'YourPassword'
```

**What happens:**
1. Downloads the script
2. Installs dependencies temporarily (if needed)
3. Connects to your database
4. Generates `MyDatabase.dbml` file
5. Cleans up temporary files

**No leftovers, no installation!**

---

## 📥 Download Once, Use Forever

If you'll use it multiple times:

```bash
# Download script
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh -o db2dbml
chmod +x db2dbml

# Use it anytime
./db2dbml -h localhost -p 5433 -d DB1 -u sa -P 'pass'
./db2dbml -h localhost -p 5433 -d DB2 -u sa -P 'pass'
```

---

## 🎯 Common Use Cases

### 1. Docker SQL Server

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -h localhost \
  -p 5433 \
  -d SampleDatabase \
  -u sa \
  -P 'SecureP@ssword'
```

### 2. Only Include Business Schemas

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -h localhost \
  -d MyApp \
  -u sa \
  -P 'pass' \
  -i "dbo,sales,inventory"
```

### 3. Exclude Test/System Schemas

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -h localhost \
  -d MyApp \
  -u sa \
  -P 'pass' \
  -e "sys,temp,test,INFORMATION_SCHEMA"
```

### 4. Custom Output Filename

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -h localhost \
  -d MyApp \
  -u sa \
  -P 'pass' \
  -o my-awesome-schema.dbml
```

### 5. Remote Azure SQL Server

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -h myserver.database.windows.net \
  -p 1433 \
  -d ProductionDB \
  -u admin \
  -P 'SecurePassword'
```

---

## 🔧 Using Connection String

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -c "Server=localhost,5433;Database=MyDB;User Id=sa;Password=pass;TrustServerCertificate=true"
```

---

## 📊 View Your Schema

After generation, you have a `.dbml` file. View it:

### Option 1: Online (Easiest)
1. Go to https://dbdiagram.io/
2. Click "Import"
3. Upload your `.dbml` file
4. See your diagram instantly!

### Option 2: VS Code
```bash
code --install-extension matt-meyers.vscode-dbml
code MyDatabase.dbml
```

### Option 3: Convert to Other Formats
```bash
npm install -g @dbml/cli

# Convert to PostgreSQL
dbml2sql MyDatabase.dbml --postgres > schema.sql

# Convert to MySQL
dbml2sql MyDatabase.dbml --mysql > schema.sql

# Convert to JSON
dbml2json MyDatabase.dbml
```

---

## 🔄 Automated Backups

### Daily Schema Backup Script

```bash
#!/bin/bash
# backup-schema.sh

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="./schema-backups/$DATE"
mkdir -p "$BACKUP_DIR"

curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -h localhost \
  -d MyDatabase \
  -u sa \
  -P 'password' \
  -o "$BACKUP_DIR/schema.dbml"

echo "✅ Schema backed up to: $BACKUP_DIR/schema.dbml"
```

Make it executable and add to cron:
```bash
chmod +x backup-schema.sh

# Run daily at 2 AM
crontab -e
# Add: 0 2 * * * /path/to/backup-schema.sh
```

### Multiple Databases

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

---

## 💡 Pro Tips

### 1. Use Environment Variables for Credentials

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

### 2. Create an Alias

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
alias db2dbml='curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s --'
```

Then use it simply:
```bash
db2dbml -h localhost -d MyDB -u sa -P 'pass'
```

### 3. Version Your Schema with Git

```bash
# Generate schema
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- \
  -h localhost -d MyDB -u sa -P 'pass' -o schema.dbml

# Commit to git
git add schema.dbml
git commit -m "Update database schema $(date +%Y-%m-%d)"
git push
```

---

## ❓ Troubleshooting

### Connection Refused

```bash
# Check if SQL Server is running
docker ps | grep sql

# Check if port is accessible
telnet localhost 5433
```

### Permission Denied

```bash
# Make sure you have the right credentials
docker exec -it <container> /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P 'YourPassword' -Q "SELECT @@VERSION"
```

### Node.js Not Found

The script will install Node.js dependencies temporarily if needed. Just run the curl command!

---

## 🆘 Get Help

```bash
curl -sSL https://raw.githubusercontent.com/princeppy/mssql-to-dbml/main/install.sh | bash -s -- --help
```

## 📖 More Examples

See [EXAMPLES.md](EXAMPLES.md) for more advanced usage scenarios.
