import { updateCRM } from '../../../server/store.js';

export const config = { maxDuration: 10 };

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const { id: email } = req.query;
  const { status, kanbanStatus, notes, followUpDate } = req.body;
  const updated = await updateCRM(decodeURIComponent(email), { status, kanbanStatus, notes, followUpDate });
  res.json(updated);
}
