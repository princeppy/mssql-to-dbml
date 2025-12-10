#!/usr/bin/env node

const { program } = require('commander');
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Parse connection string into config object
function parseConnectionString(connStr) {
    const config = {
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    };
    
    const params = connStr.split(';').filter(p => p.trim());
    
    for (const param of params) {
        const [key, ...valueParts] = param.split('=');
        const value = valueParts.join('=').trim();
        const keyLower = key.trim().toLowerCase();
        
        if (keyLower === 'server' || keyLower === 'data source') {
            const [host, port] = value.split(',');
            config.server = host;
            if (port) config.port = parseInt(port);
        } else if (keyLower === 'database' || keyLower === 'initial catalog') {
            config.database = value;
        } else if (keyLower === 'user id' || keyLower === 'uid') {
            config.user = value;
        } else if (keyLower === 'password' || keyLower === 'pwd') {
            config.password = value;
        } else if (keyLower === 'trustservercertificate') {
            config.options.trustServerCertificate = value.toLowerCase() === 'true';
        } else if (keyLower === 'encrypt') {
            config.options.encrypt = value.toLowerCase() === 'true';
        }
    }
    
    return config;
}

// Main function to generate DBML
async function generateDBML(options) {
    let config;
    
    // Parse connection string or build from parameters
    if (options.connectionString) {
        config = parseConnectionString(options.connectionString);
    } else {
        config = {
            server: options.host || 'localhost',
            port: options.port ? parseInt(options.port) : 1433,
            database: options.database,
            user: options.user,
            password: options.password,
            options: {
                encrypt: true,
                trustServerCertificate: true
            }
        };
    }
    
    // Validate required fields
    if (!config.database) {
        console.error('❌ Error: Database name is required');
        process.exit(1);
    }
    
    // Parse schema filters
    const includeSchemas = options.includeSchemas ? options.includeSchemas.split(',').map(s => s.trim()) : null;
    const excludeSchemas = options.excludeSchemas ? options.excludeSchemas.split(',').map(s => s.trim()) : ['sys', 'INFORMATION_SCHEMA'];
    
    try {
        console.log('🔌 Connecting to database...');
        console.log(`   Server: ${config.server}:${config.port || 1433}`);
        console.log(`   Database: ${config.database}`);
        if (includeSchemas) {
            console.log(`   Include schemas: ${includeSchemas.join(', ')}`);
        }
        if (excludeSchemas.length > 0) {
            console.log(`   Exclude schemas: ${excludeSchemas.join(', ')}`);
        }
        
        await sql.connect(config);
        
        console.log('📊 Fetching tables and columns...');
        
        // Build schema filter clause
        let schemaFilter = '';
        if (includeSchemas && includeSchemas.length > 0) {
            schemaFilter = `AND t.TABLE_SCHEMA IN (${includeSchemas.map(s => `'${s}'`).join(',')})`;
        } else if (excludeSchemas && excludeSchemas.length > 0) {
            schemaFilter = `AND t.TABLE_SCHEMA NOT IN (${excludeSchemas.map(s => `'${s}'`).join(',')})`;
        }
        
        const result = await sql.query`
            SELECT 
                t.TABLE_SCHEMA,
                t.TABLE_NAME,
                c.COLUMN_NAME,
                c.DATA_TYPE,
                c.CHARACTER_MAXIMUM_LENGTH,
                c.NUMERIC_PRECISION,
                c.NUMERIC_SCALE,
                c.IS_NULLABLE,
                c.COLUMN_DEFAULT,
                CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as IS_PK,
                CASE WHEN ic.is_identity = 1 THEN 1 ELSE 0 END as IS_IDENTITY,
                CASE WHEN uq.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as IS_UNIQUE
            FROM INFORMATION_SCHEMA.TABLES t
            JOIN INFORMATION_SCHEMA.COLUMNS c 
                ON t.TABLE_NAME = c.TABLE_NAME 
                AND t.TABLE_SCHEMA = c.TABLE_SCHEMA
            LEFT JOIN (
                SELECT ku.TABLE_SCHEMA, ku.TABLE_NAME, ku.COLUMN_NAME
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
                    ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                    AND tc.TABLE_SCHEMA = ku.TABLE_SCHEMA
                WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
            ) pk ON c.TABLE_NAME = pk.TABLE_NAME 
                AND c.COLUMN_NAME = pk.COLUMN_NAME
                AND c.TABLE_SCHEMA = pk.TABLE_SCHEMA
            LEFT JOIN (
                SELECT ku.TABLE_SCHEMA, ku.TABLE_NAME, ku.COLUMN_NAME
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
                    ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                    AND tc.TABLE_SCHEMA = ku.TABLE_SCHEMA
                WHERE tc.CONSTRAINT_TYPE = 'UNIQUE'
            ) uq ON c.TABLE_NAME = uq.TABLE_NAME 
                AND c.COLUMN_NAME = uq.COLUMN_NAME
                AND c.TABLE_SCHEMA = uq.TABLE_SCHEMA
            LEFT JOIN sys.columns ic 
                ON ic.object_id = OBJECT_ID(t.TABLE_SCHEMA + '.' + t.TABLE_NAME)
                AND ic.name = c.COLUMN_NAME
            WHERE t.TABLE_TYPE = 'BASE TABLE'
                ${schemaFilter}
            ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME, c.ORDINAL_POSITION
        `.replace('${schemaFilter}', schemaFilter);
        
        let output = [];
        output.push(`// Generated from database: ${config.database}`);
        output.push(`// Server: ${config.server}:${config.port || 1433}`);
        output.push(`// Generated at: ${new Date().toISOString()}`);
        output.push('');
        
        let currentTable = null;
        let tableCount = 0;
        let columnCount = 0;
        
        for (const row of result.recordset) {
            const tableFull = `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`;
            
            if (tableFull !== currentTable) {
                if (currentTable) output.push('}\n');
                output.push(`Table ${tableFull} {`);
                currentTable = tableFull;
                tableCount++;
            }
            
            // Format data type
            let type = row.DATA_TYPE;
            if (row.CHARACTER_MAXIMUM_LENGTH && ['varchar','nvarchar','char','nchar'].includes(row.DATA_TYPE)) {
                const len = row.CHARACTER_MAXIMUM_LENGTH === -1 ? 'max' : row.CHARACTER_MAXIMUM_LENGTH;
                type = `${row.DATA_TYPE}(${len})`;
            } else if (row.NUMERIC_PRECISION && ['decimal','numeric'].includes(row.DATA_TYPE)) {
                if (row.NUMERIC_SCALE) {
                    type = `${row.DATA_TYPE}(${row.NUMERIC_PRECISION},${row.NUMERIC_SCALE})`;
                } else {
                    type = `${row.DATA_TYPE}(${row.NUMERIC_PRECISION})`;
                }
            }
            
            // Build attributes
            let attrs = [];
            if (row.IS_PK) attrs.push('pk');
            if (row.IS_IDENTITY) attrs.push('increment');
            if (row.IS_UNIQUE && !row.IS_PK) attrs.push('unique');
            if (row.IS_NULLABLE === 'YES') attrs.push('null');
            
            // Add default value if exists
            if (row.COLUMN_DEFAULT) {
                let defaultVal = row.COLUMN_DEFAULT.trim();
                // Clean up SQL Server default syntax
                defaultVal = defaultVal.replace(/^\(+/, '').replace(/\)+$/, '');
                defaultVal = defaultVal.replace(/^'/, '').replace(/'$/, '');
                if (defaultVal && defaultVal !== 'NULL') {
                    attrs.push(`default: '${defaultVal}'`);
                }
            }
            
            const attrStr = attrs.length ? ` [${attrs.join(', ')}]` : '';
            output.push(`  ${row.COLUMN_NAME} ${type}${attrStr}`);
            columnCount++;
        }
        
        if (currentTable) output.push('}\n');
        
        console.log(`   ✓ Found ${tableCount} tables with ${columnCount} columns`);
        
        // Get foreign keys with schema filter
        console.log('🔗 Fetching foreign key relationships...');
        
        let fkSchemaFilter = '';
        if (includeSchemas && includeSchemas.length > 0) {
            fkSchemaFilter = `WHERE OBJECT_SCHEMA_NAME(fk.parent_object_id) IN (${includeSchemas.map(s => `'${s}'`).join(',')})`;
        } else if (excludeSchemas && excludeSchemas.length > 0) {
            fkSchemaFilter = `WHERE OBJECT_SCHEMA_NAME(fk.parent_object_id) NOT IN (${excludeSchemas.map(s => `'${s}'`).join(',')})`;
        }
        
        const fkQuery = `
            SELECT 
                OBJECT_SCHEMA_NAME(fk.parent_object_id) as FK_SCHEMA,
                OBJECT_NAME(fk.parent_object_id) as FK_TABLE,
                COL_NAME(fkc.parent_object_id, fkc.parent_column_id) as FK_COL,
                OBJECT_SCHEMA_NAME(fk.referenced_object_id) as PK_SCHEMA,
                OBJECT_NAME(fk.referenced_object_id) as PK_TABLE,
                COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) as PK_COL,
                fk.delete_referential_action_desc as DELETE_ACTION,
                fk.update_referential_action_desc as UPDATE_ACTION
            FROM sys.foreign_keys fk
            JOIN sys.foreign_key_columns fkc 
                ON fk.object_id = fkc.constraint_object_id
            ${fkSchemaFilter}
            ORDER BY fk.name
        `;
        
        const fkResult = await sql.query(fkQuery);
        
        if (fkResult.recordset.length > 0) {
            output.push('// Foreign Key Relationships');
            output.push('// ' + '-'.repeat(60));
            for (const row of fkResult.recordset) {
                let ref = `Ref: ${row.FK_SCHEMA}.${row.FK_TABLE}.${row.FK_COL} > ${row.PK_SCHEMA}.${row.PK_TABLE}.${row.PK_COL}`;
                
                // Add cascade actions
                let actions = [];
                if (row.DELETE_ACTION && row.DELETE_ACTION !== 'NO_ACTION') {
                    actions.push(`delete: ${row.DELETE_ACTION.toLowerCase().replace('_', ' ')}`);
                }
                if (row.UPDATE_ACTION && row.UPDATE_ACTION !== 'NO_ACTION') {
                    actions.push(`update: ${row.UPDATE_ACTION.toLowerCase().replace('_', ' ')}`);
                }
                
                if (actions.length > 0) {
                    ref += ` [${actions.join(', ')}]`;
                }
                
                output.push(ref);
            }
            console.log(`   ✓ Found ${fkResult.recordset.length} foreign key relationships`);
        }
        
        // Write file
        const outputFile = options.output || `${config.database}.dbml`;
        const outputPath = path.resolve(outputFile);
        fs.writeFileSync(outputPath, output.join('\n'));
        
        console.log(`\n✅ SUCCESS! Generated: ${outputPath}`);
        console.log(`   📊 Tables: ${tableCount}`);
        console.log(`   📝 Columns: ${columnCount}`);
        console.log(`   🔗 Foreign Keys: ${fkResult.recordset.length}`);
        console.log(`\n💡 View your diagram at: https://dbdiagram.io/`);
        
    } catch (err) {
        console.error('❌ Error:', err.message);
        if (options.verbose) {
            console.error(err);
        }
        process.exit(1);
    } finally {
        sql.close();
    }
}

// Setup CLI
program
    .name('mssql-to-dbml')
    .description('Generate DBML from Microsoft SQL Server databases')
    .version('1.0.0');

program
    .option('-c, --connection-string <string>', 'Connection string (e.g., "Server=localhost,5433;Database=mydb;User Id=sa;Password=pass;TrustServerCertificate=true")')
    .option('-h, --host <host>', 'Server host (default: localhost)', 'localhost')
    .option('-p, --port <port>', 'Server port (default: 1433)', '1433')
    .option('-d, --database <database>', 'Database name (required)')
    .option('-u, --user <user>', 'Username (default: sa)', 'sa')
    .option('-P, --password <password>', 'Password')
    .option('-o, --output <file>', 'Output file path (default: <database>.dbml)')
    .option('-i, --include-schemas <schemas>', 'Comma-separated list of schemas to include (e.g., "dbo,custom")')
    .option('-e, --exclude-schemas <schemas>', 'Comma-separated list of schemas to exclude (default: "sys,INFORMATION_SCHEMA")', 'sys,INFORMATION_SCHEMA')
    .option('-v, --verbose', 'Show detailed error messages')
    .action((options) => {
        generateDBML(options);
    });

// Show examples in help
program.on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('');
    console.log('  # Using connection string');
    console.log('  $ npx mssql-to-dbml -c "Server=localhost,5433;Database=MyDB;User Id=sa;Password=P@ss123"');
    console.log('');
    console.log('  # Using individual parameters');
    console.log('  $ npx mssql-to-dbml -h localhost -p 5433 -d MyDB -u sa -P "P@ss123"');
    console.log('');
    console.log('  # Include only specific schemas');
    console.log('  $ npx mssql-to-dbml -c "Server=..." -i "dbo,custom"');
    console.log('');
    console.log('  # Exclude specific schemas');
    console.log('  $ npx mssql-to-dbml -c "Server=..." -e "sys,temp,backup"');
    console.log('');
    console.log('  # Custom output file');
    console.log('  $ npx mssql-to-dbml -c "Server=..." -o my-schema.dbml');
    console.log('');
});

program.parse();
