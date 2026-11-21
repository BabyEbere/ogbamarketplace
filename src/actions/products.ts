'use server';

import { createClient } from '@/lib/supabase/server';
import { Product, Vendor } from '@/types/marketplace';
import { revalidatePath } from 'next/cache';
import { getPlatformSettingsAction } from './settings';
import { verifyPaystackReference } from '@/lib/paystack';
import {
  sendDealPaymentVendorEmail,
  sendDealPromotionAdminNotificationEmail,
  EmailRecipient,
} from '@/lib/email/mailer';

export async function getProducts(options?: {
  categorySlug?: string;
  brandSlug?: string;
  brandId?: string;
  searchQuery?: string;
  isDealOfDay?: boolean;
  includeInactive?: boolean;
}): Promise<Product[]> {
  try {
    const supabase = await createClient();

    let query = supabase.from('products').select(`
      id,
      vendor_id,
      brand_id,
      brand_name,
      title,
      slug,
      description,
      price,
      compare_at_price,
      stock_quantity,
      unit,
      is_deal_of_day,
      is_fresh_produce,
      images,
      approval_status,
      is_active,
      attributes,
      vendor:vendors(id, slug, business_name, market_location, is_verified, rating, review_count),
      category:categories(id, name, slug),
      brand:brands(id, name, slug, logo_url)
    `);

    // Only show active and approved products to marketplace shoppers by default
    if (!options?.includeInactive) {
      query = query.eq('is_active', true).eq('approval_status', 'approved');
    }

    if (options?.categorySlug && options.categorySlug !== 'all') {
      query = query.eq('category.slug', options.categorySlug);
    }

    if (options?.brandSlug && options.brandSlug !== 'all') {
      query = query.eq('brand.slug', options.brandSlug);
    }

    if (options?.brandId) {
      query = query.eq('brand_id', options.brandId);
    }

    if (options?.isDealOfDay) {
      query = query.eq('is_deal_of_day', true);
    }

    const { data: rawData, error } = await query;
    let data: any[] | null = rawData;

    // Resilient fallback: if query failed due to brands table or foreign key relationship PGRST200
    if (error) {
      console.warn('Initial rich getProducts query failed, falling back to core query:', error.message);
      let fallbackQuery = supabase.from('products').select(`
        id,
        vendor_id,
        brand_id,
        brand_name,
        title,
        slug,
        description,
        price,
        compare_at_price,
        stock_quantity,
        unit,
        is_deal_of_day,
        is_fresh_produce,
        images,
        approval_status,
        is_active,
        attributes,
        vendor:vendors(id, slug, business_name, market_location, is_verified, rating, review_count),
        category:categories(id, name, slug)
      `);

      if (!options?.includeInactive) {
        fallbackQuery = fallbackQuery.eq('is_active', true).eq('approval_status', 'approved');
      }
      if (options?.isDealOfDay) {
        fallbackQuery = fallbackQuery.eq('is_deal_of_day', true);
      }

      const fbResult = await fallbackQuery;
      if (fbResult.error) {
        console.error('Fallback products query failed:', fbResult.error);
        return [];
      }
      data = fbResult.data;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Post-filter: double guarantee that unapproved or inactive products never leak to buyers
    if (!options?.includeInactive) {
      data = data.filter((item: any) => item.is_active !== false && item.approval_status === 'approved');
    }

    const now = Date.now();
    return data
      .filter((item: any) => {
        if (options?.isDealOfDay) {
          const rawExpiresAt = item.attributes?.deal_expires_at;
          return Boolean(item.is_deal_of_day) && Boolean(rawExpiresAt) && new Date(rawExpiresAt).getTime() > now;
        }
        return true;
      })
      .map((item: any) => {
        const vendorData = item.vendor;
        const categoryData = item.category;
        const brandData = item.brand;
        const rawExpiresAt = item.attributes?.deal_expires_at;
        const isDealValid = Boolean(item.is_deal_of_day) && Boolean(rawExpiresAt) && new Date(rawExpiresAt).getTime() > now;

        return {
          id: item.id,
          vendorId: item.vendor_id || '',
          vendorName: vendorData?.business_name || 'Verified Merchant',
          vendorLocation: vendorData?.market_location || 'Omoku, Rivers State',
          vendorVerified: Boolean(vendorData?.is_verified),
          title: item.title,
          slug: item.slug || item.id,
          description: item.description || '',
          price: Number(item.price) || 0,
          compareAtPrice: item.compare_at_price ? Number(item.compare_at_price) : undefined,
          categoryId: categoryData?.id || item.category_id,
          categorySlug: categoryData?.slug || 'all',
          categoryName: categoryData?.name || 'Department',
          brandId: item.brand_id || brandData?.id,
          brandName: brandData?.name || item.brand_name,
          brandSlug: brandData?.slug,
          brandLogo: brandData?.logo_url,
          images:
            item.images && Array.isArray(item.images) && item.images.length > 0
              ? item.images
              : ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80'],
          stock: item.stock_quantity ?? 0,
          unit: item.unit || 'Unit',
          isDealOfDay: isDealValid,
          isFreshProduce: Boolean(item.is_fresh_produce),
          rating: Number(vendorData?.rating) || 0,
          reviewCount: Number(vendorData?.review_count) || 0,
          sku: `OGB-${item.id ? item.id.substring(0, 5).toUpperCase() : 'PRD'}`,
        };
      });
  } catch (err) {
    console.error('Error in getProducts action:', err);
    return [];
  }
}

export async function getProductBySlug(slugOrId: string): Promise<Product | null> {
  try {
    const supabase = await createClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    let query = supabase
      .from('products')
      .select(`
        id,
        vendor_id,
        category_id,
        brand_id,
        brand_name,
        title,
        slug,
        description,
        price,
        compare_at_price,
        stock_quantity,
        unit,
        is_deal_of_day,
        is_fresh_produce,
        images,
        attributes,
        vendor:vendors(id, slug, business_name, market_location, is_verified, rating, review_count),
        category:categories(id, name, slug),
        brand:brands(id, name, slug, logo_url)
      `);

    if (isUuid) {
      query = query.or(`id.eq.${slugOrId},slug.eq.${slugOrId}`);
    } else {
      query = query.eq('slug', slugOrId);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      if (error) console.error('Supabase query error in getProductBySlug:', error);
      return null;
    }

    // Do not show inactive or pending products to marketplace buyers
    if ((data as any).is_active === false || ((data as any).approval_status && (data as any).approval_status !== 'approved')) {
      return null;
    }

    const vendorData = (data as any).vendor;
    const categoryData = (data as any).category;
    const brandData = (data as any).brand;

    return {
      id: data.id,
      vendorId: data.vendor_id || '',
      vendorName: vendorData?.business_name || 'Verified Merchant',
      vendorSlug: vendorData?.slug,
      vendorLocation: vendorData?.market_location || 'Omoku, Rivers State',
      vendorVerified: Boolean(vendorData?.is_verified),
      title: data.title,
      slug: data.slug || data.id,
      description: data.description || '',
      price: Number(data.price) || 0,
      compareAtPrice: data.compare_at_price ? Number(data.compare_at_price) : undefined,
      categoryId: categoryData?.id || data.category_id,
      categorySlug: categoryData?.slug || 'all',
      categoryName: categoryData?.name || 'Department',
      brandId: data.brand_id || brandData?.id,
      brandName: brandData?.name || data.brand_name,
      brandSlug: brandData?.slug,
      brandLogo: brandData?.logo_url,
      images:
        data.images && Array.isArray(data.images) && data.images.length > 0
          ? data.images
          : ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80'],
      stock: data.stock_quantity ?? 15,
      unit: data.unit || 'Piece',
      isDealOfDay: Boolean((data as any).is_deal_of_day) && Boolean((data as any).attributes?.deal_expires_at) && new Date((data as any).attributes.deal_expires_at).getTime() > Date.now(),
      isFreshProduce: Boolean(data.is_fresh_produce),
      rating: Number(vendorData?.rating) || 0,
      reviewCount: Number(vendorData?.review_count) || 0,
      sku: `OGB-${data.id ? data.id.substring(0, 5).toUpperCase() : 'PRD'}`,
    };
  } catch (err) {
    console.error('Error in getProductBySlug:', err);
    return null;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  return getProductBySlug(id);
}

/**
 * Record a product view and increment view count for category popularity
 */
export async function recordProductViewAction(productIdOrSlug: string): Promise<void> {
  try {
    const supabase = await createClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdOrSlug);

    let query = supabase.from('products').select('id, view_count');
    if (isUuid) {
      query = query.eq('id', productIdOrSlug);
    } else {
      query = query.eq('slug', productIdOrSlug);
    }

    const { data: prod } = await query.maybeSingle();
    if (prod?.id) {
      const currentViews = Number(prod.view_count) || 0;
      await supabase
        .from('products')
        .update({
          view_count: currentViews + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prod.id);
    }
  } catch (err) {
    console.warn('Error recording product view:', err);
  }
}

/**
 * Fetch true similar products that strictly share the SAME category
 * (No random cross-category dumping)
 */
export async function getSimilarProducts(categorySlug?: string, excludeSlugOrId?: string): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const isUuid = excludeSlugOrId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(excludeSlugOrId);

    const baseSelect = `
      id,
      vendor_id,
      brand_id,
      brand_name,
      title,
      slug,
      description,
      price,
      compare_at_price,
      stock_quantity,
      unit,
      is_deal_of_day,
      images,
      vendor:vendors(id, slug, business_name, market_location, is_verified, rating, review_count),
      category:categories(id, name, slug),
      brand:brands(id, name, slug, logo_url)
    `;

    // Strictly resolve category ID from slug
    let categoryId: string | null = null;
    if (categorySlug && categorySlug !== 'all') {
      const isCatUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categorySlug);
      if (isCatUuid) {
        categoryId = categorySlug;
      } else {
        const { data: catRow } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .maybeSingle();
        if (catRow?.id) categoryId = catRow.id;
      }
    }

    let query = supabase
      .from('products')
      .select(baseSelect)
      .eq('is_active', true)
      .eq('approval_status', 'approved');

    if (excludeSlugOrId) {
      if (isUuid) {
        query = query.neq('id', excludeSlugOrId);
      } else {
        query = query.neq('slug', excludeSlugOrId);
      }
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query.limit(8);

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((item: any) => {
      const vendorData = item.vendor;
      const categoryData = item.category;
      const brandData = item.brand;

      return {
        id: item.id,
        vendorId: item.vendor_id || '',
        vendorName: vendorData?.business_name || 'Verified Merchant',
        vendorSlug: vendorData?.slug,
        vendorLocation: vendorData?.market_location || 'Omoku, Rivers State',
        vendorVerified: Boolean(vendorData?.is_verified),
        title: item.title,
        slug: item.slug || item.id,
        description: item.description || '',
        price: Number(item.price) || 0,
        compareAtPrice: item.compare_at_price ? Number(item.compare_at_price) : undefined,
        categorySlug: categoryData?.slug || 'all',
        categoryName: categoryData?.name || 'Department',
        brandId: item.brand_id || brandData?.id,
        brandName: brandData?.name || item.brand_name,
        brandSlug: brandData?.slug,
        brandLogo: brandData?.logo_url,
        images:
          item.images && Array.isArray(item.images) && item.images.length > 0
            ? item.images
            : ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80'],
        stock: item.stock_quantity ?? 10,
        unit: item.unit || 'Piece',
        isDealOfDay: Boolean(item.is_deal_of_day),
        rating: Number(vendorData?.rating) || 0,
        reviewCount: Number(vendorData?.review_count) || 0,
        sku: `OGB-${item.id ? item.id.substring(0, 5).toUpperCase() : 'PRD'}`,
      };
    });
  } catch (err) {
    console.error('Error in getSimilarProducts:', err);
    return [];
  }
}

export async function getVendorById(idOrSlug: string): Promise<Vendor | null> {
  try {
    const supabase = await createClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let query = supabase.from('vendors').select('*');
    if (isUuid) {
      query = query.or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`);
    } else {
      query = query.eq('slug', idOrSlug);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      if (error) console.error('Supabase query error in getVendorById:', error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id || '',
      businessName: data.business_name || 'Ogba Verified Merchant',
      slug: data.slug || data.id,
      marketLocation: data.market_location || 'Omoku Main Market, Rivers State',
      area: (data.area as any) || 'Omoku',
      rating: Number(data.rating) || 4.9,
      reviewCount: Number(data.review_count) || 42,
      isVerified: Boolean(data.is_verified),
      avatar: '',
      bannerImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      phone: '',
      whatsapp: '',
      joinedDate: data.created_at || 'Verified Vendor',
      totalSales: data.total_sales || 120,
    };
  } catch (err) {
    console.error('Error in getVendorById:', err);
    return null;
  }
}

export async function getVendorProducts(vendorIdOrSlug: string): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vendorIdOrSlug);

    let query = supabase.from('products').select(`
      id,
      vendor_id,
      title,
      slug,
      description,
      price,
      compare_at_price,
      stock_quantity,
      unit,
      is_deal_of_day,
      images,
      vendor:vendors(id, slug, business_name, market_location, is_verified, rating, review_count),
      category:categories(id, name, slug)
    `)
    .eq('is_active', true)
    .eq('approval_status', 'approved');

    if (isUuid) {
      query = query.eq('vendor_id', vendorIdOrSlug);
    } else {
      query = query.eq('vendor.slug', vendorIdOrSlug);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((item: any) => {
      const vendorData = item.vendor;
      const categoryData = item.category;

      return {
        id: item.id,
        vendorId: item.vendor_id || '',
        vendorName: vendorData?.business_name || 'Verified Merchant',
        vendorLocation: vendorData?.market_location || 'Omoku, Rivers State',
        vendorVerified: vendorData?.is_verified ?? true,
        title: item.title,
        slug: item.slug || item.id,
        description: item.description || '',
        price: Number(item.price) || 0,
        compareAtPrice: item.compare_at_price ? Number(item.compare_at_price) : undefined,
        categorySlug: categoryData?.slug || 'all',
        categoryName: categoryData?.name || 'Department',
        images:
          item.images && Array.isArray(item.images) && item.images.length > 0
            ? item.images
            : ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80'],
        stock: item.stock_quantity ?? 10,
        unit: item.unit || 'Piece',
        isDealOfDay: Boolean(item.is_deal_of_day),
        rating: Number(vendorData?.rating) || 0,
        reviewCount: Number(vendorData?.review_count) || 0,
        sku: `OGB-${item.id ? item.id.substring(0, 5).toUpperCase() : 'PRD'}`,
      };
    });
  } catch (err) {
    console.error('Error in getVendorProducts:', err);
    return [];
  }
}

/**
 * Admin action: toggle Deal of the Day or Featured status
 */
export async function toggleProductDealAction(params: {
  id: string;
  isDealOfDay: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const now = new Date();

    const { data: prod } = await supabase.from('products').select('attributes').eq('id', params.id).maybeSingle();
    const existingAttr = (prod?.attributes && typeof prod.attributes === 'object') ? prod.attributes : {};

    const updatedAttr = params.isDealOfDay
      ? {
          ...existingAttr,
          deal_expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          deal_activated_at: now.toISOString(),
          deal_payment_method: 'admin_override',
          deal_duration_days: 7,
        }
      : {
          ...existingAttr,
          deal_expires_at: null,
          deal_activated_at: null,
        };

    const { error } = await supabase
      .from('products')
      .update({
        is_deal_of_day: params.isDealOfDay,
        attributes: updatedAttr,
        updated_at: now.toISOString(),
      })
      .eq('id', params.id);

    if (error) {
      console.error('Error toggling product deal in DB:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/control-omp/products');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete or permanently archive a product from database
 */
export async function deleteProductAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Attempt hard deletion first, checking affected rows
    const { data: deletedRows, error: hardDeleteErr } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select('id');

    // 2. If hard delete failed or 0 rows deleted (due to RLS or FK constraint), perform permanent soft archive
    if (hardDeleteErr || !deletedRows || deletedRows.length === 0) {
      console.warn('Hard delete did not affect rows; performing permanent soft archive:', hardDeleteErr?.message);

      const { error: softDeleteErr } = await supabase
        .from('products')
        .update({
          is_active: false,
          approval_status: 'declined',
          stock_quantity: 0,
          rejection_reason: 'Permanently deleted by merchant / admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (softDeleteErr) {
        console.error('Soft delete update failed:', softDeleteErr.message);
        return { success: false, error: softDeleteErr.message };
      }
    }

    revalidatePath('/control-omp/products');
    revalidatePath('/vendor/products');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete product.' };
  }
}

/**
 * Toggle stock availability of a product
 */
export async function toggleProductStockAction(params: {
  id: string;
  inStock: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('products')
      .update({
        stock_quantity: params.inStock ? 10 : 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/vendor/products');
    revalidatePath('/control-omp/products');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update stock.' };
  }
}

/**
 * Admin action: Update product details in database
 */
export async function updateProductAdminAction(params: {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  unit?: string;
  categoryId?: string;
  brandId?: string;
  vendorId?: string;
  description?: string;
  images?: string[];
  isDealOfDay?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const updatePayload: any = {
      title: params.title.trim(),
      price: params.price,
      compare_at_price: params.compareAtPrice || null,
      stock_quantity: params.stock,
      updated_at: new Date().toISOString(),
    };

    if (params.unit) updatePayload.unit = params.unit;
    if (params.categoryId) updatePayload.category_id = params.categoryId;
    if (params.brandId !== undefined) updatePayload.brand_id = params.brandId || null;
    if (params.vendorId) updatePayload.vendor_id = params.vendorId;
    if (params.description !== undefined) updatePayload.description = params.description;
    if (params.isDealOfDay !== undefined) updatePayload.is_deal_of_day = params.isDealOfDay;
    if (params.images !== undefined) {
      updatePayload.images = params.images.filter(img => Boolean(img && img.trim()));
    }

    const { error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', params.id);

    if (error) {
      console.error('Error updating product in DB:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/control-omp/products');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Admin action: Create a new product in database
 */
export async function createProductAdminAction(params: {
  title: string;
  slug?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  unit?: string;
  categoryId: string;
  brandId?: string;
  vendorId?: string;
  description?: string;
  images?: string[];
  isDealOfDay?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const title = params.title.trim();
    const slug = (params.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();

    // Default vendor fallback if none specified: pick first vendor
    let vendorId = params.vendorId;
    if (!vendorId) {
      const { data: firstVendor } = await supabase.from('vendors').select('id').limit(1).maybeSingle();
      if (firstVendor?.id) {
        vendorId = firstVendor.id;
      }
    }

    if (!vendorId) {
      return { success: false, error: 'A merchant vendor must exist in the marketplace to create a product.' };
    }

    if (!params.images || params.images.length === 0 || !params.images[0].trim()) {
      return { success: false, error: 'A square product image is mandatory. Please upload a photo.' };
    }

    const { error } = await supabase.from('products').insert({
      title,
      slug,
      vendor_id: vendorId,
      category_id: params.categoryId,
      brand_id: params.brandId || null,
      price: params.price,
      compare_at_price: params.compareAtPrice || null,
      stock_quantity: params.stock,
      unit: params.unit || 'Piece',
      description: params.description || '',
      images: params.images,
      is_deal_of_day: params.isDealOfDay || false,
    });

    if (error) {
      console.error('Error creating product in DB:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/control-omp/products');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface VendorProductItem {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  categoryId: string;
  brandName?: string;
  brandId?: string;
  imageUrl: string;
  images: string[];
  description: string;
  unit: string;
  stock: number;
  inStock: boolean;
  approvalStatus: 'pending' | 'approved' | 'declined';
  rejectionReason?: string;
  isActive: boolean;
  isDealOfDay?: boolean;
  dealExpiresAt?: string;
  createdAt: string;
}

/**
 * Vendor action: Create product (defaults to pending approval, not yet live)
 */
export async function createVendorProductAction(params: {
  vendorId: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  unit?: string;
  categoryId: string;
  brandId?: string;
  description?: string;
  imageUrl?: string;
  images?: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const title = params.title.trim();
    if (!title) {
      return { success: false, error: 'Product name is required.' };
    }
    if (!params.price || params.price <= 0) {
      return { success: false, error: 'Please enter a valid selling price.' };
    }

    // Resolve images array
    const finalImages: string[] = [];
    if (params.images && params.images.length > 0) {
      params.images.forEach((img) => {
        if (img && img.trim()) finalImages.push(img.trim());
      });
    } else if (params.imageUrl && params.imageUrl.trim()) {
      finalImages.push(params.imageUrl.trim());
    }

    if (finalImages.length === 0) {
      return { success: false, error: 'At least one square product photo is required.' };
    }

    // 1. Resolve a valid vendor_id to satisfy foreign key constraint on products(vendor_id)
    let targetVendorId = params.vendorId;

    if (targetVendorId) {
      // Check if it exists directly in vendors table
      const { data: vDirect } = await supabase
        .from('vendors')
        .select('id')
        .eq('id', targetVendorId)
        .maybeSingle();

      if (!vDirect?.id) {
        // Check if it is a user_id that has a row in vendors table
        const { data: vByUser } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', targetVendorId)
          .maybeSingle();

        if (vByUser?.id) {
          targetVendorId = vByUser.id;
        } else {
          // Attempt to provision the missing vendor row
          try {
            const { data: uData } = await supabase
              .from('users')
              .select('*')
              .eq('id', targetVendorId)
              .maybeSingle();

            const cleanName = uData?.full_name || 'Merchant';
            const cleanSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            const { data: newV } = await supabase
              .from('vendors')
              .insert({
                user_id: targetVendorId,
                business_name: `${cleanName}'s Store`,
                slug: `${cleanSlug}-${targetVendorId.slice(0, 4)}`,
                market_location: uData?.delivery_address || 'Omoku Main Market, Rivers State',
                area: uData?.area || 'Omoku',
                kyc_status: 'pending',
                is_verified: false,
                rating: 5.0,
                review_count: 0,
                total_sales: 0,
              })
              .select('id')
              .maybeSingle();

            if (newV?.id) {
              targetVendorId = newV.id;
            }
          } catch (e) {
            // RLS blocked vendor creation
          }
        }
      }
    }

    // Fallback: If targetVendorId still isn't present in vendors table, pick the first existing vendor
    if (!targetVendorId) {
      const { data: anyVendor } = await supabase.from('vendors').select('id').limit(1).maybeSingle();
      if (anyVendor?.id) {
        targetVendorId = anyVendor.id;
      }
    }

    // Verify targetVendorId is valid in vendors table before inserting to prevent FK constraint failure
    const { data: finalVCheck } = await supabase.from('vendors').select('id').eq('id', targetVendorId).maybeSingle();
    if (!finalVCheck?.id) {
      const { data: fallbackV } = await supabase.from('vendors').select('id').limit(1).maybeSingle();
      if (fallbackV?.id) {
        targetVendorId = fallbackV.id;
      }
    }

    // 2. Resolve category_id
    let targetCategoryId = params.categoryId;
    if (!targetCategoryId) {
      const { data: firstCat } = await supabase.from('categories').select('id').limit(1).maybeSingle();
      targetCategoryId = firstCat?.id || '11111111-1111-1111-1111-111111111111';
    }

    // 3. Resolve brand_id (only if valid UUID)
    const isBrandUuid = params.brandId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.brandId);

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;

    const { error } = await supabase.from('products').insert({
      vendor_id: targetVendorId,
      category_id: targetCategoryId,
      brand_id: isBrandUuid ? params.brandId : null,
      title,
      slug,
      price: params.price,
      compare_at_price: params.compareAtPrice || null,
      stock_quantity: params.stock || 1,
      unit: params.unit || 'Piece',
      description: params.description?.trim() || `${title} - Verified quality product on Ogba Marketplace.`,
      images: finalImages,
      approval_status: 'pending', // Requires admin approval!
      is_active: false, // Hidden until approved!
    });

    if (error) {
      console.error('Error inserting vendor product:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/vendor/products');
    revalidatePath('/control-omp/products');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit product for review.' };
  }
}

/**
 * Vendor action: Update or add images to an existing product
 */
export async function updateVendorProductImagesAction(params: {
  vendorId: string;
  productId: string;
  images: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const validImages = params.images.filter((img) => Boolean(img && img.trim()));
    if (validImages.length === 0) {
      return { success: false, error: 'A product must have at least one image.' };
    }

    const { error } = await supabase
      .from('products')
      .update({ images: validImages, updated_at: new Date().toISOString() })
      .eq('id', params.productId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/vendor/products');
    revalidatePath(`/products/${params.productId}`);
    revalidatePath('/control-omp/products');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update product images.' };
  }
}

/**
 * Vendor / Admin action: Activate Deal of the Day promotion for a chosen duration
 * Payment can be made from vendor wallet balance or verified Paystack reference
 */
export async function activateDealOfDayAction(params: {
  vendorId: string;
  productId: string;
  durationDays: number;
  paymentMethod: 'wallet' | 'paystack';
  paystackReference?: string;
  vendorEmail?: string;
}): Promise<{ success: boolean; error?: string; expiresAt?: string; totalCost?: number }> {
  try {
    const supabase = await createClient();

    // 1. Fetch platform settings for the daily promotion rate
    const settings = await getPlatformSettingsAction();
    const pricePerDay = Number(settings.dealOfDayPricePerDay) || 500;
    const durationDays = Math.max(1, Math.min(params.durationDays, 365));
    const totalCost = pricePerDay * durationDays;

    // 2. Fetch the product
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('id, title, slug, price, images, vendor_id, attributes')
      .eq('id', params.productId)
      .maybeSingle();

    if (prodErr || !product) {
      return { success: false, error: 'Product not found.' };
    }

    // 3. Process payment
    if (params.paymentMethod === 'wallet') {
      // Find the user_id for this vendor
      const { data: vendorRec } = await supabase
        .from('vendors')
        .select('id, user_id')
        .eq('id', params.vendorId)
        .maybeSingle();

      const userId = vendorRec?.user_id || params.vendorId;

      const { data: userRec, error: userErr } = await supabase
        .from('users')
        .select('id, wallet_balance, full_name, email')
        .eq('id', userId)
        .maybeSingle();

      if (userErr || !userRec) {
        return { success: false, error: 'Vendor user account not found.' };
      }

      const currentBalance = Number(userRec.wallet_balance) || 0;
      if (currentBalance < totalCost) {
        return {
          success: false,
          error: `Insufficient wallet balance (₦${currentBalance.toLocaleString()}). Required: ₦${totalCost.toLocaleString()}. Please choose Paystack Checkout or top up your wallet.`,
        };
      }

      // Deduct from wallet
      const newBalance = currentBalance - totalCost;
      const { error: deductErr } = await supabase
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', userId);

      if (deductErr) {
        return { success: false, error: 'Failed to debit vendor wallet.' };
      }

      // Record in wallet_transactions table
      try {
        await supabase.from('wallet_transactions').insert({
          user_id: userId,
          amount: -totalCost,
          transaction_type: 'debit',
          description: `Deal of the Day Promotion (${durationDays} days): ${product.title}`,
          status: 'completed',
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Wallet transaction logging notice:', e);
      }
    } else if (params.paymentMethod === 'paystack') {
      if (!params.paystackReference) {
        return { success: false, error: 'Payment reference from Paystack is required.' };
      }

      const verifyRes = await verifyPaystackReference(params.paystackReference);
      if (!verifyRes.success) {
        return { success: false, error: verifyRes.error || 'Could not verify Paystack payment transaction.' };
      }

      const paidKobo = verifyRes.data?.amount;
      const expectedKobo = totalCost * 100;
      if (paidKobo && paidKobo < expectedKobo) {
        return {
          success: false,
          error: `Payment amount underpaid. Paid: ₦${paidKobo / 100}, required: ₦${totalCost}.`,
        };
      }
    }

    // 4. Activate Deal of the Day on the product
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const existingAttributes = (product.attributes && typeof product.attributes === 'object')
      ? product.attributes
      : {};

    const updatedAttributes = {
      ...existingAttributes,
      deal_expires_at: expiresAt,
      deal_duration_days: durationDays,
      deal_activated_at: now.toISOString(),
      deal_payment_method: params.paymentMethod,
      deal_amount_paid: totalCost,
      deal_daily_rate: pricePerDay,
    };

    const { error: updateErr } = await supabase
      .from('products')
      .update({
        is_deal_of_day: true,
        attributes: updatedAttributes,
        updated_at: now.toISOString(),
      })
      .eq('id', params.productId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // 5. Send automated confirmation email to the Vendor and alert to all Platform Admins
    try {
      const targetVendorId = product.vendor_id || params.vendorId;
      const { data: vendorRecord } = await supabase
        .from('vendors')
        .select('id, user_id, business_name, slug, market_location')
        .eq('id', targetVendorId)
        .maybeSingle();

      let vendorUser: { full_name?: string; email?: string; phone_number?: string } | null = null;
      const vendorUserId = vendorRecord?.user_id || targetVendorId;
      if (vendorUserId) {
        const { data: uData } = await supabase
          .from('users')
          .select('id, full_name, email, phone_number')
          .eq('id', vendorUserId)
          .maybeSingle();
        vendorUser = uData;
      }

      const businessName = vendorRecord?.business_name || 'Vendor Merchant';
      const vendorName = vendorUser?.full_name || businessName;
      const rawVendorEmail = vendorUser?.email || params.vendorEmail || '';
      const vendorEmail = (rawVendorEmail && rawVendorEmail.includes('@')) ? rawVendorEmail.trim() : '';

      const rawImages = product.images;
      const productThumb = Array.isArray(rawImages) && rawImages.length > 0 && typeof rawImages[0] === 'string'
        ? rawImages[0]
        : undefined;

      // A. Dispatch confirmation email to the promoting Vendor
      if (vendorEmail) {
        await sendDealPaymentVendorEmail({
          vendorEmail,
          vendorName,
          businessName,
          productId: product.id,
          productSlug: product.slug,
          productTitle: product.title,
          productPrice: Number(product.price) || 0,
          productImageUrl: productThumb,
          durationDays,
          dailyRate: pricePerDay,
          totalAmountPaid: totalCost,
          paymentMethod: params.paymentMethod,
          paystackReference: params.paystackReference,
          activatedAt: now.toISOString(),
          expiresAt,
        });
      } else {
        console.warn(`[Mailer Notice] No valid vendor email found for vendorId: ${targetVendorId}`);
      }

      // B. Dispatch notification email to ALL Platform Admins
      const { data: adminUsers } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('role', 'admin')
        .not('email', 'is', null);

      const adminRecipients: EmailRecipient[] = (adminUsers || [])
        .filter((adm: any) => adm.email && typeof adm.email === 'string' && adm.email.includes('@'))
        .map((adm: any) => ({
          email: adm.email.trim(),
          name: adm.full_name || 'Admin',
        }));

      if (adminRecipients.length > 0) {
        await sendDealPromotionAdminNotificationEmail({
          adminRecipients,
          vendorName,
          vendorEmail: vendorEmail || 'No email provided',
          vendorPhone: vendorUser?.phone_number || undefined,
          businessName,
          marketLocation: vendorRecord?.market_location || undefined,
          productId: product.id,
          productSlug: product.slug,
          productTitle: product.title,
          productPrice: Number(product.price) || 0,
          productImageUrl: productThumb,
          durationDays,
          dailyRate: pricePerDay,
          totalAmountPaid: totalCost,
          paymentMethod: params.paymentMethod,
          paystackReference: params.paystackReference,
          activatedAt: now.toISOString(),
          expiresAt,
        });
      } else {
        console.warn('[Mailer Notice] No admin users found with role=admin in users table.');
      }
    } catch (emailErr) {
      console.error('[Deal Promotion Mailer Exception]:', emailErr);
    }

    revalidatePath('/');
    revalidatePath('/vendor/products');
    revalidatePath('/control-omp/products');
    revalidatePath(`/products/${product.id}`);

    return {
      success: true,
      expiresAt,
      totalCost,
    };
  } catch (err: any) {
    console.error('Exception in activateDealOfDayAction:', err);
    return { success: false, error: err.message || 'Failed to activate Deal of the Day.' };
  }
}

/**
 * Fetch all products belonging to a specific vendor
 */
export async function getVendorProductsAction(vendorId: string): Promise<VendorProductItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name),
        brand:brands(id, name)
      `)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching vendor products:', error);
      return [];
    }

    const now = Date.now();
    const staleProductIds: string[] = [];

    const mappedProducts = data.map((item: any) => {
      const img = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '';
      const rawExpiresAt = item.attributes?.deal_expires_at;
      const isDealValid = Boolean(item.is_deal_of_day) && Boolean(rawExpiresAt) && new Date(rawExpiresAt).getTime() > now;

      if (item.is_deal_of_day && !isDealValid) {
        staleProductIds.push(item.id);
      }

      return {
        id: item.id,
        name: item.title,
        price: Number(item.price) || 0,
        compareAtPrice: item.compare_at_price ? Number(item.compare_at_price) : undefined,
        category: item.category?.name || 'Department',
        categoryId: item.category_id,
        brandName: item.brand?.name || item.brand_name || undefined,
        brandId: item.brand_id,
        imageUrl: img,
        images: Array.isArray(item.images) ? item.images : [img],
        description: item.description || '',
        unit: item.unit || 'Piece',
        stock: item.stock_quantity ?? 0,
        inStock: (item.stock_quantity ?? 0) > 0,
        approvalStatus: item.approval_status || (item.is_active ? 'approved' : 'pending'),
        rejectionReason: item.rejection_reason,
        isActive: Boolean(item.is_active),
        isDealOfDay: isDealValid,
        dealExpiresAt: isDealValid ? rawExpiresAt : undefined,
        createdAt: item.created_at || new Date().toISOString(),
      };
    });

    // Asynchronously cleanup any stale or unpromoted deal flags in the database
    if (staleProductIds.length > 0) {
      (async () => {
        try {
          await supabase
            .from('products')
            .update({ is_deal_of_day: false, updated_at: new Date().toISOString() })
            .in('id', staleProductIds);
        } catch (e) {
          console.error('Failed to cleanup stale deal flags:', e);
        }
      })();
    }

    return mappedProducts;
  } catch (err) {
    console.error('Exception in getVendorProductsAction:', err);
    return [];
  }
}

/**
 * Admin action: Get count of pending products awaiting approval
 */
export async function getPendingProductsCountAction(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending');

    if (error) return 0;
    return count || 0;
  } catch (err) {
    return 0;
  }
}

export interface PendingProductReviewRecord {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorLocation: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  unit: string;
  categoryName: string;
  brandName?: string;
  images: string[];
  description: string;
  createdAt: string;
}

/**
 * Admin action: Fetch all pending products awaiting approval
 */
export async function getPendingProductsReviewAction(): Promise<PendingProductReviewRecord[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        vendor:vendors(id, business_name, market_location),
        category:categories(id, name),
        brand:brands(id, name)
      `)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching pending products:', error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      vendorId: item.vendor_id,
      vendorName: item.vendor?.business_name || 'Vendor Merchant',
      vendorLocation: item.vendor?.market_location || 'Omoku',
      title: item.title,
      slug: item.slug,
      price: Number(item.price) || 0,
      compareAtPrice: item.compare_at_price ? Number(item.compare_at_price) : undefined,
      stock: item.stock_quantity ?? 0,
      unit: item.unit || 'Piece',
      categoryName: item.category?.name || 'Unassigned',
      brandName: item.brand?.name || undefined,
      images: Array.isArray(item.images) ? item.images : [],
      description: item.description || '',
      createdAt: item.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Exception in getPendingProductsReviewAction:', err);
    return [];
  }
}

/**
 * Admin approves a pending product
 */
export async function approveProductAction(productId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('products')
      .update({
        approval_status: 'approved',
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (error) {
      console.error('Error approving product in DB:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/control-omp/products');
    revalidatePath('/vendor/products');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to approve product.' };
  }
}

/**
 * Admin declines a pending product with a mandatory reason
 */
export async function declineProductAction(params: {
  productId: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const reason = params.reason.trim();
    if (!reason) {
      return { success: false, error: 'A reason is required when declining a product.' };
    }

    const { error } = await supabase
      .from('products')
      .update({
        approval_status: 'declined',
        is_active: false,
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.productId);

    if (error) {
      console.error('Error declining product in DB:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/control-omp/products');
    revalidatePath('/vendor/products');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to decline product.' };
  }
}

export interface MarketplaceDealRecord {
  productId: string;
  productTitle: string;
  productSlug: string;
  productPrice: number;
  productImage: string;
  vendorId: string;
  vendorStoreName: string;
  vendorOwnerName: string;
  vendorEmail: string;
  vendorPhone: string;
  vendorLocation: string;
  isDealActive: boolean;
  dealExpiresAt: string;
  dealActivatedAt: string;
  dealDurationDays: number;
  dealAmountPaid: number;
  dealDailyRate: number;
  dealPaymentMethod: string;
}

/**
 * Fetch all marketplace deals for marketing management (both active and past campaigns)
 */
export async function getAllMarketplaceDealsAction(): Promise<{
  activeDeals: MarketplaceDealRecord[];
  pastDeals: MarketplaceDealRecord[];
  totalRevenue: number;
  activeCount: number;
  dailyRate: number;
}> {
  try {
    const supabase = await createClient();
    const settings = await getPlatformSettingsAction();
    const dailyRate = Number(settings.dealOfDayPricePerDay) || 500;

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        slug,
        price,
        images,
        is_deal_of_day,
        attributes,
        vendor:vendors(
          id,
          business_name,
          market_location,
          user:users(id, full_name, email, phone_number)
        )
      `)
      .not('attributes->deal_expires_at', 'is', null)
      .order('updated_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching marketplace deals:', error);
      return { activeDeals: [], pastDeals: [], totalRevenue: 0, activeCount: 0, dailyRate };
    }

    const now = Date.now();
    const activeDeals: MarketplaceDealRecord[] = [];
    const pastDeals: MarketplaceDealRecord[] = [];
    let totalRevenue = 0;

    data.forEach((p: any) => {
      const attr = p.attributes || {};
      const expiresAt = attr.deal_expires_at;
      if (!expiresAt) return;

      const isDealActive = Boolean(p.is_deal_of_day) && new Date(expiresAt).getTime() > now;
      const amountPaid = Number(attr.deal_amount_paid) || 0;
      totalRevenue += amountPaid;

      const v = p.vendor;
      const u = v?.user;
      const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '';

      const rec: MarketplaceDealRecord = {
        productId: p.id,
        productTitle: p.title,
        productSlug: p.slug || p.id,
        productPrice: Number(p.price) || 0,
        productImage: img,
        vendorId: v?.id || '',
        vendorStoreName: v?.business_name || 'Vendor Merchant',
        vendorOwnerName: u?.full_name || v?.business_name || 'Merchant',
        vendorEmail: u?.email || '',
        vendorPhone: u?.phone_number || '',
        vendorLocation: v?.market_location || 'Omoku, Rivers State',
        isDealActive,
        dealExpiresAt: expiresAt,
        dealActivatedAt: attr.deal_activated_at || '',
        dealDurationDays: Number(attr.deal_duration_days) || 0,
        dealAmountPaid: amountPaid,
        dealDailyRate: Number(attr.deal_daily_rate) || dailyRate,
        dealPaymentMethod: attr.deal_payment_method || 'wallet',
      };

      if (isDealActive) {
        activeDeals.push(rec);
      } else {
        pastDeals.push(rec);
      }
    });

    return {
      activeDeals,
      pastDeals,
      totalRevenue,
      activeCount: activeDeals.length,
      dailyRate,
    };
  } catch (err) {
    console.error('Exception in getAllMarketplaceDealsAction:', err);
    return { activeDeals: [], pastDeals: [], totalRevenue: 0, activeCount: 0, dailyRate: 500 };
  }
}
