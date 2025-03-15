'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.push('/login');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 mx-auto border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
        <h2 className="mt-4 text-lg font-medium text-gray-900">Redirecting...</h2>
      </div>
    </div>
  );
}
