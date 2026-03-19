import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { fetchAllLeads, fetchLeadEmailHistory } from './smartlead.js';
import { setLeads, getLeadsWithCRM, getLastFetched, updateCRM, getCRMData, markLeadSeen, markAllLeadsSeen, getEmailHistory, saveEmailHistory } from './store.js';
import { supabase } from './supabase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

// Serve built frontend
app.use(express.static(join(__dirname, '..', 'dist')));

// Fetch leads from SmartLead and save to Supabase
async function refreshLeads() {
  try {
    const leads = await fetchAllLeads();
    await setLeads(leads);
    return leads;
  } catch (e) {
    console.error('Failed to refresh leads:', e.message);
    return null;
  }
}

// API Routes
app.get('/api/leads', async (req, res) => {
  const leads = await getLeadsWithCRM();
  const lastFetched = await getLastFetched();
  res.json({ leads, lastFetched });
});

app.get('/api/leads/refresh', async (req, res) => {
  await refreshLeads();
  const leads = await getLeadsWithCRM();
  const lastFetched = await getLastFetched();
  res.json({ leads, lastFetched });
});

app.put('/api/leads/:email/crm', async (req, res) => {
  const { email } = req.params;
  const { status, kanbanStatus, notes, followUpDate } = req.body;
  const updated = await updateCRM(decodeURIComponent(email), { status, kanbanStatus, notes, followUpDate });
  res.json(updated);
});

app.put('/api/leads/:id/seen', async (req, res) => {
  await markLeadSeen(req.params.id);
  res.json({ ok: true });
});

app.put('/api/leads/seen-all', async (req, res) => {
  await markAllLeadsSeen();
  res.json({ ok: true });
});

app.get('/api/leads/:leadId/emails', async (req, res) => {
  try {
    const { leadId } = req.params;
    const refresh = req.query.refresh === 'true';

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
      return res.json({ emails: [], debug: { lead, leadId } });
    }

    // Check cache first (unless refresh requested)
    if (!refresh) {
      try {
        const cached = await getEmailHistory(leadId, lead.campaign_id);
        if (cached.length > 0) {
          return res.json({ emails: cached });
        }
      } catch (cacheErr) {
        console.error('Cache lookup failed (table may not exist):', cacheErr.message);
      }
    }

    // Fetch fresh from SmartLead
    const emails = await fetchLeadEmailHistory(lead.campaign_id, lead.smartlead_id);

    // Try to cache in Supabase (non-blocking, don't fail if table missing)
    if (emails.length > 0) {
      try {
        await saveEmailHistory(leadId, lead.campaign_id, emails);
      } catch (saveErr) {
        console.error('Failed to cache emails:', saveErr.message);
      }
    }

    res.json({ emails });
  } catch (e) {
    console.error('Email endpoint error:', e.message);
    res.status(500).json({ emails: [], error: e.message });
  }
});

app.get('/api/stats', async (req, res) => {
  const leads = await getLeadsWithCRM();
  const stats = {
    total: leads.length,
    interested: leads.filter(l => l.category === 1).length,
    meetingBooked: leads.filter(l => l.category === 2).length,
    outOfOffice: leads.filter(l => l.category === 3).length,
    notInterested: leads.filter(l => l.category === 4 || l.category === 5).length,
    infoRequest: leads.filter(l => l.category === 8).length,
    newLeads: leads.filter(l => l.isNew).length,
    byCampaign: {
      QLD: leads.filter(l => l.campaign === 'QLD').length,
      NSW: leads.filter(l => l.campaign === 'NSW').length
    },
    byKanban: {
      yes: leads.filter(l => l.crm.kanbanStatus === 'yes').length,
      maybe: leads.filter(l => l.crm.kanbanStatus === 'maybe').length,
      no: leads.filter(l => l.crm.kanbanStatus === 'no').length,
      unassigned: leads.filter(l => !l.crm.kanbanStatus).length,
    },
    byCRMStatus: {}
  };

  const crmData = await getCRMData();
  for (const email in crmData) {
    const s = crmData[email].status || 'new';
    stats.byCRMStatus[s] = (stats.byCRMStatus[s] || 0) + 1;
  }

  res.json(stats);
});

// SPA fallback - serve index.html for all non-API routes
app.get('/{*splat}', (req, res) => {
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
});

export { refreshLeads };
export default app;
