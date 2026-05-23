import React from 'react';
import { Compass, User, Layers } from 'lucide-react';

export default function Navbar({ startupCount, onOpenProfile, activeTab, setActiveTab }) {
  return (
    <nav className="glass-nav sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('feed')}>
        <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/35 text-indigo-400">
          <Compass className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-indigo-400 to-violet-400">
            Startup Compass
          </span>
          <span className="text-[10px] text-zinc-500 tracking-wider uppercase font-semibold">
            Indian Startup Directory
          </span>
        </div>
      </div>

      {/* Navigation and Stats */}
      <div className="flex items-center gap-6">
        {/* Startup Count Badge */}
        {startupCount !== null && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{startupCount} Startups Tracked</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'feed'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Feed</span>
          </button>
          
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 hover:border-indigo-500/30 transition-all duration-200"
          >
            <User className="w-4 h-4" />
            <span>My Profile</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
