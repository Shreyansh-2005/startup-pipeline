import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, AlertCircle, Edit, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function OutreachGenerator({ startup, onOpenProfile }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Check if profile exists
  useEffect(() => {
    const saved = localStorage.getItem('startup_compass_profile');
    if (saved) {
      try {
        setUserProfile(JSON.parse(saved));
      } catch (e) {
        setUserProfile(null);
      }
    } else {
      setUserProfile(null);
    }
  }, [startup]); // Reload check on startup change

  const checkProfileCompleteness = (profile) => {
    return profile && profile.name && profile.college && profile.skills && profile.targetRole;
  };

  const handleGenerate = async () => {
    const profile = localStorage.getItem('startup_compass_profile');
    let parsedProfile = null;
    if (profile) {
      try {
        parsedProfile = JSON.parse(profile);
      } catch (e) {}
    }

    if (!checkProfileCompleteness(parsedProfile)) {
      toast.error('Please complete your profile before generating outreach!');
      onOpenProfile();
      return;
    }

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      toast.error('Groq API Key is missing. Please set VITE_GROQ_API_KEY in your env configuration.');
      setMessage('Error: VITE_GROQ_API_KEY is not defined. Please add VITE_GROQ_API_KEY to your `.env.local` file and restart the development server.');
      return;
    }

    setLoading(true);
    setMessage('');
    setCopied(false);

    try {
      const systemPrompt = `You are a professional outreach expert specializing in drafting high-conversion cold emails and LinkedIn pitches to startup founders. Your goal is to write a highly compelling, personalized, concise, and structured outreach message.`;
      
      const userPrompt = `
Draft a cold outreach email from a student to a startup founder.

User Profile:
- Name: ${parsedProfile.name}
- College: ${parsedProfile.college}
- Skills: ${parsedProfile.skills}
- Target Role: ${parsedProfile.targetRole}

Startup Profile:
- Startup Name: ${startup.name}
- Founders: ${startup.founders || 'the founders'}
- Industry: ${startup.industry || 'Tech'}
- Stage: ${startup.stage || 'Seed'}
- Description: ${startup.description || 'a fast-growing startup'}

Outreach Rules:
1. Subject line: Write a highly catchy, short subject line (e.g. "React dev at ${parsedProfile.college} - interested in ${startup.name}").
2. Salutation: Address ${startup.founders ? startup.founders.split(',')[0].trim() : 'Founder'} by their first name.
3. Hook: Connect the user's background (${parsedProfile.college}, ${parsedProfile.targetRole}) with ${startup.name}'s mission or industry (${startup.industry}). Highlight something brief about their description.
4. Value Proposition: Show how the user's skills (${parsedProfile.skills}) can directly add value to ${startup.name} (suggest a concrete, quick idea or project area relevant to ${startup.name}).
5. Call to Action (CTA): Propose a brief 10-15 minute chat. Do NOT ask for a job directly; ask to learn more or show how they can help.
6. Tone: Keep it professional yet enthusiastic, respectful, and ultra-short (less than 150 words). Avoid generic buzzwords.
7. Return ONLY the Subject Line and Email Body, no additional text or explanations.
`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || `API error (${response.status})`);
      }

      const data = await response.json();
      const text = data.choices[0].message.content.trim();
      setMessage(text);
      toast.success('Outreach message generated successfully!');
    } catch (err) {
      console.error('Groq generation error:', err);
      toast.error(`Generation failed: ${err.message}`);
      setMessage(`Failed to generate outreach: ${err.message}. Make sure your Groq API Key is valid.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!message) return;
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Re-read profile when we open drawer
  const saved = localStorage.getItem('startup_compass_profile');
  const parsed = saved ? JSON.parse(saved) : null;
  const isProfileComplete = checkProfileCompleteness(parsed);

  return (
    <div className="mt-8 border-t border-zinc-800 pt-6">
      <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        AI Outreach Generator
      </h4>

      {!isProfileComplete ? (
        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex flex-col items-center text-center gap-3">
          <AlertCircle className="w-8 h-8 text-indigo-400" />
          <div className="space-y-1">
            <h5 className="text-sm font-semibold text-zinc-200">Outreach Profile Incomplete</h5>
            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
              Complete your profile with name, college, skills, and target role to generate hyper-personalized drafts.
            </p>
          </div>
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white transition-all cursor-pointer border border-indigo-500/25"
          >
            <Edit className="w-3.5 h-3.5" />
            Set Up Profile
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Personalizing for <strong className="text-zinc-300 font-semibold">{parsed.name}</strong> ({parsed.targetRole})
            </span>
            <button
              onClick={onOpenProfile}
              className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit className="w-3 h-3" /> Edit Info
            </button>
          </div>

          {!message && !loading && (
            <button
              onClick={handleGenerate}
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 border border-indigo-500/20 hover:border-indigo-500/35 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Generate Personalized Outreach
            </button>
          )}

          {loading && (
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
              <div className="space-y-1">
                <span className="text-xs text-zinc-300 font-medium">Generating draft using Llama3...</span>
                <p className="text-[10px] text-zinc-500">Analyzing startup details and matching skills...</p>
              </div>
            </div>
          )}

          {message && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Generated Email Draft</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all cursor-pointer"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/25 hover:border-indigo-500/40 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Draft</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="w-full bg-zinc-900/80 border border-zinc-850 rounded-xl p-4 text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto select-all">
                  {message}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
