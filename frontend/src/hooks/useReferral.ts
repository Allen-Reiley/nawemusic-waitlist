'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export const useReferral = () => {
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check if there is a 'ref' in the URL
    const refFromUrl = searchParams.get('ref');

    if (refFromUrl) {
      // 2. Persist it to localStorage so it survives navigation
      localStorage.setItem('nawe_referral_code', refFromUrl);
      setReferralCode(refFromUrl);
    } else {
      // 3. Fallback to existing code in storage if URL is empty
      const savedRef = localStorage.getItem('nawe_referral_code');
      if (savedRef) {
        setReferralCode(savedRef);
      }
    }
  }, [searchParams]);

  return referralCode;
};