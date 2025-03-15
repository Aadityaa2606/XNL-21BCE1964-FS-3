"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/lib/actions/auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const { isAuthenticated: authStatus } = await checkAuth();
        
        setIsAuthenticated(authStatus);
        
        if (!authStatus) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Authentication verification failed:', error);
        setIsAuthenticated(false);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Render children only if authenticated
  return isAuthenticated ? <>{children}</> : null;
}
