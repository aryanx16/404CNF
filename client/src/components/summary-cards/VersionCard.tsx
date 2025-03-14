import React from 'react';
import { TableMetadata } from '@shared/schema';
import { timeAgo } from '@/lib/formatUtils';

interface VersionCardProps {
  metadata: TableMetadata;
}

export default function VersionCard({ metadata }: VersionCardProps) {
  // If format doesn't support versioning (like plain Parquet) or no version info
  if (!metadata.currentVersion && metadata.format === 'parquet') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-neutral-500">File Stats</h3>
            <p className="mt-1 text-lg font-semibold">Parquet</p>
          </div>
          <div className="text-amber-500">
            <i className="ri-file-list-3-line text-2xl"></i>
          </div>
        </div>
        <div className="mt-2 text-sm text-neutral-600">
          <p>Last Updated: {timeAgo(metadata.lastModified)}</p>
          <p>Format: Apache Parquet</p>
        </div>
      </div>
    );
  }
  
  // For versioned formats (Iceberg, Delta, Hudi)
  const latestVersion = metadata.versions?.find(v => v.isLatest);
  const totalVersions = metadata.versions?.length || 0;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-neutral-500">Current Version</h3>
          <p className="mt-1 text-lg font-semibold">
            {metadata.format === 'iceberg' ? 'v' : ''}
            {metadata.currentVersion || (latestVersion?.id || 'N/A')}
          </p>
        </div>
        <div className="text-amber-500">
          <i className="ri-git-branch-line text-2xl"></i>
        </div>
      </div>
      <div className="mt-2 text-sm text-neutral-600">
        <p>Last Updated: {latestVersion ? timeAgo(latestVersion.timestamp) : timeAgo(metadata.lastModified)}</p>
        <p>Total {metadata.format === 'delta' ? 'Commits' : metadata.format === 'hudi' ? 'Commits' : 'Snapshots'}: {totalVersions}</p>
      </div>
    </div>
  );
}
