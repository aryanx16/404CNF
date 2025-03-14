import React from 'react';
import { TableMetadata } from '@shared/schema';
import { formatLargeNumber } from '@/lib/formatUtils';

interface RowCountCardProps {
  metadata: TableMetadata;
}

export default function RowCountCard({ metadata }: RowCountCardProps) {
  // If no row count is available, show placeholder
  if (!metadata.rowCount) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-neutral-500">Row Count</h3>
            <p className="mt-1 text-lg font-semibold">Unknown</p>
          </div>
          <div className="text-green-500">
            <i className="ri-database-2-line text-2xl"></i>
          </div>
        </div>
        <div className="mt-2 text-sm text-neutral-600">
          <p>No row count information available</p>
        </div>
      </div>
    );
  }
  
  // For Iceberg and Delta formats, we might have version info to show change
  let changeInfo = null;
  if (metadata.format === 'iceberg' || metadata.format === 'delta') {
    const latestVersion = metadata.versions?.find(v => v.isLatest);
    if (latestVersion?.changes?.rowsAdded) {
      const percentChange = ((latestVersion.changes.rowsAdded as number) / metadata.rowCount) * 100;
      changeInfo = (
        <span className="inline-flex items-center text-green-500">
          <i className="ri-arrow-up-line mr-1"></i>
          +{percentChange.toFixed(1)}% from last snapshot
        </span>
      );
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-neutral-500">Row Count</h3>
          <p className="mt-1 text-lg font-semibold">{formatLargeNumber(metadata.rowCount)}</p>
        </div>
        <div className="text-green-500">
          <i className="ri-database-2-line text-2xl"></i>
        </div>
      </div>
      <div className="mt-2 text-sm text-neutral-600">
        {changeInfo || <p>Total records in table</p>}
      </div>
    </div>
  );
}
