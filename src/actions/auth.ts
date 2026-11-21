'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { trackUserHeartbeat } from '@/lib/redis';

const USER_SESSION_COOKIE = 'ogba_user_session';

export interface UserSessionData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'buyer' | 'vendor' | 'rider' | 'admin';
  community: string;
}

function normalizeNigerianPhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    return '234' + cleaned.slice(1);
  }
  if (cleaned.length === 10 && !cleaned.startsWith('234')) {
    return '234' + cleaned;
  }
  return cleaned;
}

/**
 * Complete customer sign-in or registration after OTP verification.
 */
export async function completeUserLoginAction(params: {
  phoneNumber?: string;
  email?: string;
  fullName?: string;
  community?: string;
}): Promise<{ success: boolean; user?: UserSessionData; message: string }> {
  try {
    const supabase = await createClient();
    const normalizedPhone = params.phoneNumber ? normalizeNigerianPhone(params.phoneNumber) : '';
    const cleanEmail = params.email ? params.email.trim().toLowerCase() : '';

    if (!normalizedPhone && !cleanEmail) {
      return { success: false, message: 'Phone number or email is required.' };
    }

    let existingUser: any = null;
    if (cleanEmail) {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, phone_number, role, community, is_active')
        .eq('email', cleanEmail)
        .maybeSingle();
      existingUser = data;
    }

    if (!existingUser && normalizedPhone) {
      const localFormat = normalizedPhone.startsWith('234')
        ? '0' + normalizedPhone.slice(3)
        : normalizedPhone;
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, phone_number, role, community, is_active')
        .or(
          `phone_number.eq.${normalizedPhone},phone_number.eq.+${normalizedPhone},phone_number.eq.${localFormat}`
        )
        .maybeSingle();
      existingUser = data;
    }

    if (existingUser && existingUser.is_active === false) {
      return {
        success: false,
        message: 'This account is currently suspended. Please contact Ogba Marketplace support.',
      };
    }

    let userRecord = existingUser;

    if (!userRecord) {
      const fallbackEmail = cleanEmail || `${normalizedPhone}@buyer.ogbamarketplace.com.ng`;
      const displayName =
        params.fullName?.trim() ||
        (cleanEmail ? cleanEmail.split('@')[0] : `Shopper ${normalizedPhone.slice(-4)}`);

      const { data: created, error: insertErr } = await supabase
        .from('users')
        .insert({
          full_name: displayName,
          email: fallbackEmail,
          phone_number: normalizedPhone || null,
          role: 'buyer',
          platform: 'web',
          community: params.community || 'Omoku',
          is_active: true,
          is_verified: true,
        })
        .select('id, full_name, email, phone_number, role, community')
        .single();

      if (insertErr || !created) {
        console.warn('Could not persist buyer to Supabase users table, using session fallback:', insertErr?.message);
        userRecord = {
          id: `web-${Date.now()}`,
          full_name: displayName,
          email: fallbackEmail,
          phone_number: normalizedPhone,
          role: 'buyer',
          community: params.community || 'Omoku',
        };
      } else {
        userRecord = created;
      }
    }

    const sessionUser: UserSessionData = {
      id: userRecord.id,
      fullName: userRecord.full_name || 'Ogba Shopper',
      email: userRecord.email || cleanEmail || '',
      phone: userRecord.phone_number || normalizedPhone || '',
      role: (userRecord.role as UserSessionData['role']) || 'buyer',
      community: userRecord.community || params.community || 'Omoku',
    };

    const cookieStore = await cookies();
    cookieStore.set(USER_SESSION_COOKIE, JSON.stringify(sessionUser), {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    await trackUserHeartbeat(sessionUser.id, sessionUser.role, 'web').catch(() => {});

    return {
      success: true,
      user: sessionUser,
      message: `Welcome, ${sessionUser.fullName}!`,
    };
  } catch (err: any) {
    console.error('completeUserLoginAction error:', err);
    return { success: false, message: err?.message || 'Unable to sign in right now.' };
  }
}

export async function getCurrentUserAction(): Promise<UserSessionData | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(USER_SESSION_COOKIE)?.value;
    if (!raw) return null;
    return JSON.parse(raw) as UserSessionData;
  } catch {
    return null;
  }
}

export async function updateUserProfileAction(params: {
  fullName: string;
  community: string;
  phone?: string;
}): Promise<{ success: boolean; user?: UserSessionData; message: string }> {
  try {
    const current = await getCurrentUserAction();
    if (!current) {
      return { success: false, message: 'Please sign in first.' };
    }

    const updated: UserSessionData = {
      ...current,
      fullName: params.fullName.trim() || current.fullName,
      community: params.community || current.community,
      phone: params.phone ? normalizeNigerianPhone(params.phone) : current.phone,
    };

    if (!current.id.startsWith('web-')) {
      const supabase = await createClient();
      await supabase
        .from('users')
        .update({
          full_name: updated.fullName,
          community: updated.community,
          phone_number: updated.phone || null,
        })
        .eq('id', current.id);
    }

    const cookieStore = await cookies();
    cookieStore.set(USER_SESSION_COOKIE, JSON.stringify(updated), {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return { success: true, user: updated, message: 'Profile updated successfully.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to update profile.' };
  }
}

export async function logoutUserAction(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  cookieStore.delete(USER_SESSION_COOKIE);
  return { success: true };
}

