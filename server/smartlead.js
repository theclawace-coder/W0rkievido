const API_KEY = 'fc3ca4b5-5f96-453b-bffc-196dbdba909e_vnb9oq6';
const BASE_URL = 'https://server.smartlead.ai/api/v1';

const CAMPAIGNS = [
  { id: 3048379, name: 'QLD', label: 'Workie Vids - Real Estate - QLD' },
  { id: 3008699, name: 'NSW', label: 'Workie Vids - Real Estate - NSW' }
];

async function fetchCampaignLeads(campaignId, campaignName) {
  const leads = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const url = `${BASE_URL}/campaigns/${campaignId}/leads?api_key=${API_KEY}&limit=${limit}&offset=${offset}&status=COMPLETED`;
    try {
      const res = await fetch(url);
      if (!res.ok) break;
      const json = await res.json();

      // API returns { total_leads, data: [...] }
      const items = Array.isArray(json) ? json : json.data;
      const totalLeads = json.total_leads ? parseInt(json.total_leads) : null;

      if (!items || items.length === 0) break;

      for (const item of items) {
        const lead = item.lead || item;
        leads.push({
          id: item.campaign_lead_map_id || lead.id || `${campaignName}-${offset}-${leads.length}`,
          smartleadId: String(lead.id || ''),
          name: [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.email?.split('@')[0] || 'Unknown',
          firstName: lead.first_name || '',
          lastName: lead.last_name || '',
          email: lead.email || '',
          phone: lead.phone_number || lead.phone || '',
          company: lead.company_name || lead.company || '',
          location: lead.location || '',
          position: lead.custom_fields?.Agent_Role || lead.custom_fields?.Position || '',
          category: item.lead_category_id ?? item.lead_category ?? null,
          campaign: campaignName,
          campaignId: campaignId
        });
      }

      if (items.length < limit) break;
      if (totalLeads && leads.length >= totalLeads) break;
      offset += limit;
    } catch (e) {
      console.error(`Error fetching ${campaignName} leads at offset ${offset}:`, e.message);
      break;
    }
  }

  return leads;
}

export async function fetchAllLeads() {
  console.log('Fetching leads from SmartLead...');
  const results = await Promise.all(
    CAMPAIGNS.map(c => fetchCampaignLeads(c.id, c.name))
  );
  const allLeads = results.flat();
  console.log(`Fetched ${allLeads.length} leads (QLD: ${results[0].length}, NSW: ${results[1].length})`);
  return allLeads;
}

export async function fetchLeadEmailHistory(campaignId, smartleadId) {
  const url = `${BASE_URL}/campaigns/${campaignId}/leads/${smartleadId}/message-history?api_key=${API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`SmartLead email history returned ${res.status} for lead ${smartleadId}`);
      return [];
    }
    const data = await res.json();
    const messages = data.history || [];
    return messages.map(msg => ({
      id: msg.stats_id || msg.message_id || null,
      type: (msg.type || 'SENT').toLowerCase(),
      subject: msg.subject || '',
      body: msg.email_body || '',
      time: msg.time || null,
      from: msg.from || data.from || '',
      to: msg.to || data.to || '',
      seqNumber: msg.email_seq_number ? parseInt(msg.email_seq_number) : 1,
    }));
  } catch (e) {
    console.error(`Error fetching email history for lead ${smartleadId}:`, e.message);
    return [];
  }
}

export async function fetchCampaignStats(campaignId) {
  const url = `${BASE_URL}/campaigns/${campaignId}/statistics?api_key=${API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`Error fetching stats for ${campaignId}:`, e.message);
    return null;
  }
}

export { CAMPAIGNS };
