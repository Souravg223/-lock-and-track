"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Search, MapPin, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  } as any;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  } as any;

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10" />
        
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/10 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-gray-300">Powered by advanced AI matching</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-white">
            Find what's lost.<br/>
            <span className="text-gradient">Return what's found.</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto font-light">
            Findora AI uses semantic search, image recognition, and global networking to reunite people with their belongings instantly.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/report-lost" className="group w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-[0_0_40px_rgba(var(--primary),0.4)]">
              Report Lost Item
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/report-found" className="w-full sm:w-auto px-8 py-4 glass border-white/10 text-white rounded-2xl font-semibold text-lg flex items-center justify-center hover:bg-white/5 transition-all">
              I Found Something
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How Findora Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Our state-of-the-art technology makes recovery seamless and secure.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="w-8 h-8 text-primary" />,
                title: "AI Semantic Match",
                desc: "Upload a photo or describe the item. Our AI instantly scans the database for high-probability matches.",
                link: "/lost"
              },
              {
                icon: <MapPin className="w-8 h-8 text-purple-500" />,
                title: "Live Heatmaps",
                desc: "View real-time hotspots of lost and found items in your city to narrow down search radius.",
                link: "/map"
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />,
                title: "Secure Escrow & Chat",
                desc: "Communicate securely and offer rewards safely via our escrow payment system.",
                link: "/dashboard"
              }
            ].map((feature, i) => (
              <Link href={feature.link} key={i} className="block group">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="glass-card flex flex-col items-start h-full border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all duration-300 cursor-pointer"
                >
                  <div className="p-3 bg-white/5 rounded-xl mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
