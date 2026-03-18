import { KANBAN_COLUMNS, CATEGORIES, DEFAULT_CATEGORY } from '../utils/constants';

function KanbanCard({ lead, onClick, onMove }) {
  const cat = CATEGORIES[lead.category] || DEFAULT_CATEGORY;

  return (
    <div
      onClick={() => onClick(lead)}
      className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:bg-card-hover transition-colors group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {lead.isNew && (
              <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse flex-shrink-0" />
            )}
            <span className="font-semibold text-white truncate">{lead.name}</span>
          </div>
          <div className="text-xs text-muted truncate mt-0.5">{lead.email}</div>
        </div>
      </div>

      {lead.company && (
        <div className="text-sm text-gray-400 mb-2 truncate">{lead.company}</div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${cat.color}`}>
          {cat.name}
        </span>
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
          lead.campaign === 'QLD'
            ? 'bg-accent-yellow/15 text-accent-yellow'
            : 'bg-accent-blue/15 text-accent-blue'
        }`}>
          {lead.campaign}
        </span>
      </div>

      {/* Traffic light buttons */}
      <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        {KANBAN_COLUMNS.map(col => (
          <button
            key={col.key}
            onClick={(e) => { e.stopPropagation(); onMove(lead, col.key); }}
            className={`flex-1 py-1 rounded text-[10px] font-bold uppercase tracking-wide border transition-all cursor-pointer ${
              lead.crm?.kanbanStatus === col.key
                ? `${col.bgClass} ${col.borderClass} ${col.textClass}`
                : 'bg-header border-border text-muted hover:text-white'
            }`}
          >
            {col.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard({ leads, onLeadClick, onUpdateCRM }) {
  const handleMove = (lead, kanbanStatus) => {
    onUpdateCRM(lead.email, { kanbanStatus });
  };

  // Unassigned leads
  const unassigned = leads.filter(l => !l.crm?.kanbanStatus);

  return (
    <div className="space-y-6">
      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-4">
        {KANBAN_COLUMNS.map(col => {
          const columnLeads = leads.filter(l => l.crm?.kanbanStatus === col.key);
          return (
            <div key={col.key} className={`rounded-xl border ${col.borderClass} ${col.bgClass} min-h-[300px]`}>
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className={`font-semibold text-sm ${col.textClass}`}>{col.label}</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${col.bgClass} ${col.textClass}`}>
                    {columnLeads.length}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
                {columnLeads.length === 0 ? (
                  <div className="text-center py-8 text-muted-dark text-sm">
                    No leads
                  </div>
                ) : (
                  columnLeads.map(lead => (
                    <KanbanCard
                      key={lead.email + lead.campaign}
                      lead={lead}
                      onClick={onLeadClick}
                      onMove={handleMove}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unassigned leads */}
      {unassigned.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-muted-dark" />
              <span className="font-semibold text-sm text-muted">Unassigned</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-muted-dark/20 text-muted">
                {unassigned.length}
              </span>
            </div>
          </div>
          <div className="p-3 grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
            {unassigned.map(lead => (
              <KanbanCard
                key={lead.email + lead.campaign}
                lead={lead}
                onClick={onLeadClick}
                onMove={handleMove}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
