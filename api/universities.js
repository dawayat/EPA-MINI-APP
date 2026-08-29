import { getDb, ensureSchema, cors } from './_db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getDb();
  await ensureSchema(db);

  if (req.method === 'GET') {
    const { rows } = await db.query('SELECT * FROM universities ORDER BY name');
    return res.status(200).json(rows);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
