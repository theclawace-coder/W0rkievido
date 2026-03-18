import { getLeadsWithCRM, getCRMData } from '../server/store.js';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  const leads = await getLeadsWithCRM();
  const crmData = await getCRMData();

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

  for (const email in crmData) {
    const s = crmData[email].status || 'new';
    stats.byCRMStatus[s] = (stats.byCRMStatus[s] || 0) + 1;
  }

  res.json(stats);
}
