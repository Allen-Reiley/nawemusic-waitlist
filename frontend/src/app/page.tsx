'use client';
import { useState } from 'react';
import Hero from '@/components/ui/animated-shader-hero';
import { motion, AnimatePresence } from 'framer-motion';
import { useReferral } from '@/hooks/useReferral';
import api from '@/lib/api';

export default function Page() {
  const [step, setStep] = useState(0); 
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Captures ?ref= from URL or LocalStorage automatically
  const referralCode = useReferral();

  const handleJoinWaitlist = async () => {
    setError(null);
    setIsLoading(true);
    
    // Basic sanitization
    const cleanName = formData.name.replace(/<[^>]*>?/gm, '').trim();
    const cleanEmail = formData.email.replace(/<[^>]*>?/gm, '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (cleanName.length < 2) {
      setError("Please enter your full name.");
      setIsLoading(false);
      return;
    }
  
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }
  
    try {
      // Logic: POST body contains the user info, params contains the referral link
      await api.post('/join', 
        { 
          full_name: cleanName, 
          email: cleanEmail 
        }, 
        { 
          params: { ref: referralCode || undefined } 
        }
      );

      // Transition to onboarding slides upon success
      setFormData({ name: cleanName, email: cleanEmail });
      setStep(1);
    } catch (err: any) {
      // Handle specific FastAPI HTTPException details
      const msg = err.response?.data?.detail || "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-black">
      <Hero 
        headline={{
          line1: "Own Your Fanbase",
          line2: "Join The Waitlist"
        }}
        subtitle="Stop renting your audience from social media—start owning it. Your music. Your audience. Your way."
        className={step > 0 ? "blur-md scale-95 transition-all duration-700" : "transition-all duration-700"}
      />

      {/* Hero Input Section */}
      {step === 0 && (
        <div className="relative z-30 flex flex-col items-center p-6 pb-12 md:pb-20 mt-[-14rem] min-[444px]:mt-[-13rem] sm:mt-[-12rem] md:mt-[-10rem] lg:mt-[-12rem]">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-md md:max-w-2xl bg-black/40 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center gap-6 md:gap-8"
          >
            <input 
              placeholder="Full Name" 
              type="text"
              maxLength={50}
              disabled={isLoading}
              autoComplete="name"
              className="w-full md:flex-1 bg-transparent border-b border-white/30 p-2 outline-none text-white focus:border-orange-500 transition-colors disabled:opacity-50"
              onChange={(e) => {
                setError(null);
                setFormData({...formData, name: e.target.value});
              }}
            />
            <input 
              placeholder="Email Address" 
              type="email" 
              required
              disabled={isLoading}
              autoComplete="email"
              className="w-full md:flex-1 bg-transparent border-b border-white/30 p-2 outline-none text-white focus:border-orange-500 transition-colors disabled:opacity-50"
              onChange={(e) => {
                setError(null);
                setFormData({...formData, email: e.target.value});
              }}
            />
            <button 
              onClick={handleJoinWaitlist}
              disabled={!formData.name || !formData.email || isLoading}
              className="w-full md:w-auto whitespace-nowrap bg-orange-500 px-8 py-3 rounded-full font-bold text-black hover:bg-orange-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px]"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                "Secure My Spot"
              )}
            </button>
          </motion.div>

          <div className="h-6 mt-4"> 
            <AnimatePresence mode="wait">
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-orange-400/90 text-sm font-medium tracking-wide"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Multi-Step Onboarding Modal */}
      <AnimatePresence mode="wait">
        {step > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          >
            <motion.div 
              layout
              className="relative bg-[#0a0a0a] border border-white/10 p-8 md:p-12 rounded-[2rem] max-w-xl w-full text-white shadow-2xl overflow-hidden"
            >
              {/* Progress Indicator */}
              <div className="absolute top-8 right-8 flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${step >= i ? 'bg-orange-500 w-4' : 'bg-white/20'}`} 
                  />
                ))}
              </div>

              <div className="min-h-[280px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div key="s1" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }}>
                      <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-amber-200 bg-clip-text text-transparent">The Philosophy</h3>
                      <p className="text-white/70 text-lg leading-relaxed">
                        NaweMusic is the bridge between your craft and your community. We’re moving music off the social media feed and onto your own terms. Sell tickets, host events, and talk to your fans directly on a platform you actually control.
                      </p>
                    </motion.div>
                  )}
                  {step === 2 && (
                    <motion.div key="s2" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }}>
                      <h3 className="text-3xl font-bold mb-4 text-orange-400">Join the Revolution</h3>
                      <p className="text-white/70 text-lg leading-relaxed">
                        We are building a network of premium artists. Spread the word and earn a 30% one-time commission for every verified artist you bring in. Inviting others isn’t just sharing a link—it’s signaling a change in the industry.
                      </p>
                    </motion.div>
                  )}
                  {step === 3 && (
                    <motion.div key="s3" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }}>
                      <h3 className="text-3xl font-bold mb-4 text-orange-400">Founding Committee</h3>
                      <p className="text-white/60 mb-6 font-medium">The top 10 referrers gain shareholder-level influence:</p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <li className="flex items-center gap-2"><span className="h-2 w-2 bg-orange-500 rounded-full"/> Lifetime Free Access</li>
                        <li className="flex items-center gap-2"><span className="h-2 w-2 bg-orange-500 rounded-full"/> Performance Ownership</li>
                        <li className="flex items-center gap-2"><span className="h-2 w-2 bg-orange-500 rounded-full"/> Feature Voting Power</li>
                        <li className="flex items-center gap-2"><span className="h-2 w-2 bg-orange-500 rounded-full"/> Recurring Content Sponsoring</li>
                      </ul>
                    </motion.div>
                  )}
                  {step === 4 && (
                    <motion.div key="s4" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }}>
                      <h3 className="text-3xl font-bold mb-4 text-orange-400">Final Verification</h3>
                      <div className="space-y-4">
                        <p className="text-white/70 text-lg leading-relaxed">
                          We’ve sent a secure link to <span className="text-orange-400 font-semibold">{formData.email}</span>. 
                        </p>
                        
                        <p className="text-white/60 text-sm leading-relaxed">
                          The email includes our Terms & Conditions—please read them carefully as they outline your rights and the affiliate commission structure. 
                        </p>

                        <div className="bg-white/5 border-l-2 border-orange-500 p-4 rounded-r-xl">
                          <p className="text-sm text-white/80">
                            <span className="text-orange-400 font-bold">Note:</span> At launch, NaweMusic will be <b>R500/year</b>. 
                            Top referrers on the Committee will bypass this fee and gain early access to the roadmap.
                          </p>
                        </div>

                        <p className="text-white/40 text-[10px] italic pt-2">
                          Verify your email now to activate your account and secure your affiliate link.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-col md:flex-row-reverse gap-3 mt-10">
                <button 
                  onClick={() => step < 4 ? setStep(s => s + 1) : setStep(0)}
                  className="w-full md:flex-1 bg-orange-500 text-black py-4 rounded-xl font-bold text-lg hover:bg-orange-400 transition-all active:scale-95"
                >
                  {step === 4 ? "Done" : "Continue"}
                </button>
                {step < 4 && (
                   <button 
                    onClick={() => setStep(s => s - 1)} 
                    className="w-full md:w-auto px-8 text-white/40 py-4 text-sm font-medium hover:text-white transition-colors border border-white/5 md:border-transparent rounded-xl"
                  >
                    Go Back
                  </button>
                )}
              </div>

              <div className="flex flex-col items-center mt-8 pt-6 border-t border-white/5 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/20">A Project by</p>
                <p className="text-sm font-bold text-white/40 mt-1 uppercase tracking-wider">AuraWorks (Pty) Ltd</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}