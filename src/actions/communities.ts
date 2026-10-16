'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CommunityRecord {
  id: string;
  name: string;
  lga: string;
  is_active: boolean;
  created_at?: string;
}

/**
 * Fetch active communities directly from Supabase DB
 */
export async function getActiveCommunitiesAction(): Promise<CommunityRecord[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching communities from DB:', error);
      return [];
    }

    return (data as CommunityRecord[]) || [];
  } catch (err) {
    console.error('Exception in getActiveCommunitiesAction:', err);
    return [];
  }
}

/**
 * Fetch all communities for Control-OMP Admin management
 */
export async function getAllCommunitiesAdminAction(): Promise<CommunityRecord[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin communities from DB:', error);
      return [];
    }

    return (data as CommunityRecord[]) || [];
  } catch (err) {
    console.error('Exception in getAllCommunitiesAdminAction:', err);
    return [];
  }
}

/**
 * Add a new Community to the database
 */
export async function addCommunityAction(params: {
  name: string;
  lga?: string;
}): Promise<{ success: boolean; community?: CommunityRecord; error?: string }> {
  try {
    const trimmedName = params.name.trim();
    if (!trimmedName) {
      return { success: false, error: 'Community name cannot be empty.' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('communities')
      .insert({
        name: trimmedName,
        lga: params.lga?.trim() || 'Ogba/Egbema/Ndoni',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding community to DB:', error);
      if (error.code === '23505') {
        return { success: false, error: `Community "${trimmedName}" already exists in the database.` };
      }
      return { success: false, error: error.message || 'Failed to add community.' };
    }

    revalidatePath('/control-omp/settings');
    return { success: true, community: data as CommunityRecord };
  } catch (err: any) {
    console.error('Exception in addCommunityAction:', err);
    return { success: false, error: err.message || 'Server error adding community.' };
  }
}

/**
 * Toggle a Community's active/inactive status in DB
 */
export async function toggleCommunityStatusAction(params: {
  id: string;
  isActive: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('communities')
      .update({ is_active: params.isActive })
      .eq('id', params.id);

    if (error) {
      console.error('Error updating community status in DB:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/control-omp/settings');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete a Community from DB
 */
export async function deleteCommunityAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('communities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting community from DB:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/control-omp/settings');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
