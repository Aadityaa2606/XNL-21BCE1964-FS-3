"use client";

import React, { useState, useEffect } from 'react';
import { FaTrafficLight, FaInfoCircle, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import TrafficMetricsCard from '@/components/TrafficMetricsCard';
import MapLegend from '@/components/MapLegend';
import dynamic from 'next/dynamic';

const TrafficMap = dynamic(() => import('@/components/TrafficMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-[600px] bg-gray-100 flex items-center justify-center">Loading map...</div>
});

// Define the traffic sensor data type
interface TrafficSensor {
  sensor_id: number;
  timestamp: string;
  traffic_volume: number;
  average_speed: number;
  congestion_level: 'low' | 'moderate' | 'high';
  latitude: number;
  longitude: number;
}

export default function TrafficFlowPage() {
  const [trafficData, setTrafficData] = useState<TrafficSensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch traffic data
  useEffect(() => {
    const fetchTrafficData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.TF_API_URL}/traffic-flow/traffic/latest`);
        
        if (!response.ok) {
          throw new Error(`Error fetching traffic data: ${response.status}`);
        }
        
        const data: TrafficSensor[] = await response.json();
        setTrafficData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch traffic data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch traffic data');
      } finally {
        setLoading(false);
      }
    };

    fetchTrafficData();
    
    // Poll for new data every 30 seconds
    const intervalId = setInterval(fetchTrafficData, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Calculate traffic statistics
  const averageSpeed = trafficData.length > 0 
    ? Math.round(trafficData.reduce((sum, sensor) => sum + sensor.average_speed, 0) / trafficData.length)
    : 0;
    
  const totalVolume = trafficData.reduce((sum, sensor) => sum + sensor.traffic_volume, 0);

  const congestionCounts = trafficData.reduce((counts, sensor) => {
    counts[sensor.congestion_level] = (counts[sensor.congestion_level] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  // Calculate map center based on average of all sensor coordinates
  const mapCenter = trafficData.length > 0 
    ? {
        lat: trafficData.reduce((sum, sensor) => sum + sensor.latitude, 0) / trafficData.length,
        lng: trafficData.reduce((sum, sensor) => sum + sensor.longitude, 0) / trafficData.length,
      }
    : { lat: 37.7749, lng: -122.4194 }; // Default to San Francisco coordinates

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4 text-gray-500 hover:text-indigo-600">
                <FaArrowLeft size={20} />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FaTrafficLight className="mr-3 text-indigo-600" /> 
                Traffic Flow Dashboard
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {trafficData.length > 0 ? new Date(trafficData[0].timestamp).toLocaleString() : 'Loading...'}
            </div>
          </div>
          <p className="text-gray-500 mt-2">
            Real-time traffic conditions and congestion monitoring across the city
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <div className="flex">
              <FaInfoCircle className="mr-3" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && !trafficData.length && (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {/* Traffic metrics overview */}
        {!loading && !error && trafficData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <TrafficMetricsCard 
              title="Total Traffic Volume" 
              value={totalVolume.toLocaleString()} 
              unit="vehicles" 
              description="Total number of vehicles detected" 
            />
            <TrafficMetricsCard 
              title="Average Speed" 
              value={averageSpeed.toString()} 
              unit="mph" 
              description="Average vehicle speed across all sensors" 
            />
            <TrafficMetricsCard 
              title="Active Sensors" 
              value={trafficData.length.toString()} 
              unit="sensors" 
              description="Number of sensors reporting data" 
            />
          </div>
        )}

        {/* Map visualization */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Traffic Sensor Map</h2>
          <div className="relative h-[600px] border border-gray-200 rounded-lg">
            <TrafficMap sensors={trafficData} center={mapCenter} />
            <MapLegend />
          </div>
        </div>
        
        {/* Congestion breakdown */}
        {!loading && !error && trafficData.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Congestion Level Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                <h3 className="text-lg font-medium text-green-800">Low Congestion</h3>
                <p className="text-3xl font-bold text-green-600">{congestionCounts['low'] || 0}</p>
                <p className="text-sm text-green-700">Sensors reporting low traffic</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-100">
                <h3 className="text-lg font-medium text-yellow-800">Moderate Congestion</h3>
                <p className="text-3xl font-bold text-yellow-600">{congestionCounts['moderate'] || 0}</p>
                <p className="text-sm text-yellow-700">Sensors reporting moderate traffic</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                <h3 className="text-lg font-medium text-red-800">High Congestion</h3>
                <p className="text-3xl font-bold text-red-600">{congestionCounts['high'] || 0}</p>
                <p className="text-sm text-red-700">Sensors reporting high traffic</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
