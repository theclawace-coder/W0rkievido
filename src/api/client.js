const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function getLeads() {
  return request('/leads');
}

export function refreshLeads() {
  return request('/leads/refresh');
}

export function getStats() {
  return request('/stats');
}

export function updateLeadCRM(email, data) {
  return request(`/leads/${encodeURIComponent(email)}/crm`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function markLeadSeen(leadId) {
  return request(`/leads/${leadId}/seen`, { method: 'PUT' });
}

export function markAllSeen() {
  return request('/leads/seen-all', { method: 'PUT' });
}

export function getLeadEmails(leadId, refresh = false) {
  return request(`/leads/${leadId}/emails${refresh ? '?refresh=true' : ''}`);
}
