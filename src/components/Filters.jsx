export default function Filters({ search, onSearchChange, campaign, onCampaignChange }) {
  return (
    <div className="flex gap-3 mb-5 items-center flex-wrap">
      <input
        type="text"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Search by name, email, or company..."
        className="bg-card border border-border rounded-lg px-4 py-2.5 text-gray-200 text-sm w-[300px] outline-none focus:border-primary transition-colors placeholder:text-muted-dark"
      />
      <select
        value={campaign}
        onChange={e => onCampaignChange(e.target.value)}
        className="bg-card border border-border rounded-lg px-4 py-2.5 text-gray-200 text-sm outline-none cursor-pointer"
      >
        <option value="all">All Campaigns</option>
        <option value="QLD">QLD Campaign</option>
        <option value="NSW">NSW Campaign</option>
      </select>
    </div>
  );
}
