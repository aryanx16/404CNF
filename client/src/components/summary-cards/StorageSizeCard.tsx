import React from 'react';
import { TableMetadata } from '@shared/schema';
import { formatBytes } from '@/lib/formatUtils';

interface StorageSizeCardProps {
  metadata: TableMetadata;
}

export default function StorageSizeCard({ metadata }: StorageSizeCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-neutral-500">Storage Size</h3>
          <p className="mt-1 text-lg font-semibold">{formatBytes(metadata.size)}</p>
        </div>
        <div className="text-purple-500">
          <i className="ri-hard-drive-2-line text-2xl"></i>
        </div>
      </div>
      <div className="mt-2 text-sm text-neutral-600">
        {metadata.fileCount && (
          <p>Data Files: {metadata.fileCount}</p>
        )}
        {metadata.fileCount && metadata.size && (
          <p>Avg. File Size: {formatBytes(metadata.size / metadata.fileCount)}</p>
        )}
      </div>
    </div>
  );
}
