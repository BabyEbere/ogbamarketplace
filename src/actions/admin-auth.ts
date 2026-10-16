'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export interface ControlAdmin {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface AdminAuthResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    token: string;
  };
}

// Cryptographic hash using SHA-256 + Salt
function hashPassword(password: string): string {
  const salt = 'OGBA_CONTROL_SECRET_SALT_2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

/**
 * Log in to Control-OMP using the control_admin database table
 */
export async function loginAdminAction(formData: {
  email: string;
  password: string;
}): Promise<AdminAuthResult> {
  try {
    const inputEmail = (formData.email || '').trim().toLowerCase();
    const inputPassword = (formData.password || '').trim();

    if (!inputEmail || !inputPassword) {
      return {
        success: false,
        error: 'Please provide both email address and password.',
      };
    }

    const hashedInput = hashPassword(inputPassword);
    const supabase = await createClient();

    // 1. Check control_admin database table
    const { data: adminRecord, error: dbError } = await supabase
      .from('control_admin')
      .select('*')
      .eq('email', inputEmail)
      .eq('is_active', true)
      .single();

    if (!dbError && adminRecord) {
      // Verify password hash
      if (adminRecord.password_hash === hashedInput || adminRecord.password_hash === inputPassword) {
        // Update last login timestamp
        await supabase
          .from('control_admin')
          .update({ last_login: new Date().toISOString() })
          .eq('id', adminRecord.id);

        const token = 'omp_sec_' + Buffer.from(`${adminRecord.email}:${Date.now()}`).toString('base64');
        const cookieStore = await cookies();
        cookieStore.set('control_omp_session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });

        return {
          success: true,
          user: {
            id: adminRecord.id,
            email: adminRecord.email,
            name: adminRecord.full_name,
            role: adminRecord.role || 'super_admin',
            token,
          },
        };
      }
    }

    // 2. Breakglass fallback to server environment credentials
    const envAdminEmail = (process.env.CONTROL_OMP_ADMIN_EMAIL || 'pookietechdigitals@gmail.com').trim().toLowerCase();
    const envAdminPassword = (process.env.CONTROL_OMP_ADMIN_PASSWORD || 'Orekeemmanuel').trim();
    const envAdminName = process.env.CONTROL_OMP_ADMIN_NAME || 'Emmanuel Oreke';

    if (inputEmail === envAdminEmail && inputPassword === envAdminPassword) {
      const token = 'omp_sec_' + Buffer.from(`${inputEmail}:${Date.now()}`).toString('base64');
      const cookieStore = await cookies();
      cookieStore.set('control_omp_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return {
        success: true,
        user: {
          id: '99999999-9999-9999-9999-999999999999',
          email: inputEmail,
          name: envAdminName,
          role: 'super_admin',
          token,
        },
      };
    }

    return {
      success: false,
      error: 'Invalid administrator email or password.',
    };
  } catch (err) {
    console.error('Error during admin login action:', err);
    return {
      success: false,
      error: 'An unexpected server authentication error occurred.',
    };
  }
}

/**
 * Fetch all admins from control_admin table
 */
export async function getAdminAccountsAction(): Promise<ControlAdmin[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('control_admin')
      .select('id, email, full_name, role, is_active, last_login, created_at')
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
    }

    // Default primary admin if table is newly initialized
    return [
      {
        id: '99999999-9999-9999-9999-999999999999',
        email: 'pookietechdigitals@gmail.com',
        full_name: 'Emmanuel Oreke',
        role: 'super_admin',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];
  } catch (err) {
    console.error('Error fetching admins:', err);
    return [
      {
        id: '99999999-9999-9999-9999-999999999999',
        email: 'pookietechdigitals@gmail.com',
        full_name: 'Emmanuel Oreke',
        role: 'super_admin',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];
  }
}

/**
 * Add a new administrator to control_admin table
 */
export async function createAdminAccountAction(data: {
  full_name: string;
  email: string;
  password: string;
  role: string;
}): Promise<{ success: boolean; error?: string; admin?: ControlAdmin }> {
  try {
    const name = data.full_name.trim();
    const email = data.email.trim().toLowerCase();
    const rawPassword = data.password.trim();
    const role = data.role || 'operations_manager';

    if (!name || !email || !rawPassword) {
      return { success: false, error: 'Full name, email address, and temporary password are required.' };
    }

    if (rawPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const password_hash = hashPassword(rawPassword);
    const supabase = await createClient();

    const { data: newAdmin, error } = await supabase
      .from('control_admin')
      .insert({
        full_name: name,
        email,
        password_hash,
        role,
        is_active: true,
      })
      .select('id, email, full_name, role, is_active, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'An administrator with this email already exists in control_admin.' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, admin: newAdmin };
  } catch (err) {
    console.error('Error creating admin account:', err);
    return { success: false, error: 'Failed to create administrator account.' };
  }
}

/**
 * Change administrator password
 */
export async function changeAdminPasswordAction(data: {
  email: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const email = data.email.trim().toLowerCase();
    const currentPass = data.currentPassword.trim();
    const newPass = data.newPassword.trim();

    if (!email || !currentPass || !newPass) {
      return { success: false, error: 'Please enter current password and new password.' };
    }

    if (newPass.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    const currentHash = hashPassword(currentPass);
    const newHash = hashPassword(newPass);
    const supabase = await createClient();

    // Verify current password
    const { data: adminRecord, error } = await supabase
      .from('control_admin')
      .select('id, password_hash')
      .eq('email', email)
      .single();

    if (adminRecord) {
      if (adminRecord.password_hash !== currentHash && adminRecord.password_hash !== currentPass) {
        return { success: false, error: 'Current password does not match our records.' };
      }

      // Update password hash
      const { error: updateErr } = await supabase
        .from('control_admin')
        .update({ password_hash: newHash, updated_at: new Date().toISOString() })
        .eq('id', adminRecord.id);

      if (updateErr) {
        return { success: false, error: updateErr.message };
      }

      return { success: true };
    }

    return { success: true };
  } catch (err) {
    console.error('Error changing admin password:', err);
    return { success: false, error: 'Failed to update password.' };
  }
}

/**
 * Delete or deactivate admin account
 */
export async function deleteAdminAccountAction(adminId: string, currentAdminEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Check if target is super admin
    const { data: target } = await supabase.from('control_admin').select('email, role').eq('id', adminId).single();
    if (target?.email === currentAdminEmail) {
      return { success: false, error: 'You cannot delete your own active administrator account.' };
    }

    const { error } = await supabase.from('control_admin').delete().eq('id', adminId);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to delete administrator account.' };
  }
}

/**
 * Log out
 */
export async function logoutAdminAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('control_omp_session');
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}
