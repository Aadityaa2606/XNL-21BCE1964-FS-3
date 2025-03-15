"use client";

import React from 'react';
import Link from 'next/link';
import { logout } from '@/lib/actions/auth';

export default function NavBar() {

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
          Smart City Platform
        </Link>
        
        <div className="flex items-center space-x-6">
          
        <Link 
            href="/dashboard" 
            className="text-gray-600 hover:text-indigo-600 transition-colors"
          >
            Dashboard
          </Link>

          <Link 
            href="/dashboard/contributions" 
            className="text-gray-600 hover:text-indigo-600 transition-colors"
          >
            My Contributions
          </Link>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
