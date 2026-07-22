import React, { useState } from 'react';
import { Compass, User, Layers, LogOut, CheckCircle, Sun, Moon } from 'lucide-react';

export default function Navbar({ 
  startupCount, 
  onOpenProfile, 
  activeTab, 
  setActiveTab,
  gmailUser,
  onConnectGmail,
  onDisconnectGmail,
  theme,
  onToggleTheme
}) {
  const [showDropdown, setShowDropdown] = useState(false);

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
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs text-gray-700 dark:text-zinc-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{startupCount} Startups Tracked</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-all duration-200 cursor-pointer flex items-center justify-center"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 border border-gray-200 dark:border-zinc-700'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-900/50 border border-transparent'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Feed</span>
          </button>
          
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-indigo-500 dark:text-indigo-400 hover:text-indigo-650 dark:hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 hover:border-indigo-500/30 transition-all duration-200 cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>My Profile</span>
          </button>

          {/* Gmail OAuth Section */}
          {gmailUser ? (
            <div className="relative flex items-center gap-2 ml-2">
              {/* Connected Badge */}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-550/10 border border-emerald-250 dark:border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold select-none">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gmail Connected</span>
              </div>

              {/* Profile Avatar / Dropdown Trigger */}
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 p-0.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 transition-all outline-none cursor-pointer"
                title={gmailUser.name || 'Google Profile'}
              >
                {gmailUser.picture ? (
                  <img 
                    src={gmailUser.picture} 
                    alt={gmailUser.name} 
                    className="w-8 h-8 rounded-xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {gmailUser.name ? gmailUser.name.charAt(0) : 'G'}
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl p-1.5 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-2.5 py-1.5 border-b border-gray-100 dark:border-zinc-850 text-left">
                      <p className="text-xs text-gray-800 dark:text-zinc-300 font-semibold truncate">{gmailUser.name}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate">{gmailUser.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        onDisconnectGmail();
                        setShowDropdown(false);
                      }}
                      className="w-full mt-1 flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Disconnect Gmail</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              id="connect-gmail-btn"
              onClick={onConnectGmail}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-emerald-600 dark:text-emerald-450 hover:text-emerald-700 dark:hover:text-emerald-305 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 transition-all duration-200 cursor-pointer"
            >
              <span>Connect Gmail</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
