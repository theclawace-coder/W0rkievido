import { useState, useEffect, useCallback } from 'react';
import { CATEGORIES, DEFAULT_CATEGORY, CRM_STATUSES, KANBAN_COLUMNS } from '../utils/constants';
import * as api from '../api/client';

export default function LeadModal({ lead, onClose, onUpdateCRM }) {
  const [emails, setEmails] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [activeEmailTab, setActiveEmailTab] = useState('all');

  const cat = CATEGORIES[lead.category] || DEFAULT_CATEGORY;
  const crm = lead.crm || { status: 'new', kanbanStatus: null, notes: '', followUpDate: null };

  const fetchEmails = useCallback(async (refresh = false) => {
    setLoadingEmails(true);
    try {
      const data = await api.getLeadEmails(lead.id, refresh);
      setEmails(data.emails || []);
    } catch (e) {
      console.error('Failed to fetch emails:', e);
      setEmails([]);
    } finally {
      setLoadingEmails(false);
    }
  }, [lead.id]);

  useEffect(() => {
    fetchEmails();

    // Mark as seen when opening
    if (lead.isNew) {
      api.markLeadSeen(lead.id);
    }
  }, [lead.id, lead.isNew, fetchEmails]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleKanbanChange = (status) => {
    onUpdateCRM(lead.email, { kanbanStatus: status });
  };

  const handleStatusChange = (e) => {
    onUpdateCRM(lead.email, { status: e.target.value });
  };

  const filteredEmails = activeEmailTab === 'all'
    ? emails
    : emails.filter(e => e.type === activeEmailTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-body border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-5 flex items-start justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {lead.isNew && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-accent-blue/20 text-accent-blue">New</span>
              )}
              <h2 className="text-xl font-bold text-white">{lead.name}</h2>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted">
              <span>{lead.email}</span>
              {lead.phone && <span>| {lead.phone}</span>}
            </div>
            {lead.company && (
              <div className="text-sm text-gray-400 mt-1">
                {lead.company}{lead.position ? ` - ${lead.position}` : ''}{lead.location ? ` | ${lead.location}` : ''}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-white text-2xl leading-none cursor-pointer p-1"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick info row */}
          <div className="flex flex-wrap gap-3 items-center">
            <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold uppercase ${cat.color}`}>
              {cat.name}
            </span>
            <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold ${
              lead.campaign === 'QLD'
                ? 'bg-accent-yellow/15 text-accent-yellow'
                : 'bg-accent-blue/15 text-accent-blue'
            }`}>
              {lead.campaign}
            </span>
            <select
              value={crm.status || 'new'}
              onChange={handleStatusChange}
              className="bg-header border border-border rounded-md px-2.5 py-1.5 text-gray-200 text-xs cursor-pointer outline-none focus:border-primary"
            >
              {CRM_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Traffic light kanban selector */}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted mb-2">Decision</div>
            <div className="flex gap-2">
              {KANBAN_COLUMNS.map(col => (
                <button
                  key={col.key}
                  onClick={() => handleKanbanChange(col.key)}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wide border-2 transition-all cursor-pointer ${
                    crm.kanbanStatus === col.key
                      ? `${col.bgClass} ${col.borderClass} ${col.textClass} shadow-lg`
                      : 'bg-card border-border text-muted hover:text-white hover:border-muted'
                  }`}
                >
                  <span className="inline-block w-3 h-3 rounded-full mr-2 align-middle" style={{ backgroundColor: col.color }} />
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          {/* Email chain */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-xs uppercase tracking-wider text-muted">Email History</div>
                <span className="text-xs text-muted-dark">({emails.length} message{emails.length !== 1 ? 's' : ''})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchEmails(true)}
                  disabled={loadingEmails}
                  className="text-xs text-muted hover:text-white px-2 py-1 rounded hover:bg-header transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loadingEmails ? 'Loading...' : 'Refresh'}
                </button>
                <div className="flex gap-1 bg-card rounded-lg p-0.5">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'sent', label: 'Sent' },
                    { key: 'reply', label: 'Replies' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveEmailTab(tab.key)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                        activeEmailTab === tab.key
                          ? 'bg-primary text-white'
                          : 'text-muted hover:text-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loadingEmails ? (
              <div className="flex items-center justify-center py-12 gap-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="text-center py-10 text-muted-dark text-sm bg-card rounded-xl border border-border">
                No emails found for this lead
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEmails.map((email, i) => (
                  <EmailMessage key={email.id || i} email={email} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailMessage({ email }) {
  const [expanded, setExpanded] = useState(false);
  const isReply = email.type === 'reply';

  const timeStr = email.time
    ? new Date(email.time).toLocaleString()
    : '';

  // Strip HTML for preview
  const plainText = email.body?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
  const preview = plainText.length > 150 ? plainText.slice(0, 150) + '...' : plainText;

  return (
    <div className={`rounded-xl border overflow-hidden ${
      isReply
        ? 'border-accent-green/20 bg-accent-green/5'
        : 'border-border bg-card'
    }`}>
      <div
        className="px-4 py-3 flex items-start justify-between cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
              isReply
                ? 'bg-accent-green/20 text-accent-green'
                : 'bg-accent-blue/20 text-accent-blue'
            }`}>
              {isReply ? 'Reply' : 'Sent'}
            </span>
            {email.subject && (
              <span className="text-sm font-medium text-white truncate">{email.subject}</span>
            )}
          </div>
          {!expanded && (
            <div className="text-xs text-muted truncate">{preview}</div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {timeStr && <span className="text-[11px] text-muted-dark">{timeStr}</span>}
          <span className="text-muted text-xs">{expanded ? '\u25B2' : '\u25BC'}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50">
          <div className="flex gap-4 text-[11px] text-muted-dark py-2 mb-2">
            {email.from && <span>From: {email.from}</span>}
            {email.to && <span>To: {email.to}</span>}
          </div>
          <div
            className="text-sm text-gray-300 leading-relaxed [&_a]:text-accent-blue [&_a]:underline [&_img]:max-w-full [&_img]:h-auto [&_table]:text-sm"
            dangerouslySetInnerHTML={{ __html: email.body || '<em>No content</em>' }}
          />
        </div>
      )}
    </div>
  );
}
