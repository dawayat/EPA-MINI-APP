import { Pool } from 'pg';
import { cors } from './_db.js';

export default async function handler(req, res) {
  cors(res);
  
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    return res.status(500).json({ error: 'No POSTGRES_URL environment variable found.' });
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    // Add phone_password to members
    await client.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS phone_password text;`);
    // Add missing profiles to members
    await client.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS corporate_profile jsonb;`);
    await client.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS student_profile jsonb;`);
    
    // Add phone_password to applications
    await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS phone_password text;`);

    client.release();
    
    return res.status(200).json({
      success: true, 
      message: 'Database schema successfully updated! The phone_password column was added.'
    });
  } catch (err) {
    console.error('Migration error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    await pool.end();
  }
}
