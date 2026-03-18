import LeadRow from './LeadRow';

export default function LeadTable({ leads, loading, onUpdateCRM, onLeadClick }) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl flex items-center justify-center py-20 gap-3">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl text-center py-16 px-5">
        <h3 className="text-lg text-muted mb-2">No leads found</h3>
        <p className="text-muted-dark">Try adjusting your filters or refresh to pull latest data.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Name', 'Company', 'Phone', 'Campaign', 'Category', 'Decision', 'CRM Status', 'Notes'].map(h => (
                <th key={h} className="text-left px-4 py-3.5 text-xs uppercase tracking-wide text-muted bg-[#161820] border-b border-border font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <LeadRow
                key={lead.email + lead.campaign}
                lead={lead}
                onUpdateCRM={onUpdateCRM}
                onLeadClick={onLeadClick}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
