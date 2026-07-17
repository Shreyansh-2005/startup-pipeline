import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import StartupCard from './components/StartupCard';
import DetailDrawer from './components/DetailDrawer';
import ProfileModal from './components/ProfileModal';
import { Toaster, toast } from 'react-hot-toast';
import { Search, Filter, RotateCcw, AlertTriangle, Briefcase, Plus, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

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
        </div>
        <div className="h-4 w-40 bg-zinc-850 rounded mb-2"></div>
        <div className="h-4 w-full bg-zinc-850 rounded"></div>
      </div>
      <div className="h-4 w-24 bg-zinc-850 rounded"></div>
    </div>
  );
}

const getCompletenessScore = (startup) => {
  let score = 0;
  const fields = [
    'founders',
    'description',
    'website',
    'linkedin_url',
    'year_founded',
    'employee_count',
    'founder_email'
  ];
  fields.forEach(field => {
    const val = startup[field];
    if (val !== undefined && val !== null && val !== '') {
      score += 1;
    }
  });
  return score;
};

export default function App() {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI states
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed'

  // Gmail OAuth states
  const [gmailToken, setGmailToken] = useState(localStorage.getItem('gmail_access_token') || null);
  const [gmailUser, setGmailUser] = useState(() => {
    const savedProfile = localStorage.getItem('gmail_user_profile');
    if (savedProfile) {
      try {
        return JSON.parse(savedProfile);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Google Login Handler
  const loginGmail = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const accessToken = tokenResponse.access_token;
      localStorage.setItem('gmail_access_token', accessToken);
      setGmailToken(accessToken);
      toast.success('Gmail connected successfully!');

      // Fetch user details
      try {
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        localStorage.setItem('gmail_user_profile', JSON.stringify(userInfo.data));
        setGmailUser(userInfo.data);
      } catch (err) {
        console.error('Failed to fetch Google user info:', err);
      }
    },
    onError: (error) => {
      console.error('Google login failed:', error);
      toast.error('Failed to connect Gmail');
    },
    scope: 'https://www.googleapis.com/auth/gmail.send'
  });

  const handleDisconnectGmail = () => {
    localStorage.removeItem('gmail_access_token');
    localStorage.removeItem('gmail_user_profile');
    setGmailToken(null);
    setGmailUser(null);
    toast.success('Disconnected from Gmail');
  };

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 12;

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedIndustry]);

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

  // Dynamically extract unique industries for dropdown filter
  const industries = useMemo(() => {
    const indSet = new Set();
    
    startups.forEach(s => {
      if (s.industry) indSet.add(s.industry.trim());
    });

    return Array.from(indSet).sort();
  }, [startups]);

  // Filter, search, and sorting logic
  const filteredStartups = useMemo(() => {
    return startups
      .filter(s => {
        const matchesSearch = 
          !searchQuery || 
          s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.founders?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesIndustry = !selectedIndustry || s.industry === selectedIndustry;

        return matchesSearch && matchesIndustry;
      })
      .sort((a, b) => {
        const scoreA = getCompletenessScore(a);
        const scoreB = getCompletenessScore(b);
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        // Fallback to added_at desc
        const dateA = a.added_at ? new Date(a.added_at).getTime() : 0;
        const dateB = b.added_at ? new Date(b.added_at).getTime() : 0;
        return dateB - dateA;
      });
  }, [startups, searchQuery, selectedIndustry]);

  // Paginated startups logic
  const paginatedStartups = useMemo(() => {
    const startIndex = (currentPage - 1) * cardsPerPage;
    return filteredStartups.slice(startIndex, startIndex + cardsPerPage);
  }, [filteredStartups, currentPage, cardsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredStartups.length / cardsPerPage));

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedIndustry('');
    toast.success('Filters cleared');
  };

  const isFilterActive = searchQuery || selectedIndustry;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* react-hot-toast provider */}
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: 'rgba(24, 24, 27, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#f4f4f5',
          backdropFilter: 'blur(8px)',
          fontSize: '13px',
          borderRadius: '12px',
        }
      }} />

      {/* Navigation Header */}
      <Navbar 
        startupCount={loading ? null : startups.length} 
        onOpenProfile={() => setIsProfileOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gmailUser={gmailUser}
        onConnectGmail={loginGmail}
        onDisconnectGmail={handleDisconnectGmail}
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

          {/* Stage filter removed */}

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
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedStartups.map(startup => (
                    <StartupCard 
                      key={startup.id} 
                      startup={startup} 
                      onClick={() => setSelectedStartup(startup)}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-900">
                  <span className="text-xs text-zinc-400">
                    Showing <strong className="text-zinc-200 font-semibold">{filteredStartups.length === 0 ? 0 : (currentPage - 1) * cardsPerPage + 1}–{Math.min(filteredStartups.length, currentPage * cardsPerPage)}</strong> of <strong className="text-zinc-200 font-semibold">{filteredStartups.length}</strong> startups
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.max(1, prev - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:cursor-not-allowed text-zinc-300 hover:text-zinc-100 transition-all flex items-center justify-center cursor-pointer"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="text-xs font-medium text-zinc-300 px-3 py-1.5 rounded-lg bg-zinc-900/40 border border-zinc-850">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:cursor-not-allowed text-zinc-300 hover:text-zinc-100 transition-all flex items-center justify-center cursor-pointer"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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
        gmailToken={gmailToken}
        onConnectGmail={loginGmail}
      />

      {/* Profile Form Modal */}
      <ProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
