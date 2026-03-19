import { useMemo } from 'react';
import { CATEGORIES, DEFAULT_CATEGORY, CRM_STATUSES, KANBAN_COLUMNS } from '../utils/constants';

function getLatestNote(raw) {
  if (!raw) return '';
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].text || '';
  } catch {}
  return typeof raw === 'string' ? raw : '';
}

export default function LeadRow({ lead, onUpdateCRM, onLeadClick }) {
  const cat = CATEGORIES[lead.category] || DEFAULT_CATEGORY;
  const crm = lead.crm || { status: 'new', kanbanStatus: null, notes: '', callbackDatetime: null };
  const latestNote = useMemo(() => getLatestNote(crm.notes), [crm.notes]);

  const handleStatusChange = (e) => {
    e.stopPropagation();
    onUpdateCRM(lead.email, { status: e.target.value });
  };

  const handleKanbanChange = (e) => {
    e.stopPropagation();
    onUpdateCRM(lead.email, { kanbanStatus: e.target.value || null });
  };

  const kanbanCol = KANBAN_COLUMNS.find(k => k.key === crm.kanbanStatus);

  return (
    <tr className="hover:bg-card-hover group cursor-pointer" onClick={() => onLeadClick(lead)}>
      <td className="px-4 py-3.5 border-b border-[#1e2028]">
        <div className="flex items-center gap-2">
          {lead.isNew && (
            <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse flex-shrink-0" />
          )}
          <div>
            <div className="font-semibold text-white">{lead.name}</div>
            <div className="text-[13px] text-muted">{lead.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 border-b border-[#1e2028]">
        <div className="text-gray-300">{lead.company || '-'}</div>
        <div className="text-[13px] text-muted">{lead.location || ''}</div>
      </td>
      <td className="px-4 py-3.5 border-b border-[#1e2028] font-mono text-[13px] text-muted">
        {lead.phone || '-'}
      </td>
      <td className="px-4 py-3.5 border-b border-[#1e2028]">
        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
          lead.campaign === 'QLD'
            ? 'bg-accent-yellow/15 text-accent-yellow'
            : 'bg-accent-blue/15 text-accent-blue'
        }`}>
          {lead.campaign}
        </span>
      </td>
      <td className="px-4 py-3.5 border-b border-[#1e2028]">
        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${cat.color}`}>
          {cat.name}
        </span>
      </td>
      <td className="px-4 py-3.5 border-b border-[#1e2028]">
        <select
          value={crm.kanbanStatus || ''}
          onChange={handleKanbanChange}
          onClick={e => e.stopPropagation()}
          className={`border rounded-md px-2.5 py-1.5 text-[13px] cursor-pointer outline-none focus:border-primary ${
            kanbanCol
              ? `${kanbanCol.bgClass} ${kanbanCol.borderClass} ${kanbanCol.textClass}`
              : 'bg-header border-border text-gray-200'
          }`}
        >
          <option value="">--</option>
          {KANBAN_COLUMNS.map(k => (
            <option key={k.key} value={k.key}>{k.label}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3.5 border-b border-[#1e2028]">
        <select
          value={crm.status || 'new'}
          onChange={handleStatusChange}
          onClick={e => e.stopPropagation()}
          className="bg-header border border-border rounded-md px-2.5 py-1.5 text-gray-200 text-[13px] cursor-pointer outline-none focus:border-primary"
        >
          {CRM_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3.5 border-b border-[#1e2028]">
        <div className="min-w-[150px]">
          {latestNote ? (
            <div className="text-[13px] text-gray-300 truncate max-w-[200px]" title={latestNote}>
              {latestNote}
            </div>
          ) : (
            <div className="text-[13px] text-muted-dark">Click to add notes...</div>
          )}
          {crm.callbackDatetime && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-accent-yellow">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow flex-shrink-0" />
              Callback: {new Date(crm.callbackDatetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
