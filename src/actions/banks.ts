'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface PayoutBank {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
  createdAt: string;
}

const DEFAULT_NIGERIAN_BANKS = [
  { name: 'Access Bank PLC', code: '044' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'Zenith Bank PLC', code: '057' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058' },
  { name: 'United Bank for Africa (UBA)', code: '033' },
  { name: 'OPay Digital Services', code: '999992' },
  { name: 'Moniepoint Microfinance Bank', code: '50515' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Kuda Microfinance Bank', code: '50211' },
  { name: 'Fidelity Bank PLC', code: '070' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Sterling Bank PLC', code: '232' },
  { name: 'FCMB (First City Monument Bank)', code: '214' },
  { name: 'Wema Bank PLC', code: '035' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Keystone Bank', code: '082' },
];

/**
 * Fetch supported payout banks from database
 * Automatically seeds default banks if table is empty
 */
export async function getPayoutBanksAction(options?: { includeInactive?: boolean }): Promise<PayoutBank[]> {
  try {
    const supabase = await createClient();

    let query = supabase.from('payout_banks').select('*').order('name', { ascending: true });
    if (!options?.includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('payout_banks table query error (may need migration):', error.message);
      // Return defaults gracefully
      return DEFAULT_NIGERIAN_BANKS.map((b, i) => ({
        id: `def-${i}`,
        name: b.name,
        code: b.code,
        isActive: true,
        createdAt: new Date().toISOString(),
      }));
    }

    // If table exists but has 0 records, auto-seed defaults
    if (!data || data.length === 0) {
      try {
        const seedRows = DEFAULT_NIGERIAN_BANKS.map((b) => ({
          name: b.name,
          code: b.code,
          is_active: true,
        }));
        await supabase.from('payout_banks').insert(seedRows);
        const { data: seeded } = await supabase.from('payout_banks').select('*').order('name', { ascending: true });
        if (seeded && seeded.length > 0) {
          return seeded.map((item: any) => ({
            id: item.id,
            name: item.name,
            code: item.code || undefined,
            isActive: Boolean(item.is_active),
            createdAt: item.created_at || new Date().toISOString(),
          }));
        }
      } catch (seedErr) {
        console.warn('Auto-seed payout_banks error:', seedErr);
      }

      return DEFAULT_NIGERIAN_BANKS.map((b, i) => ({
        id: `def-${i}`,
        name: b.name,
        code: b.code,
        isActive: true,
        createdAt: new Date().toISOString(),
      }));
    }

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      code: item.code || undefined,
      isActive: Boolean(item.is_active),
      createdAt: item.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Exception in getPayoutBanksAction:', err);
    return DEFAULT_NIGERIAN_BANKS.map((b, i) => ({
      id: `def-${i}`,
      name: b.name,
      code: b.code,
      isActive: true,
      createdAt: new Date().toISOString(),
    }));
  }
}

/**
 * Admin action: Create a new payout bank in database
 */
export async function createPayoutBankAction(params: {
  name: string;
  code?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const name = params.name.trim();
    if (!name) {
      return { success: false, error: 'Bank name is required.' };
    }

    const { error } = await supabase.from('payout_banks').insert({
      name,
      code: params.code?.trim() || null,
      is_active: true,
    });

    if (error) {
      console.error('Error inserting payout bank:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/control-omp/payouts');
    revalidatePath('/vendor/wallet');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create payout bank.' };
  }
}

/**
 * Admin action: Bulk upload / import multiple payout banks
 */
export async function bulkUploadPayoutBanksAction(
  banks: Array<{ name: string; code?: string }>
): Promise<{ success: boolean; insertedCount: number; error?: string }> {
  try {
    const supabase = await createClient();
    const cleanBanks = banks
      .map((b) => ({
        name: b.name.trim(),
        code: b.code ? b.code.trim() : null,
        is_active: true,
      }))
      .filter((b) => b.name.length > 0);

    if (cleanBanks.length === 0) {
      return { success: false, insertedCount: 0, error: 'No valid bank names provided.' };
    }

    const { data, error } = await supabase
      .from('payout_banks')
      .upsert(cleanBanks, { onConflict: 'name' })
      .select();

    if (error) {
      console.error('Error bulk uploading payout banks:', error);
      return { success: false, insertedCount: 0, error: error.message };
    }

    revalidatePath('/control-omp/payouts');
    revalidatePath('/vendor/wallet');
    return { success: true, insertedCount: data?.length || cleanBanks.length };
  } catch (err: any) {
    return { success: false, insertedCount: 0, error: err.message || 'Bulk upload failed.' };
  }
}

/**
 * Admin action: Toggle active status of a payout bank
 */
export async function togglePayoutBankStatusAction(params: {
  id: string;
  isActive: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('payout_banks')
      .update({ is_active: params.isActive })
      .eq('id', params.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/control-omp/payouts');
    revalidatePath('/vendor/wallet');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to toggle bank status.' };
  }
}

/**
 * Admin action: Delete a payout bank from database
 */
export async function deletePayoutBankAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('payout_banks').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/control-omp/payouts');
    revalidatePath('/vendor/wallet');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete bank.' };
  }
}
