import { markLeadSeen } from '../../../server/store.js';

export const config = { maxDuration: 10 };

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  await markLeadSeen(req.query.id);
  res.json({ ok: true });
}
