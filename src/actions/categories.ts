'use server';

import { createClient } from '@/lib/supabase/server';
import { Category } from '@/types/marketplace';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { revalidatePath } from 'next/cache';

export interface AdminCategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  imageUrl?: string;
  displayOrder: number;
  itemCount: number;
  createdAt: string;
}

/**
 * Public action: get categories for storefront
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        iconName: cat.icon_name || 'Layers',
        itemCount: 45,
        featured: true,
      }));
    }

    return DEFAULT_CATEGORIES;
  } catch (err) {
    console.error('Error fetching categories:', err);
    return DEFAULT_CATEGORIES;
  }
}

/**
 * Admin action: get all categories with live product counts directly from database
 */
export async function getAllCategoriesAdminAction(): Promise<AdminCategoryRecord[]> {
  try {
    const supabase = await createClient();

    // 1. Fetch all categories
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (catError || !catData) {
      console.error('Error fetching categories in admin action:', catError);
      return [];
    }

    // 2. Fetch product counts per category
    const { data: prodData } = await supabase
      .from('products')
      .select('category_id');

    const counts: Record<string, number> = {};
    if (prodData) {
      prodData.forEach((p: any) => {
        if (p.category_id) {
          counts[p.category_id] = (counts[p.category_id] || 0) + 1;
        }
      });
    }

    return catData.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon_name || 'Layers',
      imageUrl: cat.image_url || '',
      displayOrder: cat.display_order ?? 0,
      itemCount: counts[cat.id] || 0,
      createdAt: cat.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Exception in getAllCategoriesAdminAction:', err);
    return [];
  }
}

/**
 * Admin action: Create a new category in Supabase database
 */
export async function createCategoryAction(params: {
  name: string;
  slug?: string;
  description?: string;
  iconName?: string;
  imageUrl?: string;
  displayOrder?: number;
}): Promise<{ success: boolean; category?: AdminCategoryRecord; error?: string }> {
  try {
    const supabase = await createClient();

    const name = params.name.trim();
    const slug = (params.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        description: params.description?.trim() || null,
        icon_name: params.iconName || 'Layers',
        image_url: params.imageUrl || null,
        display_order: params.displayOrder !== undefined ? Number(params.displayOrder) : 0,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating category in DB:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/control-omp/categories');
    revalidatePath('/control-omp/brands');
    revalidatePath('/control-omp/products');
    revalidatePath('/');

    return {
      success: true,
      category: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        icon: data.icon_name || 'Layers',
        imageUrl: data.image_url || '',
        displayOrder: data.display_order || 0,
        itemCount: 0,
        createdAt: data.created_at,
      },
    };
  } catch (err: any) {
    console.error('Exception in createCategoryAction:', err);
    return { success: false, error: err.message || 'Server error creating category' };
  }
}

/**
 * Admin action: Update existing category
 */
export async function updateCategoryAction(params: {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  iconName?: string;
  imageUrl?: string;
  displayOrder?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const name = params.name.trim();
    const slug = (params.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();

    const { error } = await supabase
      .from('categories')
      .update({
        name,
        slug,
        description: params.description?.trim() || null,
        icon_name: params.iconName || 'Layers',
        image_url: params.imageUrl || null,
        display_order: params.displayOrder !== undefined ? Number(params.displayOrder) : 0,
      })
      .eq('id', params.id);

    if (error) {
      console.error('Error updating category in DB:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/control-omp/categories');
    revalidatePath('/control-omp/brands');
    revalidatePath('/control-omp/products');
    revalidatePath('/');

    return { success: true };
  } catch (err: any) {
    console.error('Exception in updateCategoryAction:', err);
    return { success: false, error: err.message || 'Server error updating category' };
  }
}

/**
 * Admin action: Delete a category from database
 */
export async function deleteCategoryAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Check if category has products
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (count && count > 0) {
      return {
        success: false,
        error: `Cannot delete this department because it currently has ${count} associated products in the database. Reassign or delete those products first.`,
      };
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      console.error('Error deleting category from DB:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/control-omp/categories');
    revalidatePath('/control-omp/brands');
    revalidatePath('/control-omp/products');
    revalidatePath('/');

    return { success: true };
  } catch (err: any) {
    console.error('Exception in deleteCategoryAction:', err);
    return { success: false, error: err.message || 'Server error deleting category' };
  }
}
