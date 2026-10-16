import {
  pgTable,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  uuid,
  jsonb,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 1. Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  fullName: text('full_name').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('buyer'), // 'buyer' | 'vendor' | 'rider' | 'admin'
  platform: text('platform').default('web'), // 'app' | 'web'
  isActive: boolean('is_active').default(true).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Vendors Table
export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  storeName: text('store_name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  category: text('category').notNull(),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  address: text('address').notNull(),
  zone: text('zone').notNull().default('Omoku Central'),
  phone: text('phone').notNull(),
  commissionRate: numeric('commission_rate', { precision: 4, scale: 2 }).default('5.00').notNull(),
  rating: numeric('rating', { precision: 2, scale: 1 }).default('5.0').notNull(),
  reviewsCount: integer('reviews_count').default(0).notNull(),
  balance: numeric('balance', { precision: 12, scale: 2 }).default('0.00').notNull(),
  isOpen: boolean('is_open').default(true).notNull(),
  kycStatus: text('kyc_status').default('unverified').notNull(), // 'unverified' | 'pending' | 'verified' | 'rejected'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Riders Table
export const riders = pgTable('riders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  bikeModel: text('bike_model').notNull(),
  plateNumber: text('plate_number').notNull(),
  assignedZone: text('assigned_zone').notNull().default('Omoku Central'),
  isOnline: boolean('is_online').default(false).notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  rating: numeric('rating', { precision: 2, scale: 1 }).default('5.0').notNull(),
  totalDeliveries: integer('total_deliveries').default(0).notNull(),
  balance: numeric('balance', { precision: 12, scale: 2 }).default('0.00').notNull(),
  currentLatitude: numeric('current_latitude', { precision: 10, scale: 7 }),
  currentLongitude: numeric('current_longitude', { precision: 10, scale: 7 }),
  kycStatus: text('kyc_status').default('unverified').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Categories Table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  icon: text('icon').notNull(),
  description: text('description'),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Products Table
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').references(() => vendors.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 2 }),
  imageUrl: text('image_url'),
  galleryUrls: jsonb('gallery_urls').$type<string[]>().default([]),
  stockQuantity: integer('stock_quantity').default(10).notNull(),
  inStock: boolean('in_stock').default(true).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  salesCount: integer('sales_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. Orders Table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(), // e.g. ORD-9821
  customerId: uuid('customer_id').references(() => users.id),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  riderId: uuid('rider_id').references(() => riders.id),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).default('1000.00').notNull(),
  commissionAmount: numeric('commission_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'preparing' | 'ready_for_pickup' | 'in_transit' | 'delivered' | 'cancelled'
  paymentStatus: text('payment_status').default('unpaid').notNull(), // 'unpaid' | 'paid' | 'refunded'
  paymentMethod: text('payment_method').default('online').notNull(), // 'online' | 'bank_transfer' | 'cash_on_delivery'
  paymentReference: text('payment_reference'),
  deliveryAddress: text('delivery_address').notNull(),
  deliveryZone: text('delivery_zone').notNull().default('Omoku Central'),
  notes: text('notes'),
  channel: text('channel').default('web').notNull(), // 'mobile_app' | 'web'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 7. Order Items Table
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 12, scale: 2 }).notNull(),
});

// 8. Payouts Ledger Table
export const payouts = pgTable('payouts', {
  id: text('id').primaryKey(), // e.g. PAY-401
  recipientType: text('recipient_type').notNull(), // 'vendor' | 'rider'
  vendorId: uuid('vendor_id').references(() => vendors.id),
  riderId: uuid('rider_id').references(() => riders.id),
  recipientName: text('recipient_name').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  bankName: text('bank_name').notNull(),
  accountNumber: text('account_number').notNull(),
  accountName: text('account_name').notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
  transactionRef: text('transaction_ref'),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
});

// 9. KYC Documents Table
export const kycVerifications = pgTable('kyc_verifications', {
  id: text('id').primaryKey(), // e.g. KYC-801
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  entityType: text('entity_type').notNull(), // 'vendor' | 'rider'
  applicantName: text('applicant_name').notNull(),
  documentType: text('document_type').notNull(), // 'nin' | 'cac' | 'voter_card' | 'drivers_license' | 'bike_papers'
  documentNumber: text('document_number'),
  documentUrl: text('document_url'),
  status: text('status').default('pending').notNull(), // 'pending' | 'verified' | 'rejected'
  adminNotes: text('admin_notes'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
});

// Types exports for TypeScript type-safety
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;
export type Rider = typeof riders.$inferSelect;
export type NewRider = typeof riders.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
export type KycVerification = typeof kycVerifications.$inferSelect;
