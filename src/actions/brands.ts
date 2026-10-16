'use server';

import { createClient } from '@/lib/supabase/server';
import { Brand } from '@/types/marketplace';
import { revalidatePath } from 'next/cache';

/**
 * Fetch all brands from database along with their associated categories
 */
export async function getAllBrandsAction(): Promise<Brand[]> {
  try {
    const supabase = await createClient();

    // 1. Fetch all brands
    const { data: brandsData, error: brandsError } = await supabase
      .from('brands')
      .select('*')
      .order('name', { ascending: true });

    if (brandsError || !brandsData) {
      console.error('Error fetching brands:', brandsError);
      return [];
    }

    // 2. Fetch all brand-category associations
    const { data: assocData, error: assocError } = await supabase
      .from('brand_categories')
      .select(`
        brand_id,
        category:categories(id, name, slug)
      `);

    if (assocError) {
      console.warn('Error fetching brand_categories associations:', assocError);
    }

    // Group categories by brand_id
    const categoryMap: Record<string, { id: string; name: string; slug: string }[]> = {};
    if (assocData) {
      assocData.forEach((row: any) => {
        if (!categoryMap[row.brand_id]) {
          categoryMap[row.brand_id] = [];
        }
        if (row.category) {
          categoryMap[row.brand_id].push({
            id: row.category.id,
            name: row.category.name,
            slug: row.category.slug,
          });
        }
      });
    }

    return brandsData.map((b: any) => {
      const cats = categoryMap[b.id] || [];
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: b.logo_url || '',
        websiteUrl: b.website_url || '',
        description: b.description || '',
        isActive: b.is_active ?? true,
        categoryIds: cats.map((c) => c.id),
        categories: cats,
      };
    });
  } catch (err) {
    console.error('Exception in getAllBrandsAction:', err);
    return [];
  }
}

/**
 * Fetch brands associated with a specific category (by category slug or ID)
 */
export async function getBrandsByCategoryAction(categorySlugOrId?: string): Promise<Brand[]> {
  try {
    const supabase = await createClient();

    if (!categorySlugOrId || categorySlugOrId === 'all') {
      return getAllBrandsAction();
    }

    // Check if categorySlugOrId is a UUID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categorySlugOrId);

    let categoryId = categorySlugOrId;
    if (!isUuid) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlugOrId)
        .maybeSingle();

      if (catData?.id) {
        categoryId = catData.id;
      } else {
        return [];
      }
    }

    // Find brands associated with this categoryId
    const { data: brandCategoryRows, error: bcError } = await supabase
      .from('brand_categories')
      .select(`
        brand_id,
        brand:brands(*)
      `)
      .eq('category_id', categoryId);

    if (bcError || !brandCategoryRows) {
      console.error('Error in getBrandsByCategoryAction:', bcError);
      return [];
    }

    const brands: Brand[] = [];
    brandCategoryRows.forEach((row: any) => {
      if (row.brand && row.brand.is_active !== false) {
        brands.push({
          id: row.brand.id,
          name: row.brand.name,
          slug: row.brand.slug,
          logoUrl: row.brand.logo_url || '',
          websiteUrl: row.brand.website_url || '',
          description: row.brand.description || '',
          isActive: row.brand.is_active ?? true,
        });
      }
    });

    return brands;
  } catch (err) {
    console.error('Exception in getBrandsByCategoryAction:', err);
    return [];
  }
}

/**
 * Create a new brand and associate it with multiple categories
 */
export async function createBrandAction(params: {
  name: string;
  slug?: string;
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
  categoryIds?: string[];
  isActive?: boolean;
}): Promise<{ success: boolean; brand?: Brand; error?: string }> {
  try {
    const supabase = await createClient();

    const name = params.name.trim();
    const slug = (params.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();

    // 1. Insert into brands table
    const { data: newBrand, error: insertError } = await supabase
      .from('brands')
      .insert({
        name,
        slug,
        logo_url: params.logoUrl || null,
        website_url: params.websiteUrl || null,
        description: params.description || null,
        is_active: params.isActive !== undefined ? params.isActive : true,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error inserting brand:', insertError);
      return { success: false, error: insertError.message };
    }

    // 2. Associate with categories in brand_categories table
    if (params.categoryIds && params.categoryIds.length > 0) {
      const associations = params.categoryIds.map((catId) => ({
        brand_id: newBrand.id,
        category_id: catId,
      }));

      const { error: assocError } = await supabase
        .from('brand_categories')
        .insert(associations);

      if (assocError) {
        console.warn('Error associating brand with categories:', assocError);
      }
    }

    revalidatePath('/control-omp/brands');
    revalidatePath('/control-omp/categories');
    revalidatePath('/');

    return {
      success: true,
      brand: {
        id: newBrand.id,
        name: newBrand.name,
        slug: newBrand.slug,
        logoUrl: newBrand.logo_url || '',
        websiteUrl: newBrand.website_url || '',
        description: newBrand.description || '',
        isActive: newBrand.is_active,
        categoryIds: params.categoryIds || [],
      },
    };
  } catch (err: any) {
    console.error('Exception in createBrandAction:', err);
    return { success: false, error: err.message || 'Server error creating brand' };
  }
}

/**
 * Update existing brand and its category associations
 */
export async function updateBrandAction(params: {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
  categoryIds?: string[];
  isActive?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const name = params.name.trim();
    const slug = (params.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();

    // 1. Update brand info
    const updatePayload: any = {
      name,
      slug,
      updated_at: new Date().toISOString(),
    };

    if (params.logoUrl !== undefined) updatePayload.logo_url = params.logoUrl;
    if (params.websiteUrl !== undefined) updatePayload.website_url = params.websiteUrl;
    if (params.description !== undefined) updatePayload.description = params.description;
    if (params.isActive !== undefined) updatePayload.is_active = params.isActive;

    const { error: updateError } = await supabase
      .from('brands')
      .update(updatePayload)
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating brand:', updateError);
      return { success: false, error: updateError.message };
    }

    // 2. Sync category associations
    if (params.categoryIds !== undefined) {
      // Delete existing
      await supabase.from('brand_categories').delete().eq('brand_id', params.id);

      // Re-insert new
      if (params.categoryIds.length > 0) {
        const associations = params.categoryIds.map((catId) => ({
          brand_id: params.id,
          category_id: catId,
        }));
        await supabase.from('brand_categories').insert(associations);
      }
    }

    revalidatePath('/control-omp/brands');
    revalidatePath('/control-omp/categories');
    revalidatePath('/');

    return { success: true };
  } catch (err: any) {
    console.error('Exception in updateBrandAction:', err);
    return { success: false, error: err.message || 'Server error updating brand' };
  }
}

/**
 * Delete a brand
 */
export async function deleteBrandAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('brands').delete().eq('id', id);

    if (error) {
      console.error('Error deleting brand:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/control-omp/brands');
    revalidatePath('/control-omp/categories');
    revalidatePath('/');

    return { success: true };
  } catch (err: any) {
    console.error('Exception in deleteBrandAction:', err);
    return { success: false, error: err.message || 'Server error deleting brand' };
  }
}
