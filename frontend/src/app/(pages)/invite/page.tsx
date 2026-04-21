'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Copy, CheckCircle2, Loader2, Share2 } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <p className="mt-4 text-neutral-500 font-medium">Verifying your credentials...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Link Expired</h1>
        <p className="text-neutral-400 mb-8">
          This verification link is no longer valid or has already been used.
        </p>
        <button 
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-white text-black rounded-full font-semibold"
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
      className="max-w-2xl mx-auto py-12 px-6"
    >
      <div className="text-center mb-12">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">You&apos;re in the Seed.</h1>
        <p className="text-neutral-400 text-lg">
          Your account is verified. You are now eligible for the Founding Committee.
        </p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-8">
        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-6">
          Your Personal Invitation Link
        </h3>
        
        <div className="flex items-center gap-2 p-4 bg-black border border-neutral-800 rounded-xl mb-6">
          <code className="flex-1 text-sm text-neutral-300 truncate">
            {referralLink}
          </code>
          <button 
            onClick={copyToClipboard}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-neutral-400" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
            <p className="text-xs text-neutral-500 mb-1">Current Standing</p>
            <p className="text-xl font-bold text-white">#--</p>
          </div>
          <div className="p-4 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
            <p className="text-xs text-neutral-500 mb-1">Verified Referrals</p>
            <p className="text-xl font-bold text-white">0</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-neutral-500 text-sm mb-6 flex items-center justify-center gap-2">
          <Share2 className="w-4 h-4" /> Share this link to climb the leaderboard.
        </p>
      </div>
    </motion.div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <InviteContent />
      </main>
    </Suspense>
  );
}