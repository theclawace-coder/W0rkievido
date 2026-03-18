import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/client';
import { CATEGORY_SORT_ORDER } from '../utils/constants';

export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);
  const [error, setError] = useState(null);

  const sortLeads = (list) => {
    return [...list].sort((a, b) => {
      // New leads first
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      const aOrder = CATEGORY_SORT_ORDER[a.category] ?? 4;
      const bOrder = CATEGORY_SORT_ORDER[b.category] ?? 4;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.name || '').localeCompare(b.name || '');
    });
  };

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getLeads();
      setLeads(sortLeads(data.leads));
      setLastFetched(data.lastFetched);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.refreshLeads();
      setLeads(sortLeads(data.leads));
      setLastFetched(data.lastFetched);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLeadCRM = useCallback(async (email, crmData) => {
    await api.updateLeadCRM(email, crmData);
    setLeads(prev => prev.map(lead =>
      lead.email === email
        ? { ...lead, crm: { ...lead.crm, ...crmData } }
        : lead
    ));
  }, []);

  const markSeen = useCallback(async (leadId) => {
    await api.markLeadSeen(leadId);
    setLeads(prev => prev.map(lead =>
      lead.id === leadId ? { ...lead, isNew: false } : lead
    ));
  }, []);

  const markAllSeen = useCallback(async () => {
    await api.markAllSeen();
    setLeads(prev => prev.map(lead => ({ ...lead, isNew: false })));
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const newLeadCount = leads.filter(l => l.isNew).length;

  const stats = {
    total: leads.length,
    interested: leads.filter(l => l.category === 1).length,
    meetingBooked: leads.filter(l => l.category === 2).length,
    outOfOffice: leads.filter(l => l.category === 3).length,
    notInterested: leads.filter(l => l.category === 4 || l.category === 5).length,
    qld: leads.filter(l => l.campaign === 'QLD').length,
    nsw: leads.filter(l => l.campaign === 'NSW').length,
    newLeads: newLeadCount,
  };

  return { leads, loading, lastFetched, error, stats, refresh, updateLeadCRM, markSeen, markAllSeen, newLeadCount };
}
