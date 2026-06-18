"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Package, UploadCloud, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

const reportFoundSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  color: z.string().optional(),
  description: z.string().min(10, 'Please provide a detailed description'),
  foundLocation: z.string().min(1, 'Location is required'),
  dateFound: z.string().min(1, 'Date is required'),
  safeStorageInfo: z.string().optional(),
  contactPhoneNumber: z.string().min(11, 'Contact mobile number is required (min 11 digits)'),
  facebookProfile: z.string().optional(),
  recoveryInstructions: z.string().min(1, 'Recovery instruction is required'),
});

type ReportFoundValues = z.infer<typeof reportFoundSchema>;

export default function ReportFoundPage() {
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

  const { register, handleSubmit, formState: { errors } } = useForm<ReportFoundValues>({
    resolver: zodResolver(reportFoundSchema) as any,
  });

  const onSubmit = async (data: ReportFoundValues) => {
    try {
      setIsLoading(true);
      setError('');
      const payload = {
        ...data,
        dateFound: new Date(data.dateFound).toISOString(),
        imageUrl: base64Image
      };
      
      await api.post('/items/found', payload);
      router.push('/dashboard?reported=true');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to report found item');
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
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Report Found Item</h1>
            <p className="text-gray-400">Help someone reunite with their lost belongings. You're awesome!</p>
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
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="e.g. Blue Car Keys"
              />
              {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Category</label>
              <select
                {...register('category')}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
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
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="e.g. Honda"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Color (Optional)</label>
              <input
                {...register('color')}
                type="text"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="e.g. Silver/Blue"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Detailed Description</label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                placeholder="Describe what you found. NOTE: Do not include sensitive information like credit card numbers."
              ></textarea>
              {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Where did you find it?</label>
              <input
                {...register('foundLocation')}
                type="text"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="e.g. On a bench in Central Park"
              />
              {errors.foundLocation && <p className="mt-1 text-sm text-red-400">{errors.foundLocation.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Date & Time Found</label>
              <input
                {...register('dateFound')}
                type="datetime-local"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
              {errors.dateFound && <p className="mt-1 text-sm text-red-400">{errors.dateFound.message}</p>}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Upload Images (Highly recommended for AI matching)</label>
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Safe Storage Information</label>
              <input
                {...register('safeStorageInfo')}
                type="text"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="e.g. I gave it to the park security office."
              />
            </div>

            {/* Bangladesh Perspective Contact Details */}
            <div className="md:col-span-2 border-t border-white/5 pt-6 mt-2">
              <h3 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-4">Contact & Recovery Details (Bangladesh Perspective)</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Mobile Number (Required for call/bKash)</label>
              <input
                {...register('contactPhoneNumber')}
                type="text"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="e.g. 01712345678"
              />
              {errors.contactPhoneNumber && <p className="mt-1 text-sm text-red-400">{errors.contactPhoneNumber.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Facebook Profile Link / WhatsApp (Optional)</label>
              <input
                {...register('facebookProfile')}
                type="text"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="e.g. facebook.com/username"
              />
              {errors.facebookProfile && <p className="mt-1 text-sm text-red-400">{errors.facebookProfile.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">How/Where should the owner claim this item? (e.g. Meet at cafeteria, call for verification)</label>
              <textarea
                {...register('recoveryInstructions')}
                rows={3}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                placeholder="Provide instructions on where to meet or how they can verify and recover their item safely..."
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
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Report Found Item'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
