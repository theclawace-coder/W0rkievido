-- ============================================
-- Workie CRM - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Leads table: stores all lead data from SmartLead
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  smartlead_id TEXT,
  name TEXT NOT NULL DEFAULT '',
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  company TEXT DEFAULT '',
  location TEXT DEFAULT '',
  position TEXT DEFAULT '',
  category INTEGER,
  campaign TEXT DEFAULT '',
  campaign_id INTEGER,
  is_new BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM data table: per-lead status tracking
CREATE TABLE IF NOT EXISTS crm_data (
  email TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'new',
  kanban_status TEXT DEFAULT NULL,
  notes TEXT DEFAULT '',
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email history cache
CREATE TABLE IF NOT EXISTS email_history (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  campaign_id INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'SENT',
  subject TEXT DEFAULT '',
  body TEXT DEFAULT '',
  from_email TEXT DEFAULT '',
  to_email TEXT DEFAULT '',
  time TIMESTAMPTZ,
  seq_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(campaign);
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(category);
CREATE INDEX IF NOT EXISTS idx_leads_is_new ON leads(is_new);
CREATE INDEX IF NOT EXISTS idx_leads_smartlead_id ON leads(smartlead_id);
CREATE INDEX IF NOT EXISTS idx_crm_data_status ON crm_data(status);
CREATE INDEX IF NOT EXISTS idx_crm_data_kanban ON crm_data(kanban_status);
CREATE INDEX IF NOT EXISTS idx_email_history_lead ON email_history(lead_id, campaign_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER crm_data_updated_at
  BEFORE UPDATE ON crm_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
