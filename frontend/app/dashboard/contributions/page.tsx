"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getUserContributions, 
  getAllContributions, 
  Contribution, 
} from '@/lib/actions/contributions';

export default function ContributionsPage() {
  const router = useRouter();
  const [userContributions, setUserContributions] = useState<Contribution[]>([]);
  const [allContributions, setAllContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch user's contributions
        const userResponse = await getUserContributions();
        setUserContributions(userResponse.sensors);
        
        // Fetch all contributions
        const allResponse = await getAllContributions(limit, offset);
        setAllContributions(allResponse.results);
        setTotalCount(allResponse.count);
        setNextPageUrl(allResponse.next);
        setPrevPageUrl(allResponse.previous);
      } catch (err: unknown) {
        // Check if it's an authentication error
        if (typeof err === 'object' && err && 'message' in err && typeof err.message === 'string' && err.message.includes('401')) {
          setError('Your session has expired. Please log in again.');
          // Redirect to login page after a short delay
          setTimeout(() => router.push('/login'), 2000);
        } else {
          setError('Failed to fetch contributions data. Please try again later.');
          console.error(err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [offset, router]);

  const nextPage = () => {
    if (nextPageUrl) {
      setOffset(offset + limit);
    }
  };

  const prevPage = () => {
    if (prevPageUrl) {
      setOffset(Math.max(0, offset - limit));
    }
  };

  // Format date function
  const formatContributionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          <p className="mt-4 text-blue-600 font-medium">Loading contributions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md mx-auto max-w-4xl mt-8 shadow-md">
        <h2 className="font-bold text-xl mb-2">Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-gray-800 border-b pb-4 border-blue-100">My Contributions</h1>
      
      {/* User Contributions */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-5 text-blue-700 flex items-center">
          <span className="bg-blue-100 p-2 rounded-full mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </span>
          Your Contributions
        </h2>
        
        {userContributions.length === 0 ? (
          <div className="bg-white p-8 rounded-lg text-center shadow-md border border-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m0 16v1m-9-9h1m16 0h1m-1.607-7.243l.707.707M5.243 5.471l.707.707m12.728 12.728l-.707-.707M6.342 18.485l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-gray-600 text-lg">You haven&apos;t made any contributions yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Service
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Sensor ID
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {userContributions.map((contribution) => (
                  <tr key={contribution.contribution_id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-800">
                      #{contribution.contribution_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                      {contribution.service.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {contribution.service_sensor_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatContributionDate(contribution.contributed_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* All Contributions */}
      <div>
        <h2 className="text-2xl font-semibold mb-5 text-blue-700 flex items-center">
          <span className="bg-blue-100 p-2 rounded-full mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </span>
          All Contributions
        </h2>
        <div className="overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                  User ID
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                  Service
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                  Sensor ID
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {allContributions.map((contribution) => (
                <tr key={contribution.contribution_id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-800">
                    #{contribution.contribution_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {contribution.user_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                    {contribution.service.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                    {contribution.service_sensor_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatContributionDate(contribution.contributed_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium text-blue-600">{offset + 1}</span> to{" "}
            <span className="font-medium text-blue-600">{Math.min(offset + limit, totalCount)}</span> of{" "}
            <span className="font-medium text-blue-600">{totalCount}</span> results
          </div>
          <div className="flex space-x-3">
            <button
              onClick={prevPage}
              disabled={!prevPageUrl}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                prevPageUrl
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Previous
              </span>
            </button>
            <button
              onClick={nextPage}
              disabled={!nextPageUrl}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                nextPageUrl
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="flex items-center">
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
