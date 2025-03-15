"use server";

import { fetchWithAuth } from "./auth";

export type Contribution = {
  contribution_id: number;
  user_id: number;
  service: string;
  service_sensor_id: number;
  contributed_at: string;
};

export type AllContributionsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Contribution[];
};

export type UserContributionsResponse = {
  sensors: Contribution[];
};

export async function getUserContributions(): Promise<UserContributionsResponse> {
  try {
    const apiUrl = process.env.USER_API_URL;
    const response = await fetchWithAuth(`${apiUrl}/sensors`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user contributions: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching user contributions:", error);
    throw error;
  }
}

export async function getAllContributions(
  limit: number = 20,
  offset: number = 0
): Promise<AllContributionsResponse> {
  try {
    const apiUrl = process.env.USER_API_URL;
    const response = await fetchWithAuth(
      `${apiUrl}/sensors/all?limit=${limit}&offset=${offset}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch all contributions: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching all contributions:", error);
    throw error;
  }
}
