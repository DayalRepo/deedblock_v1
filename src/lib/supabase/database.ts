import { supabase } from './client';

// Types
export interface RegistrationData {
  id?: string;
  user_id: string;
  registration_id: string;
  registration_date: string;
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



export interface PaymentData {
  id?: string;
  registration_id: string;
  user_id: string;
  amount: number;
  transaction_id: string;
  payment_status: 'completed' | 'pending' | 'failed';
  created_at?: string;
}

export interface SearchHistoryData {
  id?: string;
  user_id: string;
  search_type: 'registrationId' | 'surveyNumber';
  query: string;
  created_at?: string;
}

// Registration Functions
export async function saveRegistration(data: RegistrationData) {
  // Map user_id to wallet_address for DB compatibility
  const { user_id, ...rest } = data;

  const { data: result, error } = await supabase
    .from('registrations')
    .insert([{
      ...rest,
      wallet_address: user_id,
    }])
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



// Payment Functions
export async function savePayment(paymentData: Omit<PaymentData, 'id' | 'created_at'>) {
  // Map user_id to wallet_address for DB compatibility
  const { user_id, ...rest } = paymentData;

  const { data, error } = await supabase
    .from('payments')
    .insert([{
      ...rest,
      wallet_address: user_id,
      payment_status: 'completed',
    }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function checkPayment(registrationId: string, userId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('registration_id', registrationId)
    .eq('wallet_address', userId) // Checking userId against wallet_address column
    .eq('payment_status', 'completed')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking payment:', error);
    throw error;
  }

  return data !== null;
}

// Search History Functions
export async function saveSearchHistory(userId: string, searchType: 'registrationId' | 'surveyNumber', query: string) {
  // Get existing history to maintain limit of 10
  const { data: existingHistory } = await supabase
    .from('search_history')
    .select('*')
    .eq('wallet_address', userId) // Checking userId against wallet_address column
    .order('created_at', { ascending: false })
    .limit(10);

  const { data, error } = await supabase
    .from('search_history')
    .insert([{
      wallet_address: userId, // Storing userId in wallet_address column
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

export async function getSearchHistory(userId: string) {
  const { data, error } = await supabase
    .from('search_history')
    .select('*')
    .eq('wallet_address', userId) // Checking userId against wallet_address column
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching search history:', error);
    return [];
  }

  return data || [];
}
