import React from 'react';
// import { TableMetadata } from '@shared/schema'; // Potentially unused
import { formatBytes, getFormatDescription } from '@/lib/formatUtils';
import { metadataAtom } from '@/atoms/metadataAtom';
import { useRecoilValue } from 'recoil';
import { FilesViewerSkeleton } from '../skeleton/FilesViewerSkeleton';
import PropertiesViewerSkeleton from '../skeleton/PropertiesViewerSkeleton';
// import { metadataAtom } from '@/atoms/metadataAtom'; // Potentially unused
// import { useRecoilValue } from 'recoil'; // Potentially unused

// --- Client-side Timestamp Formatter ---
const formatTimestampMs = (timestampMs?: number): string | null => {
  if (timestampMs === null || timestampMs === undefined) {
    return null;
  }
  try {
    const date = new Date(timestampMs);
    if (isNaN(date.getTime())) { // Check if the date is valid
      return String(timestampMs); // Return original value if conversion fails
    }
    return date.toISOString(); // Standard ISO 8601 format UTC
  } catch (e) {
    console.error("Error formatting timestamp:", e);
    return String(timestampMs); // Fallback
  }
};


// Define a type for the expected responseData structure based on your example
interface ResponseData {
  table_type?: string;
  format_version?: number;
  location?: string;
  iceberg_manifest_files?: Array<{
    file_path: string;
    size_bytes: number | null;
    size_human: string;
    type: string;
    relative_path?: string;
  }>;
  delta_log_files?: Array<{
    file_path: string;
    relative_path: string;
    size_bytes: number | null;
    size_human: string;
  }>;
  format_configuration?: Record<string, any>;
  current_snapshot_details?: Record<string, any>; 
  key_metrics?: Record<string, any>;
  version_history?: {
      current_snapshot_summary?: Record<string, any>;
      snapshots_overview?: Array<Record<string, any>>;
      total_snapshots?: number;
  };
   current_snapshot_id?: number | string;
}

interface PropertiesViewerProps {
  responseData: ResponseData | null;
  isPreview?: boolean;
}

// Helper to format keys (camelCase/snake_case/kebab-case to Title Case)
const formatKey = (key: string): string => {
  // Specific overrides first
  if (key === 'id') return 'Snapshot ID';
  if (key === 'created_at_iso') return 'Created At';
  if (key === 'manifest_list') return 'Manifest List';
  if (key === 'total_data_files_snapshot') return 'Total Data Files (Snapshot)';
  if (key === 'added_data_files_commit') return 'Added Data Files (Commit)';
  if (key === 'removed_data_files_commit') return 'Removed Data Files (Commit)';
  if (key === 'added_records_commit') return 'Added Records (Commit)';
  if (key === 'removed_records_commit') return 'Removed Records (Commit)';
  if (key === 'added_delete_files') return 'Added Delete Files (Commit)';
  if (key === 'added_position_deletes') return 'Added Positional Deletes (Commit)';
  if (key === 'added_equality_deletes') return 'Added Equality Deletes (Commit)';


  // General logic: handles camelCase, snake_case, kebab-case
  return key
    .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters (for camelCase)
    .trim() // Remove leading/trailing spaces
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
};


export default function PropertiesViewer({ responseData, isPreview = false }: PropertiesViewerProps) {
  const { loading, error, data: dataPayload } = useRecoilValue(metadataAtom);
  if (loading && !dataPayload) {
    return <PropertiesViewerSkeleton />;
}
  // --- Check for essential data ---
  if (!responseData || !responseData.table_type || !responseData.format_configuration) {
    // ... (keep the 'No Properties Available' rendering)
     return (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
          {/* ... icon and text ... */}
           <h3 className="text-lg font-medium text-neutral-700">No Properties Available</h3>
           <p className="text-neutral-500 mt-1">Format-specific properties could not be found or are still loading.</p>
        </div>
      );
  }

  // --- Extract top-level info ---
  const format = responseData.table_type || 'Unknown';
  const manifestFiles = format.toLowerCase() === 'iceberg' 
                        ? responseData.iceberg_manifest_files 
                        : responseData.delta_log_files; 
  const formatConfig = responseData.format_configuration;
  const formatVersion = responseData.format_version ?? formatConfig?.['format-version'] ?? '0';
  const location = responseData.location;
  const metrics = responseData.key_metrics;
  const current_snapshot_id = responseData.current_snapshot_id;
  // --- Determine Snapshot Info Source and create consistent object ---
  const primarySnapshotData = responseData.current_snapshot_details;
  const fallbackSnapshotData = responseData.version_history?.snapshots_overview.find(snap => snap['snapshot-id'] == current_snapshot_id); 
  
  console.log(current_snapshot_id, fallbackSnapshotData);

  let snapshotDisplayInfo: Record<string, any> | null = null;
  let rawSummaryForDetails: Record<string, any> | null = null;

  // Define consistent keys we want to display
  const snapshotInfoKeys = {
      snapshotId: 'Snapshot ID',
      createdAt: 'Created At',
      manifestList: 'Manifest List',
      operation: 'Operation',
      totalDataFilesSnapshot: 'Total Data Files (Snapshot)',
      addedDataFilesCommit: 'Added Data Files (Commit)',
      removedDataFilesCommit: 'Removed Data Files (Commit)',
      addedRecordsCommit: 'Added Records (Commit)',
      removedRecordsCommit: 'Removed Records (Commit)',
      addedDeleteFilesCommit: 'Added Delete Files (Commit)',
      addedPositionDeletesCommit: 'Added Positional Deletes (Commit)',
      addedEqualityDeletesCommit: 'Added Equality Deletes (Commit)',
  };


  if (primarySnapshotData) {
      // Map from current_snapshot_details
      snapshotDisplayInfo = {
          [snapshotInfoKeys.snapshotId]: primarySnapshotData.id ?? responseData.current_snapshot_id,
          [snapshotInfoKeys.createdAt]: primarySnapshotData.created_at_iso ?? formatTimestampMs(primarySnapshotData.created_at_ms),
          [snapshotInfoKeys.manifestList]: primarySnapshotData.manifest_list,
          [snapshotInfoKeys.operation]: primarySnapshotData.operation,
          [snapshotInfoKeys.totalDataFilesSnapshot]: primarySnapshotData.total_data_files,
          // Use ?? '0' or '0' as appropriate default
          [snapshotInfoKeys.addedDataFilesCommit]: primarySnapshotData.added_data_files ?? '0',
          [snapshotInfoKeys.removedDataFilesCommit]: primarySnapshotData.removed_data_files ?? '0',
          [snapshotInfoKeys.addedRecordsCommit]: primarySnapshotData.added_records ?? '0',
          [snapshotInfoKeys.removedRecordsCommit]: primarySnapshotData.removed_records ?? '0',
          // Try to get delete counts from summary_details if available
          [snapshotInfoKeys.addedDeleteFilesCommit]: primarySnapshotData.summary_details?.['added-delete-files'] ?? '0',
          [snapshotInfoKeys.addedPositionDeletesCommit]: primarySnapshotData.summary_details?.['added-position-deletes'] ?? '0',
          [snapshotInfoKeys.addedEqualityDeletesCommit]: primarySnapshotData.summary_details?.['added-equality-deletes'] ?? '0',
      };
      rawSummaryForDetails = primarySnapshotData.summary_details;
  } else if (fallbackSnapshotData) {
       // Map from version_history.current_snapshot_summary
       const summary = fallbackSnapshotData.summary || {};
       snapshotDisplayInfo = {
          [snapshotInfoKeys.snapshotId]: fallbackSnapshotData['snapshot-id'] ?? responseData.current_snapshot_id,
          [snapshotInfoKeys.createdAt]: formatTimestampMs(fallbackSnapshotData['timestamp-ms']),
          [snapshotInfoKeys.manifestList]: fallbackSnapshotData['manifest-list'],
          [snapshotInfoKeys.operation]: summary.operation,
          [snapshotInfoKeys.totalDataFilesSnapshot]: metrics?.total_data_files, // Get from metrics
          // --- Use keys available in *this* summary ---
          // These specific keys might be missing in the fallback summary, default to '0' or '0'
          [snapshotInfoKeys.addedDataFilesCommit]: summary['added-data-files'] ?? '0', 
          [snapshotInfoKeys.removedDataFilesCommit]: summary['removed-data-files'] ?? '0',
          [snapshotInfoKeys.addedRecordsCommit]: summary['added-records'] ?? '0', 
          // 'Removed Records' is often not explicitly tracked, use available delete counts
          // Instead of 'Removed Records', let's show the specific delete counts added by the commit
          [snapshotInfoKeys.addedDeleteFilesCommit]: summary['added-delete-files'] ?? '0', 
          [snapshotInfoKeys.addedPositionDeletesCommit]: summary['added-position-deletes'] ?? '0',
          [snapshotInfoKeys.addedEqualityDeletesCommit]: summary['added-equality-deletes'] ?? '0',
      };
      // Remove the generic 'Removed Records' key if we replaced it
      delete snapshotDisplayInfo[snapshotInfoKeys.removedRecordsCommit]; 
      rawSummaryForDetails = summary;
  }

   // --- Calculate total size ---
   const dataSizeBytes = metrics?.total_data_storage_bytes;
   const deleteSizeBytes = metrics?.total_delete_storage_bytes ?? 0;
   let totalSizeDisplay = 'Unknown';
   if (dataSizeBytes !== undefined && dataSizeBytes !== null) {
       totalSizeDisplay = formatBytes(dataSizeBytes + deleteSizeBytes);
   }


  // --- Preview Mode ---
  if (isPreview) {
     return (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
            {/* ... Header ... */}
             <div className="flex justify-between items-center p-4 border-b border-neutral-200">
                <h2 className="text-base font-medium">{format} Format Properties</h2>
                <button className="text-sm text-neutral-600 flex items-center hover:text-primary">
                    <i className="ri-information-line mr-1"></i>
                    About {format} Format
                </button>
             </div>
            <div className="p-4">
                <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200">
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Format:</div>
                    <div>{format}</div>
                    {formatVersion !== '0' && (
                    <>
                        <div className="font-medium">Version:</div>
                        <div>{formatVersion}</div>
                    </>
                    )}
                    <div className="font-medium">Location:</div>
                    <div className="truncate">{location || '0'}</div>
                    <div className="font-medium">Data Size:</div>
                    <div>{metrics?.total_data_storage_human || totalSizeDisplay}</div>
                </div>
                </div>
            </div>
        </div>
      );
  }
 
  // --- Full Properties Viewer ---
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        {/* ... Header ... */}
        <div className="flex justify-between items-center p-4 border-b border-neutral-200">
            <h2 className="text-base font-medium">{format} Format Properties</h2>
            <button className="text-sm text-neutral-600 flex items-center hover:text-primary">
                <i className="ri-information-line mr-1"></i>
                About {format} Format
            </button>
        </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div>
          {/* Manifest/Log Files section */}
          {manifestFiles && manifestFiles.length > 0 && (
            <>
            {/* ... Keep manifest file rendering ... */}
             <h3 className="text-sm font-medium mb-2">
                {format === 'Iceberg' ? 'Manifest Files' : 'Log Files'}
             </h3>
             <div className="border border-neutral-200 rounded-md overflow-hidden mb-4">
                 <div className="bg-neutral-50 p-2 border-b border-neutral-200 flex justify-between items-center">
                     <span className="text-xs font-medium">File Path</span>
                     <span className="text-xs font-medium">Size</span>
                 </div>
                 <div className="max-h-40 overflow-y-auto text-sm">
                     {manifestFiles.map((file, index) => (
                         <div key={index} className="p-2 border-b border-neutral-100 flex justify-between items-center">
                             <span className="truncate w-4/5" title={file.file_path}>
                                 {format === 'Delta' && file.relative_path ? file.relative_path : file.file_path}
                             </span>
                             <span className="text-neutral-500 whitespace-nowrap pl-2">
                                 {file.size_human || formatBytes(file.size_bytes)}
                             </span>
                         </div>
                     ))}
                 </div>
             </div>
            </>
          )}

          {/* Format Configuration section */}
          {/* ... Keep format config rendering ... */}
           <h3 className="text-sm font-medium mb-2">Format Configuration</h3>
            <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200 overflow-y-auto">
                <pre className="text-xs overflow-x-auto">
                    {formatConfig ? JSON.stringify(formatConfig, null, 2) : 'No configuration available'}
                </pre>
            </div>
            {metrics.metrics_note && (
              <p className="text-xs text-neutral-500 mt-2 italic">{metrics.metrics_note}</p>
            )}
            {/* Format Description */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
              {/* ... Keep format description rendering ... */}
              <h3 className="text-sm font-medium mb-1 text-blue-700">About {format} Format</h3>
              <p className="text-sm text-blue-600">
                  {getFormatDescription(format.toLowerCase() as any)}
              </p>
            </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Snapshot Information section */}
          {snapshotDisplayInfo && Object.keys(snapshotDisplayInfo).length > 0 && (
            <>
              <h3 className="text-sm font-medium mb-2">Current Snapshot Details</h3>
              <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200 mb-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                   {/* Iterate over the consistent snapshotDisplayInfo */}
                  {Object.entries(snapshotDisplayInfo)
                   // Optional: Filter out keys you don't want to display directly
                   // .filter(([key]) => key !== 'Some Internal Key') 
                   .map(([key, value]) => ( // Key is already formatted via snapshotInfoKeys
                    <React.Fragment key={key}>
                      <div className="font-medium text-neutral-600">{key}:</div>
                      <div className="truncate text-neutral-800" title={typeof value === 'object' ? JSON.stringify(value) : value?.toString()}>
                        {value === null || value === undefined
                         ? <span className="text-neutral-400">0</span>
                         : typeof value === 'object' 
                         ? JSON.stringify(value) 
                         : value.toString()}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                 {/* Raw Summary Details */}
                {rawSummaryForDetails && (
                   <details className="mt-2 text-xs">
                       <summary className="cursor-pointer text-neutral-500">Raw Snapshot Summary</summary>
                       <pre className="mt-1 overflow-x-auto bg-white p-2 rounded border border-neutral-200">
                           {JSON.stringify(rawSummaryForDetails, null, 2)}
                       </pre>
                   </details>
                )}
              </div>
            </>
          )}

          {/* Metadata Metrics section */}
          {metrics && Object.keys(metrics).length > 0 && (
             <>
             {/* ... Keep metrics rendering logic ... */}
               <h3 className="text-sm font-medium mb-2">Key Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                    {Object.entries(metrics)
                    .filter(([key]) => key !== 'metrics_note')
                    .map(([key, value]) => {
                        const humanKey = `${key}_human`;
                        const displayValue = metrics[humanKey] !== undefined
                            ? metrics[humanKey]
                            : typeof value === 'number' && (key.toLowerCase().includes('mb'))
                            ? formatBytes(value*1000000)
                            : typeof value === 'number' && (key.toLowerCase().includes('size') || key.toLowerCase().includes('bytes'))
                            ? formatBytes(value)
                            : value?.toString() ?? <span className="text-neutral-400 text-base">0</span>;

                        if (key.endsWith('_bytes') && metrics[humanKey] !== undefined) {
                            return null;
                        }
                        console.log(humanKey, formatBytes(value))
                        return (
                            <div key={key} className="bg-neutral-50 p-3 rounded-md border border-neutral-200 flex flex-col">
                                <span className="text-xs text-neutral-500">
                                    {formatKey(key.replace('_human', '').replace('_bytes', '').replace('_mb', ''))}
                                </span>
                                <span className="text-lg font-medium mt-1 text-neutral-800">
                                    {displayValue}
                                </span>
                            </div>
                        );
                    })}
                </div>
                
             </>
          )}
          
          

        </div>
      </div>
    </div>
  );
}