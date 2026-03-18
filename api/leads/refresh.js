import { fetchAllLeads } from '../../server/smartlead.js';
import { setLeads, getLeadsWithCRM, getLastFetched } from '../../server/store.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  try {
    const leads = await fetchAllLeads();
    await setLeads(leads);
  } catch (e) {
    console.error('Failed to refresh leads:', e.message);
  }

  const allLeads = await getLeadsWithCRM();
  const lastFetched = await getLastFetched();
  res.json({ leads: allLeads, lastFetched });
}
