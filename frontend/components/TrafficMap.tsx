"use client";

import React from 'react';
import { MapContainer, TileLayer, Circle, Popup, Tooltip } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

interface TrafficSensor {
  sensor_id: number;
  timestamp: string;
  traffic_volume: number;
  average_speed: number;
  congestion_level: 'low' | 'moderate' | 'high';
  latitude: number;
  longitude: number;
}

interface TrafficMapProps {
  sensors: TrafficSensor[];
  center: { lat: number; lng: number };
}

// Function to determine circle color based on congestion level
const getCircleColor = (level: string): string => {
  switch (level) {
    case 'low': return '#22c55e';      // brighter green
    case 'moderate': return '#eab308'; // brighter yellow
    case 'high': return '#ef4444';     // brighter red
    default: return '#3b82f6';         // blue (default)
  }
};

// Function to determine circle radius based on traffic volume
const getCircleRadius = (volume: number): number => {
  // Much larger base minimum radius for high visibility
  const minRadius = 400;
  
  // Increased scale factor for more dramatic size differences
  const scaleFactor = 0.6;
  
  return minRadius + (volume * scaleFactor);
};

const TrafficMap: React.FC<TrafficMapProps> = ({ sensors, center }) => {
  if (!sensors || sensors.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p>No sensor data available</p>
      </div>
    );
  }
  
  return (
    <MapContainer
      center={[center.lat, center.lng] as LatLngExpression}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      {/* Using a more muted map style for better contrast with the circles */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* Plot each traffic sensor as a circle */}
      {sensors.map((sensor) => (
        <Circle
          key={sensor.sensor_id}
          center={[sensor.latitude, sensor.longitude]}
          radius={getCircleRadius(sensor.traffic_volume)}
          pathOptions={{
            color: 'white',            // White border for contrast
            weight: 3,                 // Even thicker border
            fillColor: getCircleColor(sensor.congestion_level),
            fillOpacity: 0.85          // More opaque for better visibility
          }}
        >
          <Tooltip>
            <div className="text-xs font-bold">
              Sensor {sensor.sensor_id} - {sensor.congestion_level}
            </div>
          </Tooltip>
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-sm mb-1">Traffic Sensor #{sensor.sensor_id}</h3>
              <div className="text-xs space-y-1">
                <p><span className="font-medium">Traffic Volume:</span> {sensor.traffic_volume} vehicles</p>
                <p><span className="font-medium">Average Speed:</span> {sensor.average_speed} mph</p>
                <p>
                  <span className="font-medium">Congestion: </span>
                  <span 
                    className={`
                      ${sensor.congestion_level === 'low' ? 'text-green-600 font-semibold' : ''}
                      ${sensor.congestion_level === 'moderate' ? 'text-yellow-600 font-semibold' : ''}
                      ${sensor.congestion_level === 'high' ? 'text-red-600 font-semibold' : ''}
                    `}
                  >
                    {sensor.congestion_level}
                  </span>
                </p>
                <p><span className="font-medium">Updated:</span> {new Date(sensor.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
};

export default TrafficMap;
