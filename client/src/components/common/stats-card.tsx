import { ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  details?: ReactNode;
  colorClass?: string;
}

export default function StatsCard({ 
  icon, 
  title, 
  value, 
  details, 
  colorClass = "bg-primary/10 text-primary" 
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 h-10 w-10 rounded-md flex items-center justify-center ${colorClass}`}>
          {icon}
        </div>
        <div className="ml-4">
          <h2 className="text-sm font-medium text-gray-500">{title}</h2>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
      {details && (
        <div className="mt-4">
          {details}
        </div>
      )}
    </div>
  );
}
