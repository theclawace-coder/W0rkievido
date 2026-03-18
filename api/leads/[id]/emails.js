import { supabase } from '../../../server/supabase.js';
import { fetchLeadEmailHistory } from '../../../server/smartlead.js';
import { getEmailHistory, saveEmailHistory } from '../../../server/store.js';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  try {
    const { id: leadId } = req.query;
    const refresh = req.query.refresh === 'true';

    // Look up the lead to get smartleadId and campaignId
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('smartlead_id, campaign_id')
      .eq('id', leadId)
      .maybeSingle();

    if (leadError) {
      console.error('Error looking up lead:', leadError.message);
      return res.status(500).json({ emails: [], error: leadError.message });
    }

    if (!lead || !lead.smartlead_id) {
      return res.json({ emails: [], debug: 'no smartlead_id found' });
    }

    // Check cache first
    if (!refresh) {
      try {
        const cached = await getEmailHistory(leadId, lead.campaign_id);
        if (cached.length > 0) {
          return res.json({ emails: cached });
        }
      } catch (e) {
        console.error('Cache read failed:', e.message);
      }
    }

    // Fetch from SmartLead
    const emails = await fetchLeadEmailHistory(lead.campaign_id, lead.smartlead_id);

    // Cache
    if (emails.length > 0) {
      try {
        await saveEmailHistory(leadId, lead.campaign_id, emails);
      } catch (e) {
        console.error('Cache write failed:', e.message);
      }
    }

    res.json({ emails });
  } catch (e) {
    console.error('Email endpoint error:', e);
    res.status(500).json({ emails: [], error: e.message });
  }
}
