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
      vendor:vendors(id, slug, business_name, market_location, is_verified, rating, review_count),
      category:categories(id, name, slug),
      brand:brands(id, name, slug, logo_url)
    `);

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
        vendorVerified: vendorData?.is_verified ?? true,
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
      vendorVerified: vendorData?.is_verified ?? true,
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
        vendorVerified: vendorData?.is_verified ?? true,
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
 * Admin action: Delete a product from database
 */
export async function deleteProductAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      console.error('Error deleting product from DB:', error);
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
