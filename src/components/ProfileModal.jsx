import React, { useState, useEffect } from 'react';
import { X, Save, GraduationCap, Code, Briefcase, User, FileText, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfileModal({ isOpen, onClose }) {
  const [profile, setProfile] = useState({
    name: '',
    college: '',
    skills: '',
    target_role: ''
  });

  const [resumeBase64, setResumeBase64] = useState('');
  const [resumeFilename, setResumeFilename] = useState('');

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

      // Load resume from localStorage
      const savedResumeBase64 = localStorage.getItem('resume_base64');
      const savedResumeFilename = localStorage.getItem('resume_filename');
      if (savedResumeBase64 && savedResumeFilename) {
        setResumeBase64(savedResumeBase64);
        setResumeFilename(savedResumeFilename);
      } else {
        setResumeBase64('');
        setResumeFilename('');
      }
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Resume must be smaller than 2MB');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result;
      // Extract the raw base64 data (strip prefix data:application/pdf;base64,)
      const rawBase64 = base64String.split(',')[1];
      setResumeBase64(rawBase64);
      setResumeFilename(file.name);
      toast.success('Resume uploaded successfully!');
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveResume = () => {
    setResumeBase64('');
    setResumeFilename('');
    toast.success('Resume removed');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if fields are empty
    if (!profile.name.trim() || !profile.college.trim() || !profile.skills.trim() || !profile.target_role.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    localStorage.setItem('startup_compass_profile', JSON.stringify(profile));

    // Save resume to localStorage
    if (resumeBase64 && resumeFilename) {
      localStorage.setItem('resume_base64', resumeBase64);
      localStorage.setItem('resume_filename', resumeFilename);
    } else {
      localStorage.removeItem('resume_base64');
      localStorage.removeItem('resume_filename');
    }

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
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all cursor-pointer"
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

          {/* Resume Upload (PDF) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between animate-in fade-in duration-300">
              <span>Upload Resume (PDF)</span>
              <span className="text-[10px] text-zinc-500 font-normal normal-case">Max 2MB</span>
            </label>
            {resumeFilename ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-sm animate-in fade-in duration-305">
                <div className="flex items-center gap-2 text-zinc-350 min-w-0">
                  <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="truncate text-xs text-zinc-300 font-medium">{resumeFilename}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveResume}
                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
                  title="Remove resume"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative flex items-center justify-center border border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-xl p-4 bg-zinc-900/10 hover:bg-zinc-900/20 transition-all group animate-in fade-in duration-305">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center space-y-1 select-none pointer-events-none">
                  <Upload className="w-5 h-5 text-zinc-500 group-hover:text-indigo-400 mx-auto transition-colors" />
                  <p className="text-xs text-zinc-400 font-medium">Click to upload PDF resume</p>
                  <p className="text-[10px] text-zinc-600 font-medium">PDF format only, up to 2MB</p>
                </div>
              </div>
            )}
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
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 border border-indigo-500/20 hover:border-indigo-500/35 transition-all cursor-pointer"
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
