export default function Header({ onRefresh, loading, lastFetched, newLeadCount, onMarkAllSeen }) {
  const timeStr = lastFetched
    ? new Date(lastFetched).toLocaleTimeString()
    : null;

  return (
    <header className="bg-linear-to-br from-card to-header border-b border-border px-8 py-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-linear-to-br from-primary to-accent-purple rounded-[10px] flex items-center justify-center font-bold text-lg text-white">
          W
        </div>
        <h1 className="text-[22px] font-semibold text-white">
          Workie <span className="text-accent-purple">Vids</span> CRM
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {newLeadCount > 0 && (
          <button
            onClick={onMarkAllSeen}
            className="flex items-center gap-2 bg-accent-blue/15 text-accent-blue px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent-blue/25 transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
            {newLeadCount} new lead{newLeadCount !== 1 ? 's' : ''}
            <span className="text-xs text-accent-blue/60 ml-1">Mark all seen</span>
          </button>
        )}
        {timeStr && (
          <span className="text-xs text-muted-dark">Updated: {timeStr}</span>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
        >
          <span className={loading ? 'animate-spin' : ''}>&#8635;</span>
          Refresh Leads
        </button>
      </div>
    </header>
  );
}
