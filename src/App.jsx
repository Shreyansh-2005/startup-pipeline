import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import StartupCard from './components/StartupCard';
import DetailDrawer from './components/DetailDrawer';
import ProfileModal from './components/ProfileModal';
import { Toaster, toast } from 'sonner';
import { Search, Filter, RotateCcw, AlertTriangle, Briefcase, Plus, ExternalLink } from 'lucide-react';

function CardSkeleton() {
  return (
    <div className="glass-card p-5 rounded-2xl border border-zinc-800/40 animate-pulse-fast flex flex-col justify-between h-[210px]">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="h-6 w-32 bg-zinc-800 rounded-lg"></div>
          <div className="h-7 w-7 bg-zinc-800 rounded-lg"></div>
        </div>
        <div className="flex gap-2 mb-4">
          <div className="h-5 w-16 bg-zinc-850 rounded-full"></div>
          <div className="h-5 w-16 bg-zinc-850 rounded-full"></div>
        </div>
        <div className="h-4 w-40 bg-zinc-850 rounded mb-2"></div>
        <div className="h-4 w-full bg-zinc-850 rounded"></div>
      </div>
      <div className="h-4 w-24 bg-zinc-850 rounded"></div>
    </div>
  );
}

export default function App() {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI states
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed'

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedStage, setSelectedStage] = useState('');

  // Fetch startups
  const fetchStartups = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('startups')
        .select('*')
        .order('added_at', { ascending: false });

      if (error) throw error;
      setStartups(data || []);
    } catch (err) {
      console.error('Error fetching startups:', err);
      setError(err.message || 'Failed to fetch startups from Supabase.');
      toast.error('Failed to load startups database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartups();
  }, []);

  // Dynamically extract unique industries and stages for dropdown filters
  const { industries, stages } = useMemo(() => {
    const indSet = new Set();
    const stgSet = new Set();
    
    startups.forEach(s => {
      if (s.industry) indSet.add(s.industry.trim());
      if (s.stage) stgSet.add(s.stage.trim());
    });

    return {
      industries: Array.from(indSet).sort(),
      stages: Array.from(stgSet).sort()
    };
  }, [startups]);

  // Filter and search logic
  const filteredStartups = useMemo(() => {
    return startups.filter(s => {
      const matchesSearch = 
        !searchQuery || 
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.founders?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesIndustry = !selectedIndustry || s.industry === selectedIndustry;
      const matchesStage = !selectedStage || s.stage === selectedStage;

      return matchesSearch && matchesIndustry && matchesStage;
    });
  }, [startups, searchQuery, selectedIndustry, selectedStage]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedIndustry('');
    setSelectedStage('');
    toast.success('Filters cleared');
  };

  const isFilterActive = searchQuery || selectedIndustry || selectedStage;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Sonner toast provider */}
      <Toaster position="bottom-right" theme="dark" toastOptions={{
        style: {
          background: 'rgba(24, 24, 27, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#f4f4f5',
          backdropFilter: 'blur(8px)',
        }
      }} />

      {/* Navigation Header */}
      <Navbar 
        startupCount={loading ? null : startups.length} 
        onOpenProfile={() => setIsProfileOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Feed Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Page title section */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-indigo-100 to-indigo-300">
            Discover Early-Stage Indian Startups
          </h1>
          <p className="text-sm text-zinc-400">
            Monitor funding rounds, meet founders, and compose personalized outreach messages with Llama3 AI.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center">
          {/* Search box */}
          <div className="relative w-full md:flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, description, or founders..."
              className="w-full bg-zinc-900/50 border border-zinc-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-550 outline-none transition-all"
            />
          </div>

          {/* Industry Filter dropdown */}
          <div className="w-full md:w-48 relative">
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full appearance-none bg-zinc-900/50 border border-zinc-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 pr-8 text-sm text-zinc-300 outline-none cursor-pointer transition-all"
            >
              <option value="">All Industries</option>
              {industries.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
              <Filter className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Stage Filter dropdown */}
          <div className="w-full md:w-48 relative">
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full appearance-none bg-zinc-900/50 border border-zinc-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 pr-8 text-sm text-zinc-300 outline-none cursor-pointer transition-all"
            >
              <option value="">All Stages</option>
              {stages.map(stg => (
                <option key={stg} value={stg}>{stg}</option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
              <Filter className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Clear button */}
          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="w-full md:w-auto px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-850 rounded-xl border border-zinc-800 hover:border-zinc-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-center max-w-md mx-auto space-y-4 animate-in fade-in duration-300">
            <div className="inline-flex p-3 rounded-full bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-200">Database Connection Failed</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {error}
              </p>
            </div>
            <button
              onClick={fetchStartups}
              className="px-4 py-2 text-xs font-bold bg-rose-550 hover:bg-rose-500 active:bg-rose-650 text-white rounded-xl transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <CardSkeleton key={idx} />
            ))}
          </div>
        )}

        {/* Main Feed Content (Grid / Empty State) */}
        {!loading && !error && (
          <>
            {filteredStartups.length === 0 ? (
              // Empty State
              <div className="p-12 text-center max-w-sm mx-auto flex flex-col items-center gap-4 bg-zinc-900/10 border border-zinc-900 rounded-3xl animate-in fade-in duration-300">
                <div className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-500">
                  <Search className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-zinc-200">No Startups Found</h3>
                  <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                    No startups match your search queries or filter selections. Try clearing your search parameters.
                  </p>
                </div>
                {isFilterActive && (
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl shadow-lg border border-indigo-500/20 transition-all cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              // Startup Card Grid
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {filteredStartups.map(startup => (
                  <StartupCard 
                    key={startup.id} 
                    startup={startup} 
                    onClick={() => setSelectedStartup(startup)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-[10px] text-zinc-600 mt-auto">
        <span>&copy; {new Date().getFullYear()} Startup Compass. All rights reserved. Powered by Groq and Supabase.</span>
      </footer>

      {/* Detailed Right-Side Drawer */}
      <DetailDrawer 
        startup={selectedStartup}
        isOpen={!!selectedStartup}
        onClose={() => setSelectedStartup(null)}
        onOpenProfile={() => {
          setSelectedStartup(null);
          setIsProfileOpen(true);
        }}
      />

      {/* Profile Form Modal */}
      <ProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
