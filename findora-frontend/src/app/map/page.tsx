"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Package, Calendar, AlertCircle, Loader2, Compass, Layers, Crosshair, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface GeolocatedItem {
  id: string;
  title: string;
  category: string;
  type: 'LOST' | 'FOUND';
  locationName: string;
  latitude: number;
  longitude: number;
  color?: string;
  date: string;
  description: string;
  status: string;
}

// Bounding box for mapping coordinates dynamically onto the 2D grid
// Centers around a generic metropolitan/campus boundary (Dhaka/Global)
const MAP_BOUNDS = {
  latMin: 23.70,
  latMax: 23.90,
  lonMin: 90.30,
  lonMax: 90.50
};

export default function LiveMapPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GeolocatedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GeolocatedItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');
  const [radarPing, setRadarPing] = useState({ x: 50, y: 50 });

  useEffect(() => {
    async function fetchMapData() {
      try {
        setLoading(true);
        const [lostRes, foundRes] = await Promise.all([
          api.get('/items/lost'),
          api.get('/items/found')
        ]);

        const lostList = (lostRes.data?.data || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          type: 'LOST' as const,
          locationName: item.lastSeenLocation || 'Unknown',
          latitude: item.latitude || 23.81, // Default fallback within bounds
          longitude: item.longitude || 90.41,
          color: item.color,
          date: item.dateLost,
          description: item.description,
          status: item.status
        }));

        const foundList = (foundRes.data?.data || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          type: 'FOUND' as const,
          locationName: item.foundLocation || 'Unknown',
          latitude: item.latitude || 23.79, // Default fallback
          longitude: item.longitude || 90.39,
          color: item.color,
          date: item.dateFound,
          description: item.description,
          status: item.status
        }));

        setItems([...lostList, ...foundList]);
      } catch (err) {
        console.error("Error fetching map items:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMapData();
  }, []);

  // Convert Latitude/Longitude coordinates to X/Y percentages on the map grid
  const getCoordinates = (lat: number, lon: number) => {
    const latRange = MAP_BOUNDS.latMax - MAP_BOUNDS.latMin;
    const lonRange = MAP_BOUNDS.lonMax - MAP_BOUNDS.lonMin;

    // Constrain within bounds safely
    const safeLat = Math.max(MAP_BOUNDS.latMin, Math.min(MAP_BOUNDS.latMax, lat));
    const safeLon = Math.max(MAP_BOUNDS.lonMin, Math.min(MAP_BOUNDS.lonMax, lon));

    const x = ((safeLon - MAP_BOUNDS.lonMin) / lonRange) * 100;
    // Y-axis on 2D coordinates goes down, so invert the latitude percentage
    const y = (1 - (safeLat - MAP_BOUNDS.latMin) / latRange) * 100;

    return { x, y };
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'ALL' || item.type === filterType;

    return matchesSearch && matchesType;
  });

  const handleSelectItem = (item: GeolocatedItem) => {
    setSelectedItem(item);
    const coords = getCoordinates(item.latitude, item.longitude);
    setRadarPing(coords);
  };

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2 text-primary font-bold text-sm tracking-widest uppercase">
            <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            Geospatial Intelligence
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Findora Live <span className="text-gradient">Tracking Map</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time visual tracking of lost (red) and found (green) items within coordinates.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center text-gray-400 gap-3 glass-card">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-semibold">Calibrating tracking system coordinates...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel: geolocated list */}
          <div className="space-y-4 flex flex-col h-[600px]">
            {/* Search and filter controls */}
            <div className="glass-card p-4 space-y-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search live trackers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:ring-1 focus:ring-primary text-sm transition-all"
                />
              </div>

              <div className="flex gap-2 text-xs">
                <button 
                  onClick={() => setFilterType('ALL')}
                  className={`flex-1 py-1.5 rounded-lg font-bold border transition-colors ${
                    filterType === 'ALL' 
                      ? 'bg-white/10 text-white border-white/20' 
                      : 'bg-transparent text-gray-500 border-transparent hover:text-white'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterType('LOST')}
                  className={`flex-1 py-1.5 rounded-lg font-bold border transition-colors ${
                    filterType === 'LOST' 
                      ? 'bg-primary/10 text-primary border-primary/20' 
                      : 'bg-transparent text-gray-500 border-transparent hover:text-white'
                  }`}
                >
                  Lost
                </button>
                <button 
                  onClick={() => setFilterType('FOUND')}
                  className={`flex-1 py-1.5 rounded-lg font-bold border transition-colors ${
                    filterType === 'FOUND' 
                      ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' 
                      : 'bg-transparent text-gray-500 border-transparent hover:text-white'
                  }`}
                >
                  Found
                </button>
              </div>
            </div>

            {/* List scrollbox */}
            <div className="glass-card flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>Active Trackers ({filteredItems.length})</span>
                <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Layer 1</span>
              </div>
              
              {filteredItems.length === 0 ? (
                <div className="text-center py-20 text-gray-500 text-sm">
                  No geolocated reports fit selection.
                </div>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3.5 transition-all ${
                      selectedItem?.id === item.id 
                        ? 'bg-white/10 border-white/20 shadow-lg' 
                        : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-black/30'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      item.type === 'LOST' 
                        ? 'bg-primary/10 text-primary border-primary/20' 
                        : 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                    }`}>
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white font-bold text-sm truncate">{item.title}</h4>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-gray-500 shrink-0" /> {item.locationName}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[9px] px-1.5 py-0.25 rounded font-extrabold border ${
                          item.type === 'LOST' 
                            ? 'bg-primary/10 text-primary border-primary/20' 
                            : 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                        }`}>
                          {item.type}
                        </span>
                        <span className="text-[9px] text-gray-500">
                          Lat: {item.latitude.toFixed(2)}, Lon: {item.longitude.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right panel: The Live Map Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card h-[600px] relative overflow-hidden flex flex-col justify-between p-0 border border-white/5">
              
              {/* Sonar sweep overlay */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.02)_0%,transparent_70%)] animate-pulse" />
              
              {/* Vector grid backdrop */}
              <div 
                className="absolute inset-0 bg-cover"
                style={{
                  backgroundImage: `radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)`,
                  backgroundSize: '24px 24px'
                }}
              />
              
              {/* Futuristic Crosshair scanning overlay */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-xs font-mono text-primary bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                <Crosshair className="w-3.5 h-3.5 text-primary animate-spin" style={{ animationDuration: '8s' }} />
                <span>SCAN STATUS: ACTIVE [COORD SYS: WGS-84]</span>
              </div>

              {/* Coordinates scale overlay */}
              <div className="absolute bottom-4 left-4 z-10 text-[10px] font-mono text-gray-500 flex flex-col gap-0.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-md">
                <span>LAT BOUNDS: {MAP_BOUNDS.latMin.toFixed(2)} - {MAP_BOUNDS.latMax.toFixed(2)}</span>
                <span>LON BOUNDS: {MAP_BOUNDS.lonMin.toFixed(2)} - {MAP_BOUNDS.lonMax.toFixed(2)}</span>
              </div>

              {/* MAP COORDINATES AREA */}
              <div className="relative w-full h-full">
                
                {/* Sonar radar sweep animation centred on selected item */}
                {selectedItem && (
                  <motion.div
                    key={selectedItem.id}
                    initial={{ scale: 0.1, opacity: 0.8 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      left: `${radarPing.x}%`,
                      top: `${radarPing.y}%`,
                      width: '60px',
                      height: '60px',
                      marginLeft: '-30px',
                      marginTop: '-30px',
                      borderRadius: '50%',
                      border: `2px solid ${selectedItem.type === 'LOST' ? 'rgba(var(--primary),0.4)' : 'rgba(74,222,128,0.4)'}`,
                      pointerEvents: 'none',
                      zIndex: 1
                    }}
                  />
                )}

                {/* Plot Pins */}
                {filteredItems.map((item) => {
                  const { x, y } = getCoordinates(item.latitude, item.longitude);
                  const isSelected = selectedItem?.id === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className="absolute group z-10"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {/* Pulse ring */}
                      <span className={`absolute inline-flex h-full w-full rounded-full animate-ping opacity-75 ${
                        item.type === 'LOST' ? 'bg-primary/30' : 'bg-emerald-400/30'
                      }`} style={{ width: isSelected ? '28px' : '16px', height: isSelected ? '28px' : '16px', left: isSelected ? '-6px' : '0px', top: isSelected ? '-6px' : '0px' }} />

                      {/* Pin Dot */}
                      <div className={`rounded-full transition-all duration-300 shadow-lg border flex items-center justify-center ${
                        isSelected 
                          ? `w-8 h-8 ${item.type === 'LOST' ? 'bg-primary border-white' : 'bg-emerald-400 border-white'} scale-110 shadow-white/10` 
                          : `w-4 h-4 ${item.type === 'LOST' ? 'bg-primary border-primary/20 hover:bg-primary/90' : 'bg-emerald-400 border-emerald-400/20 hover:bg-emerald-400/90'}`
                      }`}>
                        {isSelected && (
                          <MapPin className="w-4 h-4 text-white animate-bounce" />
                        )}
                      </div>

                      {/* Hover Tooltip name preview */}
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-30 shadow-xl backdrop-blur-md">
                        {item.title}
                      </span>
                    </button>
                  );
                })}

                {/* Center marker crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-12 h-12 border border-white/5 rounded-full flex items-center justify-center opacity-30">
                    <div className="w-2 h-2 bg-white/20 rounded-full" />
                  </div>
                </div>

                {/* Popover overlay for details of Selected Item */}
                <AnimatePresence>
                  {selectedItem && (
                    <motion.div
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 30, scale: 0.95 }}
                      className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-96 bg-black/80 border border-white/10 p-5 rounded-2xl z-20 backdrop-blur-md shadow-2xl flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold border ${
                            selectedItem.type === 'LOST' 
                              ? 'bg-primary/15 text-primary border-primary/20' 
                              : 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20'
                          }`}>
                            {selectedItem.type}
                          </span>
                          <h3 className="text-white font-extrabold text-lg mt-2">{selectedItem.title}</h3>
                        </div>
                        <button 
                          onClick={() => setSelectedItem(null)}
                          className="text-gray-400 hover:text-white transition-colors p-1"
                        >
                          ✕
                        </button>
                      </div>

                      <p className="text-gray-300 text-xs leading-relaxed line-clamp-2 italic">
                        "{selectedItem.description}"
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-3 mt-1">
                        <div>
                          <p className="text-gray-500 font-semibold">Location</p>
                          <p className="text-white font-bold flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-500" />
                            {selectedItem.locationName}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-semibold">Category</p>
                          <p className="text-white font-bold mt-0.5">{selectedItem.category}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 border-t border-white/5 pt-3">
                        <Link
                          href={selectedItem.type === 'LOST' ? '/report-found' : '/report-lost'}
                          className="w-full py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-primary/20"
                        >
                          {selectedItem.type === 'LOST' ? 'I Found This Item' : 'This Item is Mine'}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
              
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
