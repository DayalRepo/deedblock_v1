import { supabase } from './client';

// Types
export interface RegistrationData {
  id?: string;
  user_id: string;
  registration_id: string;
  registration_date: string;
  wallet_address: string;
  status: 'active' | 'pending' | 'verified';

  // Property Details
  property_type: string;
  survey_number: string;
  door_number: string;
  plot_number: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  pincode: string;
  area: string;
  area_unit: string;
  property_description?: string;

  // Transaction Details
  transaction_type: string;
  consideration_amount: string;
  stamp_duty: string;
  registration_fee: string;

  // Legacy / Additional Fields (used in Search or other components)
  sale_agreement_date?: string;

  // Seller Information
  seller_name: string;
  seller_father_name?: string;
  seller_age?: string;
  seller_address?: string;
  seller_pan?: string;
  seller_aadhar?: string;
  seller_phone?: string;
  seller_email?: string;

  // Buyer Information
  buyer_name: string;
  buyer_father_name?: string;
  buyer_age?: string;
  buyer_address?: string;
  buyer_pan?: string;
  buyer_aadhar?: string;
  buyer_phone?: string;
  buyer_email?: string;

  // Witnesses
  witnesses?: Array<{
    name: string;
    address: string;
    phone: string;
    aadhar: string;
  }>;

  // Documents (JSON object) - Now stores IPFS hashes
  documents?: Record<string, {
    name: string;
    ipfsHash: string; // IPFS hash (CID)
    mimeType: string;
  }>;

  // Property Photos (JSON array) - Now stores IPFS hashes
  property_photos?: Array<{
    name: string;
    ipfsHash: string; // IPFS hash (CID)
    mimeType: string;
  }>;

  created_at?: string;
  updated_at?: string;
}

export interface DraftData {
  id?: string;
  wallet_address: string;
  current_step: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form_data: any; // JSON object with form fields
  form_time_elapsed?: number;
  form_start_time?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentData {
  id?: string;
  registration_id: string;
  wallet_address: string;
  amount: number;
  transaction_id: string;
  payment_status: 'completed' | 'pending' | 'failed';
  created_at?: string;
}

export interface SearchHistoryData {
  id?: string;
  wallet_address: string;
  search_type: 'registrationId' | 'surveyNumber';
  query: string;
  created_at?: string;
}

// Registration Functions
export async function saveRegistration(data: RegistrationData) {
  const { data: result, error } = await supabase
    .from('registrations')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error saving registration:', JSON.stringify(error, null, 2));
    throw error;
  }

  return result;
}

export async function getRegistrationById(registrationId: string) {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('registration_id', registrationId)
    .single();

  if (error) {
    console.error('Error fetching registration:', error);
    throw error;
  }

  return data;
}

export async function getRegistrationsBySurveyNumber(surveyNumber: string) {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .ilike('survey_number', `%${surveyNumber}%`);

  if (error) {
    console.error('Error fetching registrations:', error);
    throw error;
  }

  return data || [];
}

export async function getAllRegistrations() {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching registrations:', error);
    throw error;
  }

  return data || [];
}

export async function searchRegistrations(searchType: 'registrationId' | 'surveyNumber', query: string) {
  if (searchType === 'registrationId') {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .ilike('registration_id', `%${query.toUpperCase()}%`);

    if (error) {
      console.error('Error searching registrations:', error);
      throw error;
    }

    return data || [];
  } else {
    return getRegistrationsBySurveyNumber(query);
  }
}

// Draft Functions
export async function saveDraft(walletAddress: string, draftData: Omit<DraftData, 'id' | 'wallet_address' | 'created_at' | 'updated_at'>) {
  try {
    // Use upsert to handle both insert and update atomically, avoiding race conditions
    const { data, error } = await supabase
      .from('drafts')
      .upsert({
        wallet_address: walletAddress,
        ...draftData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'wallet_address', // Use the unique constraint column
        ignoreDuplicates: false, // Update if exists
      })
      .select()
      .single();

    if (error) {
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        throw new Error('Database table "drafts" does not exist. Please run the SQL schema from database-schema.sql in your Supabase dashboard.');
      }
      throw new Error(`Failed to save draft: ${error.message || JSON.stringify(error)}`);
    }

    return data;
  } catch (error) {
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error in saveDraft:', error.message);
      throw error;
    } else {
      const errorMessage = `Unknown error saving draft: ${JSON.stringify(error)}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}

export async function getDraft(walletAddress: string) {
  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .eq('wallet_address', walletAddress)
    .maybeSingle(); // Use maybeSingle to avoid error when no rows

  if (error) {
    console.error('Error fetching draft:', error.message || JSON.stringify(error));
    throw new Error(`Failed to fetch draft: ${error.message || JSON.stringify(error)}`);
  }

  return data;
}

export async function deleteDraft(walletAddress: string) {
  const { error } = await supabase
    .from('drafts')
    .delete()
    .eq('wallet_address', walletAddress);

  if (error) {
    console.error('Error deleting draft:', error);
    throw error;
  }
}

// Payment Functions
export async function savePayment(paymentData: Omit<PaymentData, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('payments')
    .insert([{
      ...paymentData,
      payment_status: 'completed',
    }])
    .select()
    .single();

  if (error) {
    console.error('Error saving payment:', error);
    throw error;
  }

  return data;
}

export async function checkPayment(registrationId: string, walletAddress: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('registration_id', registrationId)
    .eq('wallet_address', walletAddress)
    .eq('payment_status', 'completed')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking payment:', error);
    throw error;
  }

  return data !== null;
}

// Search History Functions
export async function saveSearchHistory(walletAddress: string, searchType: 'registrationId' | 'surveyNumber', query: string) {
  // Get existing history to maintain limit of 10
  const { data: existingHistory } = await supabase
    .from('search_history')
    .select('*')
    .eq('wallet_address', walletAddress)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data, error } = await supabase
    .from('search_history')
    .insert([{
      wallet_address: walletAddress,
      search_type: searchType,
      query: query,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error saving search history:', error);
    throw error;
  }

  // Delete old entries beyond limit of 10
  if (existingHistory && existingHistory.length >= 10) {
    const oldestEntries = existingHistory.slice(9);
    for (const entry of oldestEntries) {
      await supabase
        .from('search_history')
        .delete()
        .eq('id', entry.id);
    }
  }

  return data;
}

export async function getSearchHistory(walletAddress: string) {
  const { data, error } = await supabase
    .from('search_history')
    .select('*')
    .eq('wallet_address', walletAddress)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching search history:', error);
    throw error;
  }

  return data || [];
}
