import React from 'react';

const MapLegend: React.FC = () => {
  return (
    <div className="absolute bottom-4 right-4 bg-white p-3 rounded-md shadow-md border border-gray-200 z-[1000]">
      <h4 className="text-sm font-semibold mb-2">Legend</h4>
      <div className="space-y-2">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-green-400 mr-2"></div>
          <span className="text-xs text-gray-600">Low Congestion</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-yellow-400 mr-2"></div>
          <span className="text-xs text-gray-600">Moderate Congestion</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-red-400 mr-2"></div>
          <span className="text-xs text-gray-600">High Congestion</span>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-500">Circle size represents traffic volume</span>
        </div>
      </div>
    </div>
  );
};

export default MapLegend;
