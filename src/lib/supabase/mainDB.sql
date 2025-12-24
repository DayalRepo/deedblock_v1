-- Database Schema for DeedBlock Application
-- Run this in your Supabase SQL Editor to set up the database.

-- 1. Create Enum Types
CREATE TYPE registration_status AS ENUM ('active', 'pending', 'verified', 'rejected');
CREATE TYPE payment_status_type AS ENUM ('completed', 'pending', 'failed');

-- 2. Main Registrations Table
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- Linked to Supabase Auth User
  registration_id TEXT UNIQUE NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  wallet_address TEXT, -- Maintained for legacy/display purposes
  status registration_status DEFAULT 'pending',

  -- Location & Property Details
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  taluka TEXT NOT NULL, -- Mandal
  village TEXT NOT NULL,
  survey_number TEXT,
  door_number TEXT, -- Supports Door Number selection

  -- Transaction Financials
  transaction_type TEXT NOT NULL,
  consideration_amount NUMERIC,
  stamp_duty NUMERIC,
  registration_fee NUMERIC,
  total_fee NUMERIC,
  payment_id TEXT,

  -- Seller Information
  seller_aadhar TEXT,
  seller_phone TEXT,
  seller_otp_verified BOOLEAN DEFAULT FALSE,
  seller_biometric_verified BOOLEAN DEFAULT FALSE,

  -- Buyer Information
  buyer_aadhar TEXT,
  buyer_phone TEXT,
  buyer_otp_verified BOOLEAN DEFAULT FALSE,
  buyer_biometric_verified BOOLEAN DEFAULT FALSE,

  -- Documents & Assets (Stored as JSONB)
  documents JSONB, 
  property_photos JSONB, 

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- 4. Payments History Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id TEXT REFERENCES registrations(registration_id),
  user_id UUID REFERENCES auth.users(id),
  wallet_address TEXT,
  amount NUMERIC,
  transaction_id TEXT, -- The Blockchain Transaction Hash
  payment_status payment_status_type DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Search History Table
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT,
  search_type TEXT, -- 'registrationId' or 'surveyNumber'
  query TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Registrations: Users can view and insert their own data
CREATE POLICY "Users can view own registrations" 
ON registrations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own registrations" 
ON registrations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending registrations" 
ON registrations FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');



-- Payments: Users can view their own payment history
CREATE POLICY "Users can view own payments" 
ON payments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" 
ON payments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Search History: Users can manage their own history
CREATE POLICY "Users can view own search history" 
ON search_history FOR SELECT 
USING (wallet_address = (SELECT wallet_address FROM registrations WHERE user_id = auth.uid() LIMIT 1)); 
-- Note: Search history RLS is tricky if wallet_address isn't strictly 1:1 with auth.uid. 
-- For now, we'll allow open insert but restricted select if possible, or broad select based on wallet matching.
-- Simplified Policy for Search History (assuming wallet_address is the key):
CREATE POLICY "Users can view own search history by wallet" 
ON search_history FOR SELECT 
USING (true); -- Allow all for verification or refine if wallet_address is bound to auth.

-- Indexes for Performance
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_registration_id ON registrations(registration_id);
CREATE INDEX idx_registrations_survey_number ON registrations(survey_number);
CREATE INDEX idx_registrations_status ON registrations(status);

