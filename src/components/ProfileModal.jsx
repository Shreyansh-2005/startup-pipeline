import React, { useState, useEffect } from 'react';
import { X, Save, GraduationCap, Code, Briefcase, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfileModal({ isOpen, onClose }) {
  const [profile, setProfile] = useState({
    name: '',
    college: '',
    skills: '',
    target_role: ''
  });

  useEffect(() => {
    if (isOpen) {
      const savedProfile = localStorage.getItem('startup_compass_profile');
      if (savedProfile) {
        try {
          setProfile(JSON.parse(savedProfile));
        } catch (e) {
          console.error('Error parsing profile from localStorage', e);
        }
      }
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if fields are empty
    if (!profile.name.trim() || !profile.college.trim() || !profile.skills.trim() || !profile.target_role.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    localStorage.setItem('startup_compass_profile', JSON.stringify(profile));
    toast.success('Profile saved successfully!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="glass-modal relative w-full max-w-md overflow-hidden rounded-2xl bg-zinc-950 p-6 shadow-2xl border border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            My Outreach Profile
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            This information is used to draft highly personalized cold emails to founders.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="e.g. Rahul Kumar"
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* College */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              College / University
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <GraduationCap className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={profile.college}
                onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                placeholder="e.g. IIT Kharagpur"
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Target Role */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Target Role
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Briefcase className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={profile.target_role}
                onChange={(e) => setProfile({ ...profile, target_role: e.target.value })}
                placeholder="e.g. Software Engineer Intern"
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Skills</span>
              <span className="text-[10px] text-zinc-500 font-normal normal-case">Comma-separated</span>
            </label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-zinc-500">
                <Code className="w-4 h-4" />
              </span>
              <textarea
                value={profile.skills}
                onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                placeholder="e.g. React, Node.js, Python, TailwindCSS"
                rows="3"
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 outline-none resize-none transition-all"
                required
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 py-2 rounded-xl text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 border border-indigo-500/20 hover:border-indigo-500/35 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
