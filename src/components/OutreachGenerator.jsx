import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, AlertCircle, Edit, RefreshCw, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import SendEmailModal from './SendEmailModal';

export default function OutreachGenerator({ startup, onOpenProfile, gmailToken, onConnectGmail }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  // Gmail Send States
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Parser helper
  const parseOutreachMessage = (text) => {
    const lines = text.split('\n');
    let subject = `Outreach for ${startup.name}`;
    let bodyLines = [];
    let foundSubject = false;

    for (let line of lines) {
      if (!foundSubject && line.toLowerCase().startsWith('subject:')) {
        subject = line.substring(8).trim();
        foundSubject = true;
      } else {
        bodyLines.push(line);
      }
    }

    const body = bodyLines.join('\n').trim();
    return { subject, body };
  };

  // Base64url helper
  const makeEmailRaw = (to, subject, bodyText, resumeBase64, resumeFilename) => {
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

    if (resumeBase64 && resumeFilename) {
      // Build multipart/mixed email
      const boundary = `startup_compass_boundary_${Math.random().toString(36).substring(2)}`;
      
      const emailParts = [
        `To: ${to}`,
        `Subject: ${utf8Subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        bodyText,
        '',
        `--${boundary}`,
        `Content-Type: application/pdf; name="${resumeFilename}"`,
        `Content-Disposition: attachment; filename="${resumeFilename}"`,
        'Content-Transfer-Encoding: base64',
        '',
        resumeBase64,
        '',
        `--${boundary}--`
      ];

      const emailStr = emailParts.join('\r\n');
      return btoa(unescape(encodeURIComponent(emailStr)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    } else {
      // Build plain text email
      const emailParts = [
        `To: ${to}`,
        `Subject: ${utf8Subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        bodyText
      ];

      const emailStr = emailParts.join('\r\n');
      return btoa(unescape(encodeURIComponent(emailStr)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }
  };

  // Gmail API sending handler
  const handleSendEmail = async (recipientEmail) => {
    setSendingEmail(true);
    try {
      const parsed = parseOutreachMessage(message);

      // Check if resume exists in localStorage
      const resumeBase64 = localStorage.getItem('resume_base64') || null;
      const resumeFilename = localStorage.getItem('resume_filename') || null;

      const rawEmail = makeEmailRaw(recipientEmail, parsed.subject, parsed.body, resumeBase64, resumeFilename);

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gmailToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: rawEmail
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || `Gmail API returned status ${response.status}`);
      }

      toast.success('Email sent successfully!');
      setIsEmailModalOpen(false);
    } catch (err) {
      console.error('Failed to send email:', err);
      toast.error("Couldn't send the email. Please try again.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleGmailButtonClick = () => {
    if (!gmailToken) {
      toast.error('Connect Gmail first');
      const connectBtn = document.getElementById('connect-gmail-btn');
      if (connectBtn) {
        connectBtn.scrollIntoView({ behavior: 'smooth' });
        connectBtn.classList.add('ring-4', 'ring-emerald-500/50', 'scale-105', 'animate-pulse');
        setTimeout(() => {
          connectBtn.classList.remove('ring-4', 'ring-emerald-500/50', 'scale-105', 'animate-pulse');
        }, 3000);
      }
      return;
    }

    setIsEmailModalOpen(true);
  };

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
    return profile && profile.name && profile.college && profile.skills && profile.target_role;
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
      setMessage('Something went wrong. Please try again.');
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
- Target Role: ${parsedProfile.target_role}

Startup Profile:
- Startup Name: ${startup.name}
- Founders: ${startup.founders || 'the founders'}
- Industry: ${startup.industry || 'Tech'}
- Description: ${startup.description || 'a fast-growing startup'}

Outreach Rules:
1. Subject line: Write a highly catchy, short subject line (e.g. "React dev at ${parsedProfile.college} - interested in ${startup.name}").
2. Salutation: Address ${startup.founders ? startup.founders.split(',')[0].trim() : 'Founder'} by their first name.
3. Hook: Connect the user's background (${parsedProfile.college}, ${parsedProfile.target_role}) with ${startup.name}'s mission or industry (${startup.industry}). Highlight something brief about their description.
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
          model: 'openai/gpt-oss-20b',
          reasoning_format: 'hidden',
          reasoning_effort: 'none',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || `API error (${response.status})`);
      }

      const data = await response.json();
      const cleaned = data.choices[0].message.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      const text = cleaned;
      setMessage(text);
      toast.success('Outreach message generated successfully!');
    } catch (err) {
      console.error('Groq generation error:', err);
      setMessage('Something went wrong. Please try again.');
      toast.error('Something went wrong. Please try again.');
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
    <div className="mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-6">
      <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
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
            <span className="text-xs text-zinc-550 dark:text-zinc-500">
              Personalizing for <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{parsed.name}</strong> ({parsed.target_role})
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
            <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
              <div className="space-y-1">
                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">Generating draft using Llama 3.3...</span>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Analyzing startup details and matching skills...</p>
              </div>
            </div>
          )}

          {message && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-605 dark:text-zinc-400">Generated Email Draft</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200 transition-all cursor-pointer"
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
                <pre className="w-full bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-850 rounded-xl p-4 text-xs text-zinc-850 dark:text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto select-all">
                  {message}
                </pre>
              </div>

              {/* Send via Gmail Button */}
              <button
                onClick={handleGmailButtonClick}
                className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 border border-emerald-500/20 hover:border-emerald-500/35 transition-all cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send via Gmail</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recipient Email Address Input Modal */}
      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSend={handleSendEmail}
        sending={sendingEmail}
        startup={startup}
      />
    </div>
  );
}
