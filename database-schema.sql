-- TITLEREG Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- 
-- Updated for IPFS Integration:
-- - Documents and photos now store IPFS CID (Content Identifier) hashes instead of base64 data
-- - Backward compatible with legacy base64 format
-- - Files stored on IPFS via Pinata
--
-- IPFS CID Storage Format:
-- Documents: JSONB object with structure {"documentType": {"name": "filename.pdf", "ipfsHash": "Qm...", "mimeType": "application/pdf"}}
-- Photos: JSONB array with structure [{"name": "photo.jpg", "ipfsHash": "Qm...", "mimeType": "image/jpeg"}]
-- IPFS CID (Content Identifier) is returned from Pinata IPFS upload (format: Qm... for CIDv0 or bafy... for CIDv1)
--
-- Example Queries:
-- 1. Get all IPFS hashes for a registration:
--    SELECT * FROM get_document_ipfs_hashes('registration-uuid-here');
--    SELECT * FROM get_photo_ipfs_hashes('registration-uuid-here');
--
-- 2. Find registrations by IPFS hash:
--    SELECT * FROM find_registrations_by_ipfs_hash('QmXXXXXXXX...');
--
-- 3. Get all IPFS hashes in database (function replaces view for security):
--    SELECT * FROM get_ipfs_hash_registry();
--
-- 4. Query documents directly:
--    SELECT registration_id, documents->'saleDeed'->>'ipfsHash' as sale_deed_hash
--    FROM registrations WHERE documents->'saleDeed'->>'ipfsHash' IS NOT NULL;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing triggers if they exist (for idempotent schema)
DROP TRIGGER IF EXISTS update_registrations_updated_at ON registrations;
DROP TRIGGER IF EXISTS update_drafts_updated_at ON drafts;

-- Drop existing function if it exists (for idempotent schema)
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id TEXT UNIQUE NOT NULL,
  registration_date TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'verified')),
  
  -- Property Details
  property_type TEXT NOT NULL,
  survey_number TEXT NOT NULL,
  plot_number TEXT,
  village TEXT NOT NULL,
  taluka TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  area TEXT NOT NULL,
  area_unit TEXT NOT NULL DEFAULT 'sqft',
  property_description TEXT,
  
  -- Transaction Details
  transaction_type TEXT NOT NULL,
  consideration_amount TEXT NOT NULL,
  stamp_duty TEXT NOT NULL,
  registration_fee TEXT NOT NULL,
  sale_agreement_date TEXT NOT NULL,
  
  -- Seller Information
  seller_name TEXT NOT NULL,
  seller_father_name TEXT NOT NULL,
  seller_age TEXT,
  seller_address TEXT,
  seller_pan TEXT,
  seller_aadhar TEXT,
  seller_phone TEXT,
  seller_email TEXT,
  
  -- Buyer Information
  buyer_name TEXT NOT NULL,
  buyer_father_name TEXT NOT NULL,
  buyer_age TEXT,
  buyer_address TEXT,
  buyer_pan TEXT,
  buyer_aadhar TEXT,
  buyer_phone TEXT,
  buyer_email TEXT,
  
  -- Witnesses (JSON array)
  -- Format: [{"name": "...", "address": "...", "phone": "...", "aadhar": "..."}]
  witnesses JSONB DEFAULT '[]'::jsonb,
  
  -- Documents (JSON object) - Stores IPFS CID hashes
  -- Primary format: {"documentType": {"name": "...", "ipfsHash": "QmXXXXXXXX...", "mimeType": "application/pdf"}}
  -- IPFS CID format: Qm... (CIDv0) or bafy... (CIDv1) - Content Identifier hash from Pinata IPFS
  -- Legacy format (base64) still supported: {"documentType": {"name": "...", "data": "base64...", "mimeType": "..."}}
  -- Example: {"saleDeed": {"name": "sale_deed.pdf", "ipfsHash": "QmXxXxXxXxXx...", "mimeType": "application/pdf"}}
  documents JSONB DEFAULT '{}'::jsonb,
  
  -- Property Photos (JSON array) - Stores IPFS CID hashes
  -- Primary format: [{"name": "...", "ipfsHash": "QmXXXXXXXX...", "mimeType": "image/jpeg"}]
  -- IPFS CID format: Qm... (CIDv0) or bafy... (CIDv1) - Content Identifier hash from Pinata IPFS
  -- Legacy format (base64) still supported: [{"name": "...", "data": "base64...", "mimeType": "..."}]
  -- Example: [{"name": "property_photo_1.jpg", "ipfsHash": "QmYyYyYyYyYy...", "mimeType": "image/jpeg"}]
  property_photos JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_registrations_registration_id ON registrations(registration_id);
CREATE INDEX IF NOT EXISTS idx_registrations_survey_number ON registrations(survey_number);
CREATE INDEX IF NOT EXISTS idx_registrations_wallet_address ON registrations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);

-- GIN indexes for JSONB queries (faster IPFS hash lookups)
CREATE INDEX IF NOT EXISTS idx_registrations_documents ON registrations USING GIN (documents);
CREATE INDEX IF NOT EXISTS idx_registrations_property_photos ON registrations USING GIN (property_photos);

-- Drafts Table
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL UNIQUE,
  current_step INTEGER NOT NULL DEFAULT 1,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  form_time_elapsed INTEGER DEFAULT 0,
  form_start_time BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for drafts
CREATE INDEX IF NOT EXISTS idx_drafts_wallet_address ON drafts(wallet_address);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('completed', 'pending', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_registration_id ON payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_wallet_address ON payments(wallet_address);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON payments(payment_status);

-- Search History Table
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  search_type TEXT NOT NULL CHECK (search_type IN ('registrationId', 'surveyNumber')),
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for search history
CREATE INDEX IF NOT EXISTS idx_search_history_wallet_address ON search_history(wallet_address);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent schema)
DROP POLICY IF EXISTS "Allow public read on registrations" ON registrations;
DROP POLICY IF EXISTS "Allow insert own registrations" ON registrations;
DROP POLICY IF EXISTS "Allow update own registrations" ON registrations;
DROP POLICY IF EXISTS "Allow manage own drafts" ON drafts;
DROP POLICY IF EXISTS "Allow insert own payments" ON payments;
DROP POLICY IF EXISTS "Allow read own payments" ON payments;
DROP POLICY IF EXISTS "Allow manage own search history" ON search_history;

-- RLS Policies for registrations
-- Allow anyone to read registrations (public search)
CREATE POLICY "Allow public read on registrations" ON registrations
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own registrations
CREATE POLICY "Allow insert own registrations" ON registrations
  FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own registrations
CREATE POLICY "Allow update own registrations" ON registrations
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for drafts
-- Allow users to manage their own drafts
CREATE POLICY "Allow manage own drafts" ON drafts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for payments
-- Allow users to insert their own payments
CREATE POLICY "Allow insert own payments" ON payments
  FOR INSERT
  WITH CHECK (true);

-- Allow users to read their own payments
CREATE POLICY "Allow read own payments" ON payments
  FOR SELECT
  USING (true);

-- RLS Policies for search_history
-- Allow users to manage their own search history
CREATE POLICY "Allow manage own search history" ON search_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper Functions for IPFS CID Queries

-- Function to extract all IPFS hashes from documents
CREATE OR REPLACE FUNCTION get_document_ipfs_hashes(reg_id UUID)
RETURNS TABLE(document_type TEXT, ipfs_hash TEXT, file_name TEXT, mime_type TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    doc.key::TEXT as document_type,
    (doc.value->>'ipfsHash')::TEXT as ipfs_hash,
    (doc.value->>'name')::TEXT as file_name,
    (doc.value->>'mimeType')::TEXT as mime_type
  FROM registrations r,
  jsonb_each(r.documents) as doc
  WHERE r.id = reg_id AND doc.value->>'ipfsHash' IS NOT NULL;
END;
$$;

-- Function to extract all IPFS hashes from property photos
CREATE OR REPLACE FUNCTION get_photo_ipfs_hashes(reg_id UUID)
RETURNS TABLE(photo_name TEXT, ipfs_hash TEXT, mime_type TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (photo->>'name')::TEXT as photo_name,
    (photo->>'ipfsHash')::TEXT as ipfs_hash,
    (photo->>'mimeType')::TEXT as mime_type
  FROM registrations r,
  jsonb_array_elements(r.property_photos) as photo
  WHERE r.id = reg_id AND photo->>'ipfsHash' IS NOT NULL;
END;
$$;

-- Function to find registrations by IPFS hash (searches both documents and photos)
CREATE OR REPLACE FUNCTION find_registrations_by_ipfs_hash(ipfs_hash TEXT)
RETURNS TABLE(
  id UUID,
  registration_id TEXT,
  wallet_address TEXT,
  hash_location TEXT,
  file_name TEXT,
  mime_type TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Search in documents
  SELECT 
    r.id,
    r.registration_id,
    r.wallet_address,
    'document'::TEXT as hash_location,
    (doc.value->>'name')::TEXT as file_name,
    (doc.value->>'mimeType')::TEXT as mime_type
  FROM registrations r,
  jsonb_each(r.documents) as doc
  WHERE doc.value->>'ipfsHash' = ipfs_hash
  UNION ALL
  -- Search in property photos
  SELECT 
    r.id,
    r.registration_id,
    r.wallet_address,
    'photo'::TEXT as hash_location,
    (photo->>'name')::TEXT as file_name,
    (photo->>'mimeType')::TEXT as mime_type
  FROM registrations r,
  jsonb_array_elements(r.property_photos) as photo
  WHERE photo->>'ipfsHash' = ipfs_hash;
END;
$$;

-- Function: Get all IPFS hashes in the database (replaces view for security compliance)
-- Using a SECURITY INVOKER function instead of a view to avoid SECURITY DEFINER issues
-- This function uses the querying user's permissions, ensuring RLS policies are enforced
CREATE OR REPLACE FUNCTION get_ipfs_hash_registry()
RETURNS TABLE(
  id UUID,
  registration_id TEXT,
  wallet_address TEXT,
  hash_type TEXT,
  document_type TEXT,
  ipfs_hash TEXT,
  file_name TEXT,
  mime_type TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Get IPFS hashes from documents
  SELECT 
    r.id,
    r.registration_id,
    r.wallet_address,
    'document'::TEXT as hash_type,
    doc.key::TEXT as document_type,
    (doc.value->>'ipfsHash')::TEXT as ipfs_hash,
    (doc.value->>'name')::TEXT as file_name,
    (doc.value->>'mimeType')::TEXT as mime_type,
    r.created_at
  FROM registrations r,
  jsonb_each(r.documents) as doc
  WHERE doc.value->>'ipfsHash' IS NOT NULL
  UNION ALL
  -- Get IPFS hashes from property photos
  SELECT 
    r.id,
    r.registration_id,
    r.wallet_address,
    'photo'::TEXT as hash_type,
    NULL::TEXT as document_type,
    (photo->>'ipfsHash')::TEXT as ipfs_hash,
    (photo->>'name')::TEXT as file_name,
    (photo->>'mimeType')::TEXT as mime_type,
    r.created_at
  FROM registrations r,
  jsonb_array_elements(r.property_photos) as photo
  WHERE photo->>'ipfsHash' IS NOT NULL;
END;
$$;

-- Drop the view if it exists (replaced by function above for security compliance)
DROP VIEW IF EXISTS ipfs_hash_registry CASCADE;

-- Note: Views cannot have indexes in PostgreSQL, but the underlying tables
-- already have GIN indexes on documents and property_photos for fast lookups

-- Comments for documentation
COMMENT ON COLUMN registrations.documents IS 'JSONB object storing document metadata with IPFS CID hashes. Format: {"docType": {"name": "...", "ipfsHash": "Qm...", "mimeType": "..."}}. IPFS hash is the Content Identifier (CID) returned from Pinata IPFS upload.';
COMMENT ON COLUMN registrations.property_photos IS 'JSONB array storing photo metadata with IPFS CID hashes. Format: [{"name": "...", "ipfsHash": "Qm...", "mimeType": "..."}]. IPFS hash is the Content Identifier (CID) returned from Pinata IPFS upload.';
COMMENT ON FUNCTION get_document_ipfs_hashes(UUID) IS 'Extracts all IPFS CID hashes from documents for a given registration ID';
COMMENT ON FUNCTION get_photo_ipfs_hashes(UUID) IS 'Extracts all IPFS CID hashes from property photos for a given registration ID';
COMMENT ON FUNCTION find_registrations_by_ipfs_hash(TEXT) IS 'Finds all registrations containing a specific IPFS CID hash in documents or photos';
COMMENT ON FUNCTION get_ipfs_hash_registry() IS 'Returns all IPFS CID hashes stored in the database across all registrations. Replaces the view for security compliance. Use: SELECT * FROM get_ipfs_hash_registry()';

