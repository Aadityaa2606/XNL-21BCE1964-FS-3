"use client";

import React from "react";
import Link from "next/link";
import {
  FaTrafficLight,
  FaLeaf,
  FaWater,
  FaBuilding,
  FaLightbulb,
  FaShieldAlt,
} from "react-icons/fa";
import { getAuthUser } from "@/lib/actions/auth";

// Service card component
const ServiceCard = ({
  title,
  description,
  icon,
  status,
  path,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "normal" | "warning" | "critical";
  path: string;
}) => {
  const statusStyles = {
    normal: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      ring: "ring-emerald-200",
    },
    warning: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      ring: "ring-amber-200",
    },
    critical: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      ring: "ring-rose-200",
    },
  };

  return (
    <Link href={path}>
      <div className="group bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-5">
          <div className="text-4xl text-indigo-600 group-hover:scale-110 transition-transform duration-200">
            {icon}
          </div>
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full ${statusStyles[status].bg} ${statusStyles[status].text} ring-1 ${statusStyles[status].ring}`}
          >
            {status.toUpperCase()}
          </span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-200">
          {title}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
    </Link>
  );
};

export default function Dashboard() {
  const [userName, setUserName] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    async function fetchUser() {
      const user = await getAuthUser();
      setUserName(user?.username);
    }
    fetchUser();
  }, []);

  const services = [
    {
      title: "Traffic Management",
      description: "Real-time traffic conditions, signals and congestion data",
      icon: <FaTrafficLight />,
      status: "normal",
      path: "/dashboard/traffic-flow",
    },
    {
      title: "Air Quality",
      description: "Current air quality metrics across different city zones",
      icon: <FaLeaf />,
      status: "warning",
      path: "/dashboard/air-quality",
    },
    {
      title: "Power Consumption",
      description: "Electricity consumption and energy efficiency monitoring",

      icon: <FaLightbulb />,
      status: "normal",
      path: "/dashboard/water",
    },
    {
      title: "Water Levels",
      description: "Water levels and quality in city reservoirs and rivers",
      icon: <FaWater />,
      status: "normal",
      path: "/dashboard/buildings",
    },
    {
      title: "Waste Management",
      description: "Waste collection and recycling status in city districts",
      icon: <FaShieldAlt />,
      status: "critical",
      path: "/dashboard/lighting",
    },
    {
      title: "Structural Integrity",
      description: "Building safety and structural integrity monitoring",
      icon: <FaBuilding />,
      status: "normal",
      path: "/dashboard/safety",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {userName ? `Hello, ${userName} !` : "Welcome!"}
          </h2>
          <p className="text-gray-500 text-lg">
            Monitor and manage all city services in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <ServiceCard key={index} {...service} />
          ))}
        </div>
      </div>
    </div>
  );
}
