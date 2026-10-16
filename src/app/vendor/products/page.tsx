'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Layers,
  X,
  Tag,
  DollarSign,
  Boxes,
} from 'lucide-react';

interface VendorProduct {
  id: string;
  name: string;
  price: string;
  compareAtPrice?: string;
  category: string;
  imageUrl: string;
  description: string;
  unit: string;
  stock: number;
  inStock: boolean;
  salesCount: number;
}

export default function VendorProductsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [products, setProducts] = useState<VendorProduct[]>([
    {
      id: 'MP-01',
      name: 'Hot Egusi Soup & Semovita (Portion)',
      price: '₦2,800',
      compareAtPrice: '₦3,200',
      category: 'Cooked Meals & Food',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      description: 'Authentic Omoku style Egusi soup prepared with assorted goat meat, dry fish, stockfish, and fresh bitterleaf. Served piping hot with smooth semovita.',
      unit: 'Portion / Plate',
      stock: 25,
      inStock: true,
      salesCount: 84,
    },
    {
      id: 'MP-02',
      name: 'Fisherman Fresh Fish Soup (Standard Pot)',
      price: '₦8,500',
      compareAtPrice: '₦9,500',
      category: 'Cooked Meals & Food',
      imageUrl: 'https://images.unsplash.com/photo-1534948216015-843149f72be3?auto=format&fit=crop&w=600&q=80',
      description: 'River Niger fresh native catfish, periwinkles, sea prawns, and aromatic local spices cooked to perfection.',
      unit: 'Standard 2L Pot',
      stock: 12,
      inStock: true,
      salesCount: 52,
    },
    {
      id: 'MP-03',
      name: 'Ofe Ogba Special with Assorted Meat',
      price: '₦4,500',
      category: 'Cooked Meals & Food',
      imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',
      description: 'Traditional native soup of the Ogba clan prepared with natural thickeners, smoked fish, and bush meat.',
      unit: 'Portion / Bowl',
      stock: 18,
      inStock: true,
      salesCount: 61,
    },
    {
      id: 'MP-04',
      name: 'Jollof Rice with Fried Chicken & Plantain',
      price: '₦3,000',
      category: 'Cooked Meals & Food',
      imageUrl: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=600&q=80',
      description: 'Party style smoky jollof rice served with seasoned crispy fried chicken and sweet dodo.',
      unit: 'Meal Pack',
      stock: 35,
      inStock: true,
      salesCount: 110,
    },
    {
      id: 'MP-05',
      name: 'Fresh Palm Wine (1.5L Keg)',
      price: '₦1,800',
      category: 'Palm Oil & Agro Mills',
      imageUrl: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=600&q=80',
      description: 'Sweet, undiluted morning palm wine tapped directly from Egi raffia palms.',
      unit: '1.5 Litre Keg',
      stock: 8,
      inStock: true,
      salesCount: 30,
    },
  ]);

  // Add Product Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [category, setCategory] = useState('Cooked Meals & Food');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('Portion');
  const [stock, setStock] = useState('20');

  const presetImages = [
    { label: 'Soup & Swallow', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
    { label: 'Rice Dish', url: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=600&q=80' },
    { label: 'Fresh Agro / Palm Oil', url: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=600&q=80' },
    { label: 'Fish & Poultry', url: 'https://images.unsplash.com/photo-1534948216015-843149f72be3?auto=format&fit=crop&w=600&q=80' },
  ];

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const newItem: VendorProduct = {
      id: `MP-0${products.length + 1}`,
      name,
      price: `₦${Number(price).toLocaleString()}`,
      compareAtPrice: comparePrice ? `₦${Number(comparePrice).toLocaleString()}` : undefined,
      category,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      description: description || 'Freshly prepared high-quality item from Mama Peace Kitchen in Omoku.',
      unit,
      stock: Number(stock) || 10,
      inStock: true,
      salesCount: 0,
    };

    setProducts([newItem, ...products]);
    setName('');
    setPrice('');
    setComparePrice('');
    setImageUrl('');
    setDescription('');
    setShowAddModal(false);
  };

  const toggleStock = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, inStock: !p.inStock } : p))
    );
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="My Products & Kitchen Menu"
        subtitle="Upload items with high-res photos, descriptions, and portion pricing for Omoku shoppers."
        liveStats={{ label: 'Active Menu Listings', value: `${products.length} Items` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Top Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search items, ingredients, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Item</span>
          </button>
        </div>

        {/* Upload Modal with Images & Descriptions */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Upload Product / Menu Item</h3>
                  <p className="text-xs text-slate-500">Provide photos, descriptions, and stock for your storefront</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Item / Food Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fisherman Soup & Pounded Yam"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    >
                      <option value="Cooked Meals & Food">Cooked Meals & Food</option>
                      <option value="Farm Groceries & Produce">Farm Groceries & Produce</option>
                      <option value="Palm Oil & Agro Mills">Palm Oil & Agro Mills</option>
                      <option value="Livestock & Fresh Fish">Livestock & Fresh Fish</option>
                      <option value="Electronics & Solar">Electronics & Solar</option>
                      <option value="Pharmacy & Health">Pharmacy & Health</option>
                      <option value="Fashion & Native Wears">Fashion & Native Wears</option>
                      <option value="Building & Hardware">Building & Hardware</option>
                    </select>
                  </div>

                  {/* Unit / Measurement */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Unit / Portion</label>
                    <input
                      type="text"
                      placeholder="e.g. Plate, 2L Bowl, 25L Keg"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Price (₦)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 3500"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-forest-850 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>

                  {/* Compare Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Discount / Slash Price (₦)</label>
                    <input
                      type="number"
                      placeholder="e.g. 4000 (Optional)"
                      value={comparePrice}
                      onChange={(e) => setComparePrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>

                  {/* Stock */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Stock / Available Quantity</label>
                    <input
                      type="number"
                      placeholder="e.g. 20"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>

                  {/* Image URL & Upload Selector */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Product Image URL / Photo</label>
                    <input
                      type="url"
                      placeholder="Paste image link https://..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />

                    <div className="text-[11px] font-bold text-slate-500 mt-1">Or Pick a Quick Preset Photo:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {presetImages.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setImageUrl(preset.url)}
                          className={`p-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                            imageUrl === preset.url
                              ? 'border-forest-800 bg-forest-50 text-forest-850'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <img src={preset.url} alt={preset.label} className="w-6 h-6 rounded-md object-cover" />
                          <span className="truncate">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Detailed Description & Ingredients</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe preparation style, ingredients, freshness, and delivery guidelines..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publish Item</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Product Details Modal (Click to View More Info & Images) */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="relative h-64 bg-slate-100">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-forest-850 text-white shadow-md">
                    {selectedProduct.category}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedProduct.name}</h3>
                  <div className="flex items-baseline gap-3 mt-1.5">
                    <span className="text-2xl font-black text-forest-850">{selectedProduct.price}</span>
                    {selectedProduct.compareAtPrice && (
                      <span className="text-sm text-slate-400 line-through">{selectedProduct.compareAtPrice}</span>
                    )}
                    <span className="text-xs text-slate-500 font-bold">• {selectedProduct.unit}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <strong className="block text-slate-900 font-bold mb-1">Item Description:</strong>
                  {selectedProduct.description}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-forest-50 rounded-xl border border-forest-100">
                    <span className="text-[10px] font-bold text-forest-800 uppercase">Current Inventory</span>
                    <div className="text-base font-black text-forest-900 mt-0.5">{selectedProduct.stock} In Stock</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-800 uppercase">Total Sales Count</span>
                    <div className="text-base font-black text-amber-900 mt-0.5">{selectedProduct.salesCount} Orders Delivered</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => toggleStock(selectedProduct.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold ${
                      selectedProduct.inStock ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {selectedProduct.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Table (Interactive Rows) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Product & Photo</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5">Stock</th>
                  <th className="px-5 py-3.5">Sales</th>
                  <th className="px-5 py-3.5">Availability</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                        />
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-forest-850 transition-colors">
                            {p.name}
                          </div>
                          <div className="text-xs text-slate-500">{p.unit} • {p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 font-semibold">{p.category}</td>
                    <td className="px-5 py-3.5 font-black text-slate-900">{p.price}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-700">{p.stock} units</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-forest-850">{p.salesCount} sold</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={(e) => toggleStock(p.id, e)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          p.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {p.inStock ? 'In Stock' : 'Out of Stock'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(p);
                          }}
                          title="View Details"
                          className="p-1.5 text-slate-400 hover:text-forest-850 hover:bg-forest-50 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
