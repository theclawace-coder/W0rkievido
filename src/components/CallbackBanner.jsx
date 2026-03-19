import { useMemo } from 'react';

export default function CallbackBanner({ leads, onLeadClick }) {
  const callbacks = useMemo(() => {
    const now = new Date();
    return leads
      .filter(l => l.crm?.callbackDatetime)
      .map(l => ({
        ...l,
        callbackAt: new Date(l.crm.callbackDatetime),
      }))
      .sort((a, b) => a.callbackAt - b.callbackAt)
      .map(l => {
        // Parse latest note from JSON array or plain string
        let latestNote = '';
        try {
          const parsed = typeof l.crm.notes === 'string' ? JSON.parse(l.crm.notes) : l.crm.notes;
          if (Array.isArray(parsed) && parsed.length > 0) latestNote = parsed[0].text || '';
        } catch {
          latestNote = l.crm.notes || '';
        }
        const diff = l.callbackAt - now;
        const isOverdue = diff < 0;
        const isToday = l.callbackAt.toDateString() === now.toDateString();
        const isSoon = !isOverdue && diff < 2 * 60 * 60 * 1000; // within 2 hours
        return { ...l, isOverdue, isToday, isSoon, latestNote };
      });
  }, [leads]);

  if (callbacks.length === 0) return null;

  const overdue = callbacks.filter(c => c.isOverdue);
  const upcoming = callbacks.filter(c => !c.isOverdue);

  return (
    <div className="px-8 pb-2">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="text-sm font-semibold text-white">Scheduled Callbacks</span>
          <span className="text-xs text-muted">({callbacks.length})</span>
          {overdue.length > 0 && (
            <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-accent-red/20 text-accent-red animate-pulse">
              {overdue.length} overdue
            </span>
          )}
        </div>
        <div className="divide-y divide-border">
          {callbacks.map(cb => (
            <div
              key={`${cb.email}-${cb.campaign}`}
              onClick={() => onLeadClick(cb)}
              className={`flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-card-hover transition-colors ${
                cb.isOverdue ? 'bg-accent-red/5' : cb.isSoon ? 'bg-accent-yellow/5' : ''
              }`}
            >
              {/* Status indicator */}
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                cb.isOverdue
                  ? 'bg-accent-red animate-pulse'
                  : cb.isSoon
                    ? 'bg-accent-yellow animate-pulse'
                    : 'bg-accent-green'
              }`} />

              {/* Lead info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">{cb.name}</span>
                  {cb.company && (
                    <span className="text-xs text-muted truncate">- {cb.company}</span>
                  )}
                </div>
                {cb.latestNote && (
                  <div className="text-xs text-muted-dark truncate mt-0.5">{cb.latestNote}</div>
                )}
              </div>

              {/* Phone */}
              {cb.phone && (
                <span className="text-xs font-mono text-muted flex-shrink-0">{cb.phone}</span>
              )}

              {/* Callback time */}
              <div className={`text-right flex-shrink-0 ${
                cb.isOverdue ? 'text-accent-red' : cb.isSoon ? 'text-accent-yellow' : 'text-gray-300'
              }`}>
                <div className="text-xs font-semibold">
                  {cb.callbackAt.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
                <div className="text-[10px] uppercase tracking-wide">
                  {cb.isOverdue
                    ? 'Overdue'
                    : cb.isToday
                      ? 'Today'
                      : cb.callbackAt.toLocaleDateString([], { weekday: 'short' })
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
