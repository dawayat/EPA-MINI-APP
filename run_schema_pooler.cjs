const { Client } = require('pg');
const fs = require('fs');

const regions = [
  'eu-central-1',
  'us-east-1',
  'eu-west-1',
  'eu-west-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'sa-east-1',
  'ca-central-1',
  'ap-south-1',
];

async function run() {
  const sqlPath = "C:\\Users\\dawit\\.gemini\\antigravity\\brain\\68353094-a7c3-45c8-b1b0-f39c38ec8f4a\\supabase_schema.sql";
  const sql = fs.readFileSync(sqlPath, 'utf8');

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const connectionString = `postgresql://postgres.cnwkuzihcmtenpoliqpn:EPAMINIAPP91@${host}:5432/postgres`;
    
    console.log(`Trying region ${region}...`);
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    
    try {
      await client.connect();
      console.log(`Connected to Supabase DB successfully via pooler at ${region}!`);
      
      console.log('Executing schema script...');
      await client.query(sql);
      console.log('Schema executed successfully.');
      await client.end();
      return; // Success!
    } catch (err) {
      if (err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
        // Just move to the next region
      } else {
        console.error(`Error with ${region}:`, err.message);
      }
    } finally {
      try { await client.end(); } catch (e) {}
    }
  }
  console.log("Could not find the correct pooler region.");
}

run();
