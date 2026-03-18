export const CATEGORIES = {
  1: { name: 'Interested', color: 'bg-accent-green/15 text-accent-green' },
  2: { name: 'Meeting Booked', color: 'bg-accent-blue/15 text-accent-blue' },
  3: { name: 'Out of Office', color: 'bg-accent-yellow/15 text-accent-yellow' },
  4: { name: 'Not Interested', color: 'bg-accent-red/15 text-accent-red' },
  5: { name: 'Do Not Contact', color: 'bg-accent-red/15 text-accent-red' },
  6: { name: 'Wrong Person', color: 'bg-muted/15 text-muted' },
  7: { name: 'Closed', color: 'bg-accent-purple/15 text-accent-purple' },
  8: { name: 'Info Request', color: 'bg-accent-teal/15 text-accent-teal' },
  9: { name: 'Unsubscribed', color: 'bg-accent-red/10 text-accent-red' },
};

export const DEFAULT_CATEGORY = { name: 'Uncategorized', color: 'bg-muted-dark/15 text-muted-dark' };

export const CRM_STATUSES = [
  { value: 'new', label: 'New', color: '#6b7280' },
  { value: 'contacted', label: 'Contacted', color: '#60a5fa' },
  { value: 'in-conversation', label: 'In Conversation', color: '#8b5cf6' },
  { value: 'demo-scheduled', label: 'Demo Scheduled', color: '#fbbf24' },
  { value: 'proposal-sent', label: 'Proposal Sent', color: '#f97316' },
  { value: 'won', label: 'Won', color: '#34d399' },
  { value: 'lost', label: 'Lost', color: '#ef4444' },
];

export const KANBAN_COLUMNS = [
  { key: 'yes', label: 'Yes', color: '#34d399', bgClass: 'bg-accent-green/10', borderClass: 'border-accent-green/30', textClass: 'text-accent-green' },
  { key: 'maybe', label: 'Maybe', color: '#fbbf24', bgClass: 'bg-accent-yellow/10', borderClass: 'border-accent-yellow/30', textClass: 'text-accent-yellow' },
  { key: 'no', label: 'No', color: '#ef4444', bgClass: 'bg-accent-red/10', borderClass: 'border-accent-red/30', textClass: 'text-accent-red' },
];

export const TABS = [
  { key: 'all', label: 'All Leads' },
  { key: 'interested', label: 'Interested', categoryFilter: [1] },
  { key: 'meeting', label: 'Meeting Booked', categoryFilter: [2] },
  { key: 'ooo', label: 'Out of Office', categoryFilter: [3] },
  { key: 'not-interested', label: 'Not Interested', categoryFilter: [4, 5] },
];

export const CATEGORY_SORT_ORDER = {
  1: 0, 2: 1, 8: 2, 3: 3, null: 4, 0: 4, 4: 5, 6: 6, 9: 7, 5: 8, 7: 9
};
