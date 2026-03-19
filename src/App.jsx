import { useState, useMemo } from 'react';
import { useLeads } from './hooks/useLeads';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import Tabs from './components/Tabs';
import Filters from './components/Filters';
import LeadTable from './components/LeadTable';
import KanbanBoard from './components/KanbanBoard';
import LeadModal from './components/LeadModal';
import CallbackBanner from './components/CallbackBanner';
import { TABS } from './utils/constants';

function App() {
  const { leads, loading, lastFetched, stats, refresh, updateLeadCRM, markAllSeen, newLeadCount } = useLeads();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [campaign, setCampaign] = useState('all');
  const [view, setView] = useState('table'); // 'table' | 'kanban'
  const [selectedLead, setSelectedLead] = useState(null);

  const filteredLeads = useMemo(() => {
    const tab = TABS.find(t => t.key === activeTab);

    return leads.filter(lead => {
      // Tab filter
      if (tab?.categoryFilter && !tab.categoryFilter.includes(lead.category)) {
        return false;
      }
      // Campaign filter
      if (campaign !== 'all' && lead.campaign !== campaign) {
        return false;
      }
      // Search filter
      if (search) {
        const haystack = `${lead.name} ${lead.email} ${lead.company} ${lead.phone}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [leads, activeTab, search, campaign]);

  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
  };

  const handleCloseModal = () => {
    setSelectedLead(null);
  };

  // Keep modal lead in sync with state updates
  const modalLead = selectedLead
    ? leads.find(l => l.email === selectedLead.email && l.campaign === selectedLead.campaign) || selectedLead
    : null;

  return (
    <div className="min-h-screen">
      <Header
        onRefresh={refresh}
        loading={loading}
        lastFetched={lastFetched}
        newLeadCount={newLeadCount}
        onMarkAllSeen={markAllSeen}
      />
      <StatsBar stats={stats} />
      <CallbackBanner leads={leads} onLeadClick={handleLeadClick} />
      <div className="px-8 pb-8">
        {/* View toggle + tabs row */}
        <div className="flex items-center justify-between mb-5">
          <Tabs activeTab={activeTab} onTabChange={setActiveTab} leads={leads} />
          <div className="flex gap-1 bg-card rounded-[10px] p-1">
            <button
              onClick={() => setView('table')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                view === 'table' ? 'bg-primary text-white' : 'text-muted hover:text-gray-200 hover:bg-header'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                view === 'kanban' ? 'bg-primary text-white' : 'text-muted hover:text-gray-200 hover:bg-header'
              }`}
            >
              Board
            </button>
          </div>
        </div>

        <Filters
          search={search}
          onSearchChange={setSearch}
          campaign={campaign}
          onCampaignChange={setCampaign}
        />

        {view === 'table' ? (
          <LeadTable
            leads={filteredLeads}
            loading={loading}
            onUpdateCRM={updateLeadCRM}
            onLeadClick={handleLeadClick}
          />
        ) : (
          <KanbanBoard
            leads={filteredLeads}
            onLeadClick={handleLeadClick}
            onUpdateCRM={updateLeadCRM}
          />
        )}
      </div>

      {/* Lead detail modal */}
      {modalLead && (
        <LeadModal
          lead={modalLead}
          onClose={handleCloseModal}
          onUpdateCRM={updateLeadCRM}
        />
      )}
    </div>
  );
}

export default App;
