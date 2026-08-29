const { Client } = require('pg');
const fs = require('fs');

// Use the IPv6 address directly since Node's DNS fails on Windows for this hostname
const connectionString = 'postgresql://postgres:EPAMINIAPP91@[2a05:d018:cb7:ae02:db8d:5050:9a28:c296]:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to Supabase DB successfully.');

    const sqlPath = "C:\\Users\\dawit\\.gemini\\antigravity\\brain\\68353094-a7c3-45c8-b1b0-f39c38ec8f4a\\supabase_schema.sql";
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing schema script...');
    await client.query(sql);
    console.log('Schema executed successfully.');
  } catch (err) {
    console.error('Error executing schema:', err);
  } finally {
    await client.end();
  }
}

run();
