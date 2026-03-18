import { getLeadsWithCRM, getLastFetched } from '../../server/store.js';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  const leads = await getLeadsWithCRM();
  const lastFetched = await getLastFetched();
  res.json({ leads, lastFetched });
}
