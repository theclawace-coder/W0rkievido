const cards = [
  { key: 'newLeads', label: 'New Leads', sub: 'Not yet reviewed', colorClass: 'text-accent-blue' },
  { key: 'interested', label: 'Interested', sub: 'Ready to follow up', colorClass: 'text-accent-green' },
  { key: 'meetingBooked', label: 'Meeting Booked', sub: 'Scheduled calls', colorClass: 'text-accent-blue' },
  { key: 'outOfOffice', label: 'Out of Office', sub: 'Follow up later', colorClass: 'text-accent-yellow' },
  { key: 'total', label: 'Total Leads', sub: 'Across both campaigns', colorClass: 'text-accent-purple' },
];

export default function StatsBar({ stats }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 px-8 py-6">
      {cards.map(card => (
        <div key={card.key} className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs uppercase tracking-wider text-muted mb-2">{card.label}</div>
          <div className={`text-3xl font-bold ${card.colorClass}`}>{stats[card.key] ?? 0}</div>
          <div className="text-[13px] text-muted-dark mt-1">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}
