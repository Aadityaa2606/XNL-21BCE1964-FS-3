import React from 'react';

interface TrafficMetricsCardProps {
  title: string;
  value: string;
  unit: string;
  description: string;
}

const TrafficMetricsCard: React.FC<TrafficMetricsCardProps> = ({
  title,
  value,
  unit,
  description
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
      <div className="flex items-baseline">
        <span className="text-3xl font-bold text-indigo-600">{value}</span>
        <span className="ml-2 text-gray-500">{unit}</span>
      </div>
      <p className="text-sm text-gray-500 mt-2">{description}</p>
    </div>
  );
};

export default TrafficMetricsCard;
