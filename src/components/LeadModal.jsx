import { useState, useEffect, useCallback, useMemo } from 'react';
import { CATEGORIES, DEFAULT_CATEGORY, CRM_STATUSES, KANBAN_COLUMNS } from '../utils/constants';
import * as api from '../api/client';

// Parse notes: handles JSON array format and legacy plain-text strings
function parseNotes(raw) {
  if (!raw) return [];
  if (typeof raw === 'object' && Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  // Legacy: plain text note - convert to single entry
  return raw.trim() ? [{ text: raw.trim(), timestamp: null }] : [];
}

export default function LeadModal({ lead, onClose, onUpdateCRM }) {
  const [emails, setEmails] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [activeEmailTab, setActiveEmailTab] = useState('all');
  const [newNote, setNewNote] = useState('');
  const [showCallbackPicker, setShowCallbackPicker] = useState(false);
  const [callbackDate, setCallbackDate] = useState('');
  const [callbackTime, setCallbackTime] = useState('');

  const cat = CATEGORIES[lead.category] || DEFAULT_CATEGORY;
  const crm = lead.crm || { status: 'new', kanbanStatus: null, notes: '', followUpDate: null, callbackDatetime: null };

  const notesList = useMemo(() => parseNotes(crm.notes), [crm.notes]);

  // Sync callback picker from lead data
  useEffect(() => {
    if (crm.callbackDatetime) {
      const dt = new Date(crm.callbackDatetime);
      setCallbackDate(dt.toISOString().split('T')[0]);
      setCallbackTime(dt.toTimeString().slice(0, 5));
    } else {
      setCallbackDate('');
      setCallbackTime('');
    }
  }, [lead.email]);

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

  const handleAddNote = () => {
    const text = newNote.trim();
    if (!text) return;
    const entry = { text, timestamp: new Date().toISOString() };
    const updated = [entry, ...notesList];
    onUpdateCRM(lead.email, { notes: JSON.stringify(updated) });
    setNewNote('');
  };

  const handleDeleteNote = (index) => {
    const updated = notesList.filter((_, i) => i !== index);
    onUpdateCRM(lead.email, { notes: JSON.stringify(updated) });
  };

  const handleScheduleCallback = () => {
    if (!callbackDate || !callbackTime) return;
    const datetime = `${callbackDate}T${callbackTime}:00`;
    onUpdateCRM(lead.email, { callbackDatetime: datetime });
    setShowCallbackPicker(false);
  };

  const handleClearCallback = () => {
    onUpdateCRM(lead.email, { callbackDatetime: null });
    setCallbackDate('');
    setCallbackTime('');
    setShowCallbackPicker(false);
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

          {/* Notes & Callback */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-xs uppercase tracking-wider text-muted">Notes</div>
                <span className="text-xs text-muted-dark">({notesList.length})</span>
              </div>
              {crm.callbackDatetime && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-accent-yellow/15 text-accent-yellow">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Callback: {new Date(crm.callbackDatetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              )}
            </div>

            {/* Add note input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
                placeholder="Type a note and press Enter..."
                className="flex-1 bg-header border border-border rounded-lg px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-primary"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/80 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Note
              </button>
            </div>

            {/* Notes log */}
            {notesList.length > 0 && (
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto mb-3 pr-1">
                {notesList.map((note, i) => (
                  <div key={i} className="flex items-start gap-2 bg-card rounded-lg px-3 py-2 group">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-200">{note.text}</div>
                      {note.timestamp && (
                        <div className="text-[10px] text-muted-dark mt-0.5">
                          {new Date(note.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteNote(i)}
                      className="text-muted-dark hover:text-accent-red text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0 mt-0.5"
                      title="Delete note"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Callback scheduler */}
            <div className="flex items-center gap-2">
              {!showCallbackPicker ? (
                <button
                  onClick={() => setShowCallbackPicker(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20 hover:bg-accent-yellow/20 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {crm.callbackDatetime ? 'Reschedule Callback' : 'Schedule Callback'}
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="date"
                    value={callbackDate}
                    onChange={e => setCallbackDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="bg-header border border-border rounded-md px-2.5 py-1.5 text-xs text-gray-200 outline-none focus:border-primary cursor-pointer"
                  />
                  <input
                    type="time"
                    value={callbackTime}
                    onChange={e => setCallbackTime(e.target.value)}
                    className="bg-header border border-border rounded-md px-2.5 py-1.5 text-xs text-gray-200 outline-none focus:border-primary cursor-pointer"
                  />
                  <button
                    onClick={handleScheduleCallback}
                    disabled={!callbackDate || !callbackTime}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-green/15 text-accent-green border border-accent-green/20 hover:bg-accent-green/25 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowCallbackPicker(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  {crm.callbackDatetime && (
                    <button
                      onClick={handleClearCallback}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-red/10 text-accent-red border border-accent-red/20 hover:bg-accent-red/20 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
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
