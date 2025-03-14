import React from 'react';
import { TableMetadata } from '@shared/schema';
import { formatBytes, formatLargeNumber, timeAgo, getFormatColor } from '@/lib/formatUtils';

interface TableSummaryProps {
  metadata: TableMetadata;
  isLoading: boolean;
}

export default function TableSummary({ metadata, isLoading }: TableSummaryProps) {
  if (isLoading || !metadata) {
    return (
      <div className="bg-white border-b border-neutral-200 p-4 animate-pulse">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          <div>
            <div className="h-6 w-48 bg-neutral-200 rounded mb-2"></div>
            <div className="h-4 w-64 bg-neutral-200 rounded"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-8 w-24 bg-neutral-200 rounded"></div>
            <div className="h-8 w-24 bg-neutral-200 rounded"></div>
            <div className="h-8 w-24 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  const formatColor = getFormatColor(metadata.format as any);
  
  return (
    <div className="bg-white border-b border-neutral-200 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-xl font-semibold">{metadata.name}</h1>
          <div className="flex items-center text-sm text-neutral-500 mt-1">
            <span className="flex items-center">
              <div className={`w-3 h-3 ${formatColor.bg} rounded-full mr-1.5`} title={`${metadata.format} format`}></div>
              {metadata.format.charAt(0).toUpperCase() + metadata.format.slice(1)}
            </span>
            <span className="mx-2">•</span>
            <span>Last Modified: {new Date(metadata.lastModified).toLocaleString()}</span>
            <span className="mx-2">•</span>
            <span>Size: {formatBytes(metadata.size)}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button disabled className="bg-white border border-neutral-300 hover:bg-neutral-50 px-3 py-1.5 rounded-md text-sm font-medium text-neutral-700 cursor-not-allowed transition-colors flex items-center">
            <i className="ri-download-line mr-1.5"></i>
            Export
          </button>
          <button className="bg-white border border-neutral-300 hover:bg-neutral-50 px-3 py-1.5 rounded-md text-sm font-medium text-neutral-700 cursor-not-allowed transition-colors flex items-center">
            <i className="ri-history-line mr-1.5"></i>
            History
          </button>
          <button className="bg-green-500 cursor-not-allowed hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center">
            <i className="ri-play-line mr-1.5"></i>
            Query
          </button>
        </div>
      </div>
    </div>
  );
}
