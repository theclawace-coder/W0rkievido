import { supabase } from './supabase.js';

export async function getLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error.message);
    return [];
  }

  return data.map(mapLeadFromDB);
}

export async function setLeads(leads) {
  // Get existing lead IDs to detect new ones
  const { data: existing } = await supabase
    .from('leads')
    .select('id');

  const existingIds = new Set((existing || []).map(r => r.id));

  const rows = leads.map(lead => ({
    id: String(lead.id),
    smartlead_id: lead.smartleadId || '',
    name: lead.name || '',
    first_name: lead.firstName || '',
    last_name: lead.lastName || '',
    email: lead.email || '',
    phone: lead.phone || '',
    company: lead.company || '',
    location: lead.location || '',
    position: lead.position || '',
    category: lead.category ?? null,
    campaign: lead.campaign || '',
    campaign_id: lead.campaignId || null,
    is_new: !existingIds.has(String(lead.id)),
  }));

  const newRows = rows.filter(r => r.is_new);
  const existingRows = rows.filter(r => !r.is_new).map(({ is_new, ...rest }) => rest);

  if (newRows.length > 0) {
    const { error } = await supabase.from('leads').upsert(newRows, { onConflict: 'id' });
    if (error) console.error('Error saving new leads:', error.message);
    else console.log(`${newRows.length} new leads detected!`);
  }

  if (existingRows.length > 0) {
    const { error } = await supabase.from('leads').upsert(existingRows, { onConflict: 'id' });
    if (error) console.error('Error updating existing leads:', error.message);
  }
}

export async function getLastFetched() {
  const { data, error } = await supabase
    .from('leads')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0].updated_at;
}

export async function getCRMData() {
  const { data, error } = await supabase
    .from('crm_data')
    .select('*');

  if (error) {
    console.error('Error fetching CRM data:', error.message);
    return {};
  }

  const result = {};
  for (const row of data) {
    result[row.email] = {
      status: row.status,
      kanbanStatus: row.kanban_status,
      notes: row.notes || '',
      followUpDate: row.follow_up_date,
    };
  }
  return result;
}

export async function updateCRM(email, updates) {
  const row = {
    email,
    ...(updates.status !== undefined && { status: updates.status }),
    ...(updates.kanbanStatus !== undefined && { kanban_status: updates.kanbanStatus }),
    ...(updates.notes !== undefined && { notes: updates.notes }),
    ...(updates.followUpDate !== undefined && { follow_up_date: updates.followUpDate || null }),
  };

  const { data, error } = await supabase
    .from('crm_data')
    .upsert(row, { onConflict: 'email' })
    .select()
    .single();

  if (error) {
    console.error('Error updating CRM:', error.message);
    return { status: 'new', kanbanStatus: null, notes: '', followUpDate: null };
  }

  return {
    status: data.status,
    kanbanStatus: data.kanban_status,
    notes: data.notes || '',
    followUpDate: data.follow_up_date,
  };
}

export async function markLeadSeen(leadId) {
  const { error } = await supabase
    .from('leads')
    .update({ is_new: false })
    .eq('id', leadId);

  if (error) console.error('Error marking lead as seen:', error.message);
}

export async function markAllLeadsSeen() {
  const { error } = await supabase
    .from('leads')
    .update({ is_new: false })
    .eq('is_new', true);

  if (error) console.error('Error marking all leads as seen:', error.message);
}

// Email history - get cached or fetch fresh
export async function getEmailHistory(leadId, campaignId) {
  const { data, error } = await supabase
    .from('email_history')
    .select('*')
    .eq('lead_id', leadId)
    .eq('campaign_id', campaignId)
    .order('time', { ascending: true });

  if (error) {
    console.error('Error fetching cached emails:', error.message);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    type: row.type,
    subject: row.subject,
    body: row.body,
    time: row.time,
    from: row.from_email,
    to: row.to_email,
    seqNumber: row.seq_number,
  }));
}

export async function saveEmailHistory(leadId, campaignId, emails) {
  if (!emails || emails.length === 0) return;

  const rows = emails.map(email => ({
    id: email.id || `${leadId}-${campaignId}-${email.time}-${Math.random().toString(36).slice(2, 8)}`,
    lead_id: String(leadId),
    campaign_id: campaignId,
    type: email.type || 'sent',
    subject: email.subject || '',
    body: email.body || '',
    from_email: email.from || '',
    to_email: email.to || '',
    time: email.time || null,
    seq_number: email.seqNumber || 1,
  }));

  const { error } = await supabase
    .from('email_history')
    .upsert(rows, { onConflict: 'id' });

  if (error) console.error('Error caching emails:', error.message);
}

export async function getLeadsWithCRM() {
  const [leadsResult, crmResult] = await Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase.from('crm_data').select('*'),
  ]);

  const leads = (leadsResult.data || []).map(mapLeadFromDB);

  const crmMap = {};
  for (const row of (crmResult.data || [])) {
    crmMap[row.email] = {
      status: row.status,
      kanbanStatus: row.kanban_status,
      notes: row.notes || '',
      followUpDate: row.follow_up_date,
    };
  }

  return leads.map(lead => ({
    ...lead,
    crm: crmMap[lead.email] || { status: 'new', kanbanStatus: null, notes: '', followUpDate: null },
  }));
}

function mapLeadFromDB(row) {
  return {
    id: row.id,
    smartleadId: row.smartlead_id,
    name: row.name,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    location: row.location,
    position: row.position,
    category: row.category,
    campaign: row.campaign,
    campaignId: row.campaign_id,
    isNew: row.is_new,
  };
}
