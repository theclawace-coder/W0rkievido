import { TABS } from '../utils/constants';

export default function Tabs({ activeTab, onTabChange, leads }) {
  const getCount = (tab) => {
    if (tab.key === 'all') return leads.length;
    return leads.filter(l => tab.categoryFilter?.includes(l.category)).length;
  };

  return (
    <div className="flex gap-1 bg-card rounded-[10px] p-1 w-fit mb-5">
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-5 py-2.5 rounded-lg border-none text-sm font-medium transition-all cursor-pointer ${
            activeTab === tab.key
              ? 'bg-primary text-white'
              : 'bg-transparent text-muted hover:text-gray-200 hover:bg-header'
          }`}
        >
          {tab.label}
          <span className={`ml-1.5 text-xs px-2 py-0.5 rounded-full ${
            activeTab === tab.key ? 'bg-white/25' : 'bg-white/10'
          }`}>
            {getCount(tab)}
          </span>
        </button>
      ))}
    </div>
  );
}
