'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiUser, FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/actions/auth';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Show success message if redirected after registration
    if (searchParams.get('registered') === 'true') {
      setSuccess('Account created successfully! Please log in.');
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    try {
      // Client-side validation
      loginSchema.parse(formData);
      
      const result = await login(formData);
      
      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }
      
      // Redirect to dashboard on successful login
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err && Array.isArray(err.errors) && err.errors.length > 0 && 'message' in err.errors[0]) {
        setError(String(err.errors[0].message));
      } else {
        setError('An unexpected error occurred');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100">
      {/* Left panel with decorative content */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 flex-col justify-center items-center text-white p-12">
        <div className="max-w-md">
          <div className="mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-16 h-16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">Smart City Platform</h1>
          <p className="text-xl mb-6">Monitor and manage infrastructure with real-time analytics and insights.</p>
          <div className="space-y-4 text-lg">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Real-time monitoring</span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Data-driven insights</span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Smart infrastructure management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel with login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          <div>
            <h1 className="text-center text-3xl font-bold text-gray-900">
              Welcome Back
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to access your dashboard
            </p>
          </div>
          
          {error && (
            <div className="rounded-lg bg-red-50 p-4 border-l-4 border-red-500">
              <div className="flex items-center">
                <FiAlertCircle className="text-red-500 mr-2" />
                <div className="text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 p-4 border-l-4 border-green-500">
              <div className="flex items-center">
                <FiCheckCircle className="text-green-500 mr-2" />
                <div className="text-sm text-green-700">
                  {success}
                </div>
              </div>
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="pl-10 block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-black"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="pl-10 block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-black"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  onClick={() => console.log('Remember me clicked')}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-indigo-400"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </div>
            
            <div className="text-center text-sm">
              <p className="text-gray-600">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
