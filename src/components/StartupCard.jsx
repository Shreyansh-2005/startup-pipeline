import React from 'react';
import { ExternalLink, Users, ArrowUpRight, Linkedin } from 'lucide-react';

export default function StartupCard({ startup, onClick }) {
  const { 
    name, 
    industry, 
    founders, 
    description, 
    website, 
    year_founded, 
    employee_count, 
    linkedin_url 
  } = startup;

  // Formatting helpers
  const cleanUrl = (url) => {
    if (!url) return '';
    return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  };

  const isValidValue = (val) => {
    return val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim().toLowerCase() !== 'null';
  };

  const showFounded = isValidValue(year_founded);
  const showEmployees = isValidValue(employee_count);
  const hasMeta = showFounded || showEmployees;

  return (
    <div 
      onClick={onClick}
      className="glass-card flex flex-col justify-between p-5 rounded-2xl cursor-pointer group relative overflow-hidden"
    >
      {/* Glow effect in background */}
      <div className="absolute -right-12 -top-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-300" />

      <div>
        {/* Card Header: Name + Open Detail indicator */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors duration-200">
            {name}
          </h3>
          <span className="p-1 rounded-lg bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300">
            <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>

        {/* Badges: Industry */}
        <div className="flex flex-wrap gap-2 mb-4">
          {industry && (
            <span 
              className="inline-block max-w-[120px] truncate align-bottom px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-indigo-100 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20"
              title={industry}
            >
              {industry}
            </span>
          )}
        </div>

        {/* Founders (muted text) */}
        {founders && (
          <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500 dark:text-zinc-400">
            <Users className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-500 flex-shrink-0" />
            <span className="truncate">
              <span className="text-gray-700 dark:text-zinc-300 font-semibold">Founders:</span> {founders}
            </span>
          </div>
        )}

        {/* Short Description (truncated to 2 lines) */}
        <p className="text-sm text-gray-700 dark:text-zinc-400 leading-relaxed mb-4 line-clamp-2">
          {description || "No description provided."}
        </p>

        {/* Founded & Employees Info Row */}
        {hasMeta && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs border-t border-gray-200 dark:border-zinc-900/60 pt-3 mb-4 text-gray-500 dark:text-zinc-500">
            {showFounded && (
              <div>
                <span>Founded:</span> <span className="text-gray-700 dark:text-zinc-300 font-medium">{year_founded}</span>
              </div>
            )}
            {showEmployees && (
              <div>
                <span>Employees:</span> <span className="text-gray-700 dark:text-zinc-300 font-medium">{employee_count}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Website & LinkedIn */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200 dark:border-zinc-900/60">
        {website ? (
          <a 
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline w-fit"
          >
            <span>{cleanUrl(website)}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs text-gray-400 dark:text-zinc-600">No website URL</span>
        )}

        {linkedin_url && (
          <a 
            href={linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-200 dark:border-zinc-800 hover:border-indigo-500/20 transition-all duration-200"
            title="LinkedIn Profile"
          >
            <Linkedin className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
