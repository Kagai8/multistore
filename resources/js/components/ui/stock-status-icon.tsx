import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

interface StockData {
  current_stock: number;
  reorder_level: number;
  [key: string]: any;
}

interface StockStatusIconProps {
  data: StockData;
}

const StockStatusIcon: React.FC<StockStatusIconProps> = ({ data }) => {
  const currentStock = Number(data.current_stock) || 0;
  const reorderLevel = Number(data.reorder_level) || 0;
  const warningThreshold = reorderLevel + 10;

  // Not tracked
  if (reorderLevel === 0) {
    return (
      <span
        className="inline-flex items-center justify-center w-8 h-6 text-xs font-medium text-gray-500 rounded-full bg-gray-100"
        title="Reorder policy not set"
      >
        —
      </span>
    );
  }

  // DANGER
  if (currentStock <= reorderLevel) {
    return (
      <span
        className="inline-flex items-center justify-center w-8 h-6 text-xs font-medium text-white rounded-full bg-red-500 animate-pulse"
        title={`CRITICAL: Stock (${currentStock}) ≤ Reorder Level (${reorderLevel})`}
      >
        <X size={14} strokeWidth={3} />
      </span>
    );
  }

  // WARNING
  if (currentStock <= warningThreshold) {
    return (
      <span
        className="inline-flex items-center justify-center w-8 h-6 text-xs font-medium text-amber-800 rounded-full bg-amber-100"
        title={`LOW: Stock (${currentStock}) near Reorder Level (${reorderLevel})`}
      >
        <AlertTriangle size={14} strokeWidth={3} />
      </span>
    );
  }

  // SAFE
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-6 text-xs font-medium text-emerald-800 rounded-full bg-emerald-100"
      title={`SAFE: Stock (${currentStock}) well above Reorder Level (${reorderLevel})`}
    >
      <Check size={14} strokeWidth={3} />
    </span>
  );
};

export default StockStatusIcon;
