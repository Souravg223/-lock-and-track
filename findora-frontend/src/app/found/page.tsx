"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Package, Calendar, AlertCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface FoundItem {
  id: string;
  title: string;
  category: string;
  brand?: string;
  color?: string;
  description: string;
  foundLocation: string;
  dateFound: string;
  safeStorageInfo?: string;
  status: string;
  createdAt: string;
  imageUrl?: string;
}

export default function PublicFoundItemsPage() {
  const [loading, setLoading] = useState(true);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    async function fetchFoundItems() {
      try {
        setLoading(true);
        const res = await api.get('/items/found');
        setFoundItems(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching found items:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFoundItems();
  }, []);

  const categories = [
    { value: 'ELECTRONICS', label: 'Electronics' },
    { value: 'WALLET', label: 'Wallets & Bags' },
    { value: 'JEWELRY', label: 'Jewelry & Watches' },
    { value: 'KEYS', label: 'Keys' },
    { value: 'PETS', label: 'Pets' },
    { value: 'OTHER', label: 'Other' },
  ];

  const filteredItems = foundItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.foundLocation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Button */}
      <div className="mb-6 flex justify-start">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 hover:border-white/10 text-sm font-semibold transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
          Public <span className="text-gradient">Found Items</span> Database
        </h1>
        <p className="text-gray-400 text-lg">
          Browse items found by the community. If you see something that belongs to you, log in to claim it securely!
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10 items-center justify-between glass-card py-4 px-6 border-white/5">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, description or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        <div className="w-full sm:w-auto flex gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          >
            <option value="" className="text-white">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value} className="text-black">
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm">Retrieving found items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-4">
            <AlertCircle className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Items Found</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Try adjusting your search criteria or explore a different category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card flex flex-col justify-between border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1 overflow-hidden !p-0"
            >
              {item.imageUrl && (
                <div className="w-full h-48 bg-black/40 border-b border-white/5 overflow-hidden">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="p-6 flex flex-col flex-grow justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold border bg-emerald-400/10 text-emerald-400 border-emerald-400/20">
                    {item.category}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border bg-white/5 text-gray-300 border-white/10">
                    {item.status}
                  </span>
                </div>

                <h3 className="text-white font-bold text-xl mb-2">{item.title}</h3>
                
                <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">
                  "{item.description}"
                </p>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    {item.foundLocation}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    {new Date(item.dateFound).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <Link
                  href="/report-lost"
                  className="w-full py-2.5 bg-emerald-400/10 hover:bg-emerald-400/15 text-emerald-400 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 border border-emerald-400/20 transition-all mt-2"
                >
                  This Item is Mine
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
        </div>
      )}
    </div>
  );
}
