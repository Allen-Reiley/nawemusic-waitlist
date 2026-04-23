'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Copy, CheckCircle2, Loader2, Share2, AlertCircle } from 'lucide-react';
import { verifyEmailToken } from '@/lib/api';

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [userData, setUserData] = useState<{ referral_code: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/');
      return;
    }

    const verify = async () => {
      try {
        const data = await verifyEmailToken(token);
        setUserData(data);
        setStatus('success');
      } catch (err) {
        console.error("Verification failed", err);
        setStatus('error');
      }
    };

    verify();
  }, [token, router]);

  const referralLink = userData 
    ? `${window.location.origin}?ref=${userData.referral_code}` 
    : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
        <p className="text-neutral-400 font-medium tracking-tight">Verifying your credentials...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-sm mx-auto text-center py-20 px-6">
        <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Link Expired</h1>
        <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
          This verification link is no longer valid or has already been used. Please try signing up again.
        </p>
        <button 
          onClick={() => router.push('/')}
          className="w-full py-3 bg-white text-black rounded-xl font-bold transition-transform active:scale-95"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto py-8 md:py-12 px-6"
    >
      <div className="text-center mb-8 md:mb-12">
        <div className="relative inline-block mb-6">
            <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-orange-500 mx-auto" />
            <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"
            />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4 tracking-tight">
            You&apos;re in the Seed.
        </h1>
        <p className="text-neutral-400 text-sm md:text-lg leading-relaxed max-w-md mx-auto">
          Your account is verified. You are now eligible for the <span className="text-white">Founding Committee</span>.
        </p>
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-[2rem] p-6 md:p-8 mb-8">
        <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4 md:mb-6">
          Your Personal Invitation Link
        </h3>
        
        <div className="flex items-center gap-3 p-3 md:p-4 bg-black/50 border border-white/10 rounded-xl mb-6 overflow-hidden">
          <code className="flex-1 text-xs md:text-sm text-neutral-300 truncate font-mono">
            {referralLink}
          </code>
          <button 
            onClick={copyToClipboard}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all active:scale-90 flex-shrink-0"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-orange-500" /> : <Copy className="w-4 h-4 md:w-5 md:h-5 text-neutral-400" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Standing</p>
            <p className="text-lg md:text-xl font-bold text-white">#--</p>
          </div>
          <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Verified</p>
            <p className="text-lg md:text-xl font-bold text-white">0</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-neutral-500 text-xs md:text-sm mb-6 flex items-center justify-center gap-2">
          <Share2 className="w-3.5 h-3.5" /> Share this link to climb the leaderboard.
        </p>
      </div>
    </motion.div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <main className="min-h-screen bg-black text-white flex items-start md:items-center justify-center pt-12 md:pt-0">
        <InviteContent />
      </main>
    </Suspense>
  );
}