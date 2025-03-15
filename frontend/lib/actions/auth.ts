"use server";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginSchema, signupSchema } from '../validations/auth';
import * as z from 'zod';

export async function getAuthToken(tokenName: 'access_token' | 'refresh_token' | 'user') {
  const cookieStore = await cookies();
  const token = cookieStore.get(tokenName);
  return token?.value || null;
}

async function setAuthToken(
  tokenName: 'access_token' | 'refresh_token' | 'user',
  value: string,
  maxAge: number
) {
  const cookieStore = await cookies();
  cookieStore.set(tokenName, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/',
  });
}

async function deleteAuthToken(tokenName: 'access_token' | 'refresh_token' | 'user') {
  const cookieStore = await cookies();
  cookieStore.delete(tokenName);
}

export async function login(formData: z.infer<typeof loginSchema>) {
  try {
    // Validate form data
    const validatedFields = loginSchema.parse(formData);

    // Call the API
    const response = await fetch(`${process.env.USER_API_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedFields),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Login failed' };
    }

    const data = await response.json();
    
    // Store tokens using helper functions
    await setAuthToken('access_token', data.access_token, 3600); // 1 hour
    await setAuthToken('refresh_token', data.refresh_token, 24 * 60 * 60); // 24 hours
    await setAuthToken('user', JSON.stringify(data.user), 24 * 60 * 60); // 24 hours

    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message || 'Invalid form data' 
      };
    }
    
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function signup(formData: z.infer<typeof signupSchema>) {
  try {
    // Validate form data
    const validatedFields = signupSchema.parse(formData);

    // Call the API
    const response = await fetch(`${process.env.USER_API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedFields),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log(errorData);
      return { success: false, error: errorData.error || 'Signup failed' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message || 'Invalid form data' 
      };
    }
    
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function logout() {
  // Use helper function to delete tokens
  await deleteAuthToken('access_token');
  await deleteAuthToken('refresh_token');
  await deleteAuthToken('user');
  redirect('/login');
}

export async function checkAuth() {
  // Use helper function to get tokens
  const accessToken = await getAuthToken('access_token');
  const user = await getAuthToken('user');
  
  if (!accessToken || !user) {
    return { isAuthenticated: false, user: null };
  }
  
  try {
    const userData = user ? JSON.parse(user) : null;
    return { 
      isAuthenticated: true,
      user: userData
    };
  } catch (error) {
    console.error('Error parsing user data:', error);
    return { isAuthenticated: false, user: null };
  }
}

export async function getAuthUser() {
  const { isAuthenticated, user } = await checkAuth();
  
  if (!isAuthenticated) {
    return null;
  }
  
  return user;
}

export async function refreshAccessToken(): Promise<boolean> {
  try {
    // Get the refresh token
    const refreshToken = await getAuthToken('refresh_token');
    
    if (!refreshToken) {
      console.error('No refresh token available');
      return false;
    }

    // Call the refresh token endpoint
    const response = await fetch(`${process.env.USER_API_URL}/users/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to refresh token:', response.status);
      return false;
    }

    const data = await response.json();
    
    // Store the new access token
    await setAuthToken('access_token', data.access_token, 3600); // 1 hour
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}

export async function fetchWithAuth(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Get the access token
  let accessToken = await getAuthToken('access_token');
  
  if (!accessToken) {
    throw new Error('Authentication token is required');
  }

  // Prepare headers with authorization
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`
  };

  // Make the initial request
  let response = await fetch(url, { ...options, headers });

  // If unauthorized, try to refresh the token
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    
    if (refreshed) {
      // Get the new access token
      accessToken = await getAuthToken('access_token');
      
      // Retry the request with the new token
      const newHeaders = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
      };
      response = await fetch(url, { ...options, headers: newHeaders });
    }
  }

  return response;
}