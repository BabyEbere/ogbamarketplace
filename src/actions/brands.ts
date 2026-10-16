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

export interface BrandRequestRecord {
  id: string;
  vendorId: string;
  vendorName: string;
  brandName: string;
  categoryId?: string;
  categoryName?: string;
  websiteUrl?: string;
  logoUrl?: string;
  description?: string;
  status: 'pending' | 'approved' | 'declined';
  rejectionReason?: string;
  createdAt: string;
}

/**
 * Vendor submits a brand request
 */
export async function requestNewBrandAction(params: {
  vendorId?: string;
  brandName: string;
  categoryId?: string;
  websiteUrl?: string;
  logoUrl?: string;
  description?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const brandName = params.brandName.trim();

    if (!brandName) {
      return { success: false, error: 'Please enter the brand name.' };
    }

    const { error } = await supabase.from('brand_requests').insert({
      vendor_id: params.vendorId || null,
      brand_name: brandName,
      category_id: params.categoryId || null,
      website_url: params.websiteUrl?.trim() || null,
      logo_url: params.logoUrl?.trim() || null,
      description: params.description?.trim() || null,
      status: 'pending',
    });

    if (error) {
      console.error('Error submitting brand request:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/control-omp/brands');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit brand request.' };
  }
}

/**
 * Admin fetches brand requests
 */
export async function getBrandRequestsAction(
  filterStatus?: 'pending' | 'approved' | 'declined' | 'all'
): Promise<BrandRequestRecord[]> {
  try {
    const supabase = await createClient();
    let query = supabase.from('brand_requests').select(`
      *,
      vendor:vendors(id, business_name),
      category:categories(id, name)
    `).order('created_at', { ascending: false });

    if (filterStatus && filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('Error fetching brand requests:', error);
      return [];
    }

    return data.map((r: any) => ({
      id: r.id,
      vendorId: r.vendor_id || '',
      vendorName: r.vendor?.business_name || 'Merchant Store',
      brandName: r.brand_name,
      categoryId: r.category_id,
      categoryName: r.category?.name || 'All Departments',
      websiteUrl: r.website_url,
      logoUrl: r.logo_url,
      description: r.description,
      status: r.status,
      rejectionReason: r.rejection_reason,
      createdAt: r.created_at,
    }));
  } catch (err) {
    console.error('Exception in getBrandRequestsAction:', err);
    return [];
  }
}

/**
 * Admin reviews (approves or declines) a brand request
 */
export async function reviewBrandRequestAction(params: {
  requestId: string;
  action: 'approve' | 'decline';
  rejectionReason?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    if (params.action === 'approve') {
      // 1. Fetch request details
      const { data: req, error: reqErr } = await supabase
        .from('brand_requests')
        .select('*')
        .eq('id', params.requestId)
        .single();

      if (reqErr || !req) {
        return { success: false, error: 'Brand request not found.' };
      }

      // 2. Insert into brands
      const slug = req.brand_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data: brand, error: bErr } = await supabase
        .from('brands')
        .upsert({
          name: req.brand_name,
          slug,
          website_url: req.website_url,
          logo_url: req.logo_url || null,
          description: req.description,
          is_active: true,
        }, { onConflict: 'slug' })
        .select('id')
        .single();

      if (bErr) {
        console.error('Error inserting brand from request:', bErr);
        return { success: false, error: bErr.message };
      }

      // 3. Associate with category if provided
      if (req.category_id && brand?.id) {
        await supabase
          .from('brand_categories')
          .upsert({
            brand_id: brand.id,
            category_id: req.category_id,
          }, { onConflict: 'brand_id,category_id' });
      }

      // 4. Update request status to approved
      await supabase
        .from('brand_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', params.requestId);
    } else {
      // Decline
      await supabase
        .from('brand_requests')
        .update({
          status: 'declined',
          rejection_reason: params.rejectionReason?.trim() || 'Brand request does not meet platform criteria.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.requestId);
    }

    revalidatePath('/control-omp/brands');
    revalidatePath('/control-omp/products');
    revalidatePath('/vendor/products');
    revalidatePath('/');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to review brand request.' };
  }
}
