import { supabase } from './client';
import { logger } from '@/utils/logger';

// Types
export interface RegistrationData {
  id?: string;
  user_id: string;
  registration_id: string;
  registration_date: string;
  status: 'active' | 'pending' | 'verified';

  // Property Details
  survey_number: string;
  door_number: string;
  village: string;
  taluka: string;
  district: string;
  state: string;

  // Transaction Details
  transaction_type: string;
  consideration_amount: string;
  stamp_duty: string;
  registration_fee: string;

  // Seller Information
  seller_aadhar?: string;
  seller_phone?: string;
  seller_otp_verified?: boolean;
  seller_biometric_verified?: boolean;

  // Buyer Information
  buyer_aadhar?: string;
  buyer_phone?: string;
  buyer_otp_verified?: boolean;
  buyer_biometric_verified?: boolean;

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
      user_id: user_id,

    }])
    .select()
    .single();

  if (error) {
    logger.error('Error saving registration:', JSON.stringify(error, null, 2));
    await createAuditLog('registration_failed', { error: error.message, registration_id: rest.registration_id }, 'error');
    throw error;
  }

  await createAuditLog('registration_created', { registration_id: rest.registration_id }, 'info');
  return result;
}

export async function getRegistrationById(registrationId: string) {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('registration_id', registrationId)
    .single();

  if (error) {
    logger.error('Error fetching registration:', error);
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
    logger.error('Error fetching registrations:', error);
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
    logger.error('Error fetching registrations:', error);
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
      logger.error('Error searching registrations:', error);
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
      ...rest,
      user_id: user_id,
      payment_status: 'completed',
    }])
    .select()
    .single();

  if (error) {
    logger.error('Error saving payment:', error);
    await createAuditLog('payment_failed', { error: error.message, registration_id: rest.registration_id }, 'error');
    throw error;
  }

  await createAuditLog('payment_completed', { registration_id: rest.registration_id, amount: rest.amount }, 'info');
  return data;
}

export async function checkPayment(registrationId: string, userId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('registration_id', registrationId)
    .eq('user_id', userId)
    .eq('payment_status', 'completed')
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error('Error checking payment:', error);
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
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data, error } = await supabase
    .from('search_history')
    .insert([{
      user_id: userId,
      search_type: searchType,
      query: query,
    }])
    .select()
    .single();

  if (error) {
    logger.error('Error saving search history:', JSON.stringify(error, null, 2));
    await createAuditLog('search_history_failed', { error: error.message, query, searchType }, 'error');
    throw error;
  }

  await createAuditLog('search_performed', { query, searchType }, 'info');

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
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    logger.error('Error fetching search history:', JSON.stringify(error, null, 2));
    return [];
  }

  return data || [];
}

// Audit Logging
export async function createAuditLog(action: string, metadata: any = {}, severity: 'info' | 'warning' | 'error' = 'info') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('audit_logs').insert([{
      user_id: user?.id,
      action,
      metadata,
      severity,
      ip_address: typeof window !== 'undefined' ? 'client-side' : 'server-side' // Basic differentiation
    }]);
  } catch (err) {
    logger.error('Failed to create audit log:', err);
  }
}
