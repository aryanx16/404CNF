import React from 'react';
import { formatBytes } from '@/lib/formatUtils'; // Assuming this utility exists
import Pulse from '../skeleton/Pulse';

interface StorageSizeCardProps {
  data: any;
}

export default function StorageSizeCard({ data }: StorageSizeCardProps) {
  const metrics = data?.key_metrics;

  const dataSizeBytes = metrics?.total_data_storage_bytes;
  const deleteSizeBytes = metrics?.total_delete_storage_bytes ?? 0; 
  const totalSizeBytes = (dataSizeBytes !== undefined && dataSizeBytes !== null) 
                          ? dataSizeBytes + deleteSizeBytes 
                          : null;

  const dataFileCount = metrics?.total_data_files;
  const deleteFileCount = metrics?.total_delete_files;

  const avgDataFileSize = (dataFileCount && dataFileCount > 0 && dataSizeBytes !== undefined && dataSizeBytes !== null)
                            ? dataSizeBytes / dataFileCount
                            : null;

  const hasTotalSize = totalSizeBytes !== null;
  const hasDataFileCount = dataFileCount !== undefined && dataFileCount !== null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-neutral-500">Storage Size</h3>
          {/* Display total formatted size */}
          <p className="mt-1 text-lg font-semibold">
             {hasTotalSize ? formatBytes(totalSizeBytes) : <Pulse />}
          </p>
        </div>
        <div className="text-purple-500">
          <i className="ri-hard-drive-2-line text-2xl"></i>
        </div>
      </div>
      <div className="mt-2 text-sm text-neutral-600">
        {/* Display data file count */}
        {hasDataFileCount ? (
          <p>Data Files: {dataFileCount.toLocaleString()}</p> // Use localeString for large numbers
        ) : (
           hasTotalSize && <p>Data file count unavailable</p> // Show message if size exists but count doesn't
        )}
        
        {/* Display delete file count if greater than 0 */}
         {deleteFileCount !== undefined && deleteFileCount !== null && deleteFileCount > 0 && (
           <p>Delete Files: {deleteFileCount.toLocaleString()}</p>
         )}

        {/* Display average data file size */}
        {avgDataFileSize !== null ? (
          <p>Avg. Data File Size: {formatBytes(avgDataFileSize)}</p>
        ) : (
           hasDataFileCount && <p>Avg. data file size unavailable</p> // Show message if count exists but avg calc failed
        )}
      </div>
    </div>
  );
}