import React, { useEffect } from 'react';
import { X, Calendar, Globe, FileText, ArrowRight, Users, Briefcase, Linkedin, Mail } from 'lucide-react';
import OutreachGenerator from './OutreachGenerator';

export default function DetailDrawer({ startup, isOpen, onClose, onOpenProfile, gmailToken, onConnectGmail }) {
  // Lock scroll on background when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen || !startup) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        {/* Sliding Panel */}
        <div className="w-screen max-w-lg glass-drawer shadow-2xl flex flex-col animate-in slide-in-from-right duration-350 ease-out">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-100 truncate pr-4">
              Startup Details
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Startup Identity */}
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-zinc-100 to-indigo-300">
                {startup.name}
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {startup.industry && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {startup.industry}
                  </span>
                )}
              {/* stage badge removed */}
              </div>
            </div>

            {/* Quick Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 flex items-center gap-1">
                  <Users className="w-3 h-3 text-zinc-500" />
                  Founders
                </span>
                <p className="text-xs text-zinc-300 font-medium truncate">
                  {startup.founders || 'Not specified'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-500" />
                  Added
                </span>
                <p className="text-xs text-zinc-300 font-medium">
                  {startup.added_at ? `Added on ${formatDate(startup.added_at)}` : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-zinc-500" />
                  Founded
                </span>
                <p className="text-xs text-zinc-300 font-medium">
                  {startup.year_founded || 'Not specified'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 flex items-center gap-1">
                  <Users className="w-3 h-3 text-zinc-500" />
                  Employees
                </span>
                <p className="text-xs text-zinc-300 font-medium">
                  {startup.employee_count || 'Not specified'}
                </p>
              </div>
              {startup.founder_email && (
                <div className="space-y-1 col-span-2 border-t border-zinc-800/60 pt-3 mt-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-zinc-500" />
                    Founder Email
                  </span>
                  <a 
                    href={`mailto:${startup.founder_email}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-medium block truncate"
                  >
                    {startup.founder_email}
                  </a>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-zinc-300">About</h4>
              <div className="text-sm text-zinc-400 leading-relaxed bg-zinc-900/10 p-4 rounded-xl border border-zinc-850 space-y-3">
                <p>{startup.description || 'No detailed description available.'}</p>
                {startup.article_url && (
                  <div className="text-xs border-t border-zinc-800/80 pt-3 flex items-center justify-between">
                    <span className="text-zinc-500">Information source:</span>
                    <a
                      href={startup.article_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center gap-1 font-medium text-xs"
                    >
                      Source Article <FileText className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Links Section */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-semibold text-zinc-300">Resources</h4>
              <div className="flex flex-col gap-2">
                {startup.website && (
                  <a
                    href={startup.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 hover:bg-indigo-600/5 border border-zinc-850 hover:border-indigo-500/20 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-zinc-500" />
                      <span>Official Website</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transform group-hover:translate-x-0.5 transition-transform" />
                  </a>
                )}
                {startup.linkedin_url && (
                  <a
                    href={startup.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 hover:bg-indigo-600/5 border border-zinc-850 hover:border-indigo-500/20 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-zinc-500" />
                      <span>LinkedIn Profile</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transform group-hover:translate-x-0.5 transition-transform" />
                  </a>
                )}
              </div>
            </div>

            {/* Outreach Generator Component */}
            <OutreachGenerator 
              startup={startup}
              onOpenProfile={onOpenProfile}
              gmailToken={gmailToken}
              onConnectGmail={onConnectGmail}
            />

          </div>
        </div>
      </div>
    </div>
  );
}
