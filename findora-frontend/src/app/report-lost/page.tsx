"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Search, UploadCloud, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

const reportLostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  color: z.string().optional(),
  description: z.string().min(10, 'Please provide a detailed description'),
  lastSeenLocation: z.string().min(1, 'Location is required'),
  dateLost: z.string().min(1, 'Date is required'),
  rewardAmount: z.coerce.number().min(0).optional(),
  contactPhoneNumber: z.string().min(11, 'Contact mobile number is required (min 11 digits)'),
  facebookProfile: z.string().optional(),
  recoveryInstructions: z.string().min(1, 'Retrieval instruction is required'),
});

type ReportLostValues = z.infer<typeof reportLostSchema>;

export default function ReportLostPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const { register, handleSubmit, formState: { errors } } = useForm<ReportLostValues>({
    resolver: zodResolver(reportLostSchema) as any,
  });

  const onSubmit = async (data: ReportLostValues) => {
    try {
      setIsLoading(true);
      setError('');
      // Convert date string to ISO Date string
      const payload = {
        ...data,
        dateLost: new Date(data.dateLost).toISOString(),
        imageUrl: base64Image
      };
      
      await api.post('/items/lost', payload);
      router.push('/dashboard?reported=true');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to report lost item');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Back Button */}
      <div className="mb-6 flex justify-start">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 hover:border-white/10 text-sm font-semibold transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
      >
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Report Lost Item</h1>
            <p className="text-gray-400">Our AI will start matching your item across the network immediately.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Item Title</label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="e.g. Black MacBook Pro 14 inch"
              />
              {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Category</label>
              <select
                {...register('category')}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none transition-all"
              >
                <option value="" className="text-black">Select a category...</option>
                <option value="ELECTRONICS" className="text-black">Electronics & Gadgets</option>
                <option value="WALLET" className="text-black">Wallets & Bags</option>
                <option value="JEWELRY" className="text-black">Jewelry & Watches</option>
                <option value="KEYS" className="text-black">Keys</option>
                <option value="PETS" className="text-black">Pets</option>
                <option value="OTHER" className="text-black">Other</option>
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-400">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Brand (Optional)</label>
              <input
                {...register('brand')}
                type="text"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="e.g. Apple"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Color (Optional)</label>
              <input
                {...register('color')}
                type="text"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="e.g. Space Gray"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Detailed Description</label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                placeholder="Describe any unique markings, stickers, dents, or contents..."
              ></textarea>
              {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Last Seen Location</label>
              <input
                {...register('lastSeenLocation')}
                type="text"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="e.g. Starbucks on 5th Ave"
              />
              {errors.lastSeenLocation && <p className="mt-1 text-sm text-red-400">{errors.lastSeenLocation.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Date Lost</label>
              <input
                {...register('dateLost')}
                type="datetime-local"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none transition-all"
              />
              {errors.dateLost && <p className="mt-1 text-sm text-red-400">{errors.dateLost.message}</p>}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Upload Images (AI matching works best with images)</label>
              <div 
                onClick={() => document.getElementById('image-upload-input')?.click()}
                className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer flex flex-col items-center justify-center relative min-h-[180px] overflow-hidden"
              >
                <input 
                  id="image-upload-input"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
                {base64Image ? (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/60 group">
                    <img src={base64Image} alt="Preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                      Click to Change Image
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-gray-300 font-medium">Click to upload image</p>
                    <p className="text-sm text-gray-500 mt-1">SVG, PNG, JPG or GIF (MAX. 5MB)</p>
                  </>
                )}
              </div>
            </div>

            {/* Bangladesh Perspective Contact Details */}
            <div className="md:col-span-2 border-t border-white/5 pt-6 mt-2">
              <h3 className="text-lg font-bold text-gradient mb-4">Contact & Recovery Details (Bangladesh Perspective)</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Mobile Number (Required for call/bKash)</label>
              <input
                {...register('contactPhoneNumber')}
                type="text"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="e.g. 01712345678"
              />
              {errors.contactPhoneNumber && <p className="mt-1 text-sm text-red-400">{errors.contactPhoneNumber.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Facebook Profile Link / WhatsApp (Optional)</label>
              <input
                {...register('facebookProfile')}
                type="text"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="e.g. facebook.com/username"
              />
              {errors.facebookProfile && <p className="mt-1 text-sm text-red-400">{errors.facebookProfile.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">How will you verify and retrieve this item? (e.g. Prove serial number/contents, security office pickup)</label>
              <textarea
                {...register('recoveryInstructions')}
                rows={3}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                placeholder="Describe how the owner will prove it's theirs and what verification you need before handing it over..."
              ></textarea>
              {errors.recoveryInstructions && <p className="mt-1 text-sm text-red-400">{errors.recoveryInstructions.message}</p>}
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl font-medium text-white hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Report Lost Item'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
