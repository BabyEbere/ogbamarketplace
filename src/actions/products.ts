'use server';

import { createClient } from '@/lib/supabase/server';
import { Product, Vendor } from '@/types/marketplace';
import { revalidatePath } from 'next/cache';

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
      vendor:vendors(id, slug, business_name, market_location, is_verified, rating, review_count),
      category:categories(id, name, slug),
      brand:brands(id, name, slug, logo_url)
    `);

    // Only show active and approved products to marketplace shoppers by default
    if (!options?.includeInactive) {
      query = query.eq('is_active', true);
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

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      if (error) console.error('Supabase query error in getProducts:', error);
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
        isDealOfDay: Boolean(item.is_deal_of_day),
        isFreshProduce: Boolean(item.is_fresh_produce),
        rating: Number(vendorData?.rating) || 4.9,
        reviewCount: Number(vendorData?.review_count) || 38,
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

    const vendorData = (data as any).vendor;
    const categoryData = (data as any).category;
    const brandData = (data as any).brand;

    return {
      id: data.id,
      vendorId: data.vendor_id || '',
      vendorName: vendorData?.business_name || 'Verified Merchant',
      vendorLocation: vendorData?.market_location || 'Omoku, Rivers State',
      vendorVerified: Boolean(vendorData?.is_verified),
      title: data.title,
      slug: data.slug || data.id,
      description: data.description || '',
      price: Number(data.price) || 0,
      compareAtPrice: data.compare_at_price ? Number(data.compare_at_price) : undefined,
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
      isDealOfDay: Boolean(data.is_deal_of_day),
      isFreshProduce: Boolean(data.is_fresh_produce),
      rating: Number(vendorData?.rating) || 4.9,
      reviewCount: Number(vendorData?.review_count) || 38,
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

    let query = supabase.from('products').select(baseSelect);

    if (excludeSlugOrId) {
      if (isUuid) {
        query = query.neq('id', excludeSlugOrId);
      } else {
        query = query.neq('slug', excludeSlugOrId);
      }
    }

    if (categorySlug && categorySlug !== 'all') {
      query = query.eq('category.slug', categorySlug);
    }

    const { data, error } = await query.limit(8);

    let items = (data && !error) ? [...data] : [];

    // If we have fewer than 4 items in the same category, fetch other top items to make the section rich
    if (items.length < 4) {
      const existingIds = items.map((i: any) => i.id);
      if (excludeSlugOrId && isUuid) existingIds.push(excludeSlugOrId);

      let fallbackQuery = supabase
        .from('products')
        .select(baseSelect)
        .limit(8 - items.length);

      if (existingIds.length > 0) {
        fallbackQuery = fallbackQuery.not('id', 'in', `(${existingIds.join(',')})`);
      }

      const { data: fallbackData } = await fallbackQuery;
      if (fallbackData && fallbackData.length > 0) {
        items = [...items, ...fallbackData];
      }
    }

    if (items.length === 0) {
      return [];
    }

    return items.map((item: any) => {
      const vendorData = item.vendor;
      const categoryData = item.category;
      const brandData = item.brand;

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
        rating: Number(vendorData?.rating) || 4.9,
        reviewCount: Number(vendorData?.review_count) || 24,
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
    `);

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
        rating: Number(vendorData?.rating) || 4.9,
        reviewCount: Number(vendorData?.review_count) || 24,
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
    const { error } = await supabase
      .from('products')
      .update({ is_deal_of_day: params.isDealOfDay, updated_at: new Date().toISOString() })
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

    // 1. Attempt hard deletion first
    const { error: hardDeleteErr } = await supabase.from('products').delete().eq('id', id);

    if (hardDeleteErr) {
      console.warn('Hard delete on products failed (likely foreign key constraint); falling back to soft archive:', hardDeleteErr.message);

      // 2. If blocked by foreign key (e.g. order_items), soft archive so it never comes back
      const { error: softDeleteErr } = await supabase
        .from('products')
        .update({
          is_active: false,
          approval_status: 'declined',
          rejection_reason: 'Deleted by merchant / admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (softDeleteErr) {
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
  description?: string;
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
    if (params.description !== undefined) updatePayload.description = params.description;
    if (params.isDealOfDay !== undefined) updatePayload.is_deal_of_day = params.isDealOfDay;

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
      images: params.images && params.images.length > 0 ? params.images : ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80'],
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
  imageUrl: string;
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
    if (!params.imageUrl || !params.imageUrl.trim()) {
      return { success: false, error: 'A square product image is required. Please upload an image.' };
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;

    const { error } = await supabase.from('products').insert({
      vendor_id: params.vendorId,
      category_id: params.categoryId,
      brand_id: params.brandId || null,
      title,
      slug,
      price: params.price,
      compare_at_price: params.compareAtPrice || null,
      stock_quantity: params.stock || 1,
      unit: params.unit || 'Piece',
      description: params.description?.trim() || '',
      images: [params.imageUrl.trim()],
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

    return data.map((item: any) => {
      const img = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '';
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
        createdAt: item.created_at || new Date().toISOString(),
      };
    });
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
