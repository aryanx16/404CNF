import React, { useState, useEffect } from 'react';
// import { TableMetadata } from '@shared/schema'; // Potentially unused
import { formatBytes, getFormatDescription } from '@/lib/formatUtils';
import { metadataAtom } from '@/atoms/metadataAtom';
import { useRecoilValue } from 'recoil';
import { FilesViewerSkeleton } from '../skeleton/FilesViewerSkeleton';
import PropertiesViewerSkeleton from '../skeleton/PropertiesViewerSkeleton';

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
    // Use locale-specific format for better readability, include time
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  } catch (e) {
    console.error("Error formatting timestamp:", e);
    return String(timestampMs); // Fallback
  }
};

// Define a type for the expected responseData structure (simplified for snapshot focus)
interface SnapshotOverview {
    'snapshot-id': number | string;
    'sequence-number': number; // Added sequence number
    'timestamp-ms': number;
    'manifest-list': string;
    summary?: Record<string, any>; // Summary might be optional or structured differently
    // Add other potential fields from snapshots_overview if needed
}

interface ResponseData {
  table_type?: string;
  format_version?: number;
  location?: string;
  iceberg_manifest_files?: Array<{ /* ... */ file_path: string, size_bytes: number | null, size_human: string, type: string, relative_path?: string }>; // Added example structure
  delta_log_files?: Array<{ /* ... */ file_path: string, relative_path: string, size_bytes: number | null, size_human: string }>; // Added example structure
  format_configuration?: Record<string, any>;
  current_snapshot_details?: Record<string, any>; // Can contain more details than summary
  key_metrics?: Record<string, any> & { metrics_note?: string }; // Added metrics_note here
  version_history?: {
      current_snapshot_summary?: Record<string, any>; // Potentially redundant if in snapshots_overview
      snapshots_overview?: Array<SnapshotOverview>;
      total_snapshots?: number;
  };
  current_snapshot_id?: number | string; // Still needed to identify the current snapshot
  // Add other fields from your example as needed
}

interface PropertiesViewerProps {
  responseData: ResponseData | null;
  isPreview?: boolean;
}

// Helper to format keys (camelCase/snake_case/kebab-case to Title Case)
const formatKey = (key: string): string => {
  // Specific overrides first (keep these or adjust as needed)
  if (key === 'id' || key === 'snapshot-id') return 'Snapshot ID'; // Keep showing the actual ID
  if (key === 'sequence-number') return 'Sequence Number'; // Add sequence number
  if (key === 'created_at_iso' || key === 'timestamp-ms') return 'Created At';
  if (key === 'manifest_list' || key === 'manifest-list') return 'Manifest List';
  if (key === 'total_data_files_snapshot' || key === 'total-data-files') return 'Total Data Files';
  if (key === 'added_data_files_commit' || key === 'added-data-files') return 'Added Data Files (Commit)';
  if (key === 'removed_data_files_commit' || key === 'removed-data-files') return 'Removed Data Files (Commit)';
  if (key === 'added_records_commit' || key === 'added-records') return 'Added Records (Commit)';
  if (key === 'removed_records_commit') return 'Removed Records (Commit)'; // Might not exist often in summary
  if (key === 'added_delete_files' || key === 'added-delete-files') return 'Added Delete Files (Commit)';
  if (key === 'added_position_deletes' || key === 'added-position-deletes') return 'Added Positional Deletes (Commit)';
  if (key === 'added_equality_deletes' || key === 'added-equality-deletes') return 'Added Equality Deletes (Commit)';
  if (key === 'total_records') return 'Total Records (Snapshot)';
  if (key === 'total_delete_files') return 'Total Delete Files (Snapshot)';
  if (key === 'total_position_deletes') return 'Total Positional Deletes (Snapshot)';
  if (key === 'total_equality_deletes') return 'Total Equality Deletes (Snapshot)';
  if (key === 'changed-partition-count') return 'Changed Partitions (Commit)';
  if (key === 'total-files-size') return 'Total Files Size (Snapshot)';
  if (key === 'added-files-size') return 'Added Files Size (Commit)';
  if (key === 'trino_query_id') return 'Trino Query ID'; // Example

  // General logic: handles camelCase, snake_case, kebab-case
  return key
    .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters (for camelCase)
    .trim() // Remove leading/trailing spaces
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
};


export default function PropertiesViewer({ responseData, isPreview = false }: PropertiesViewerProps) {
  const { loading, error, data: dataPayload } = useRecoilValue(metadataAtom);

  // --- State for Selected Snapshot Sequence Number ---
  const [selectedSequenceNumber, setSelectedSequenceNumber] = useState<string | number | null>(null);

  const snapshots = responseData?.version_history?.snapshots_overview ?? [];
  const currentSnapshotId = responseData?.current_snapshot_id;

  // --- Effect to Initialize Selected Snapshot Sequence Number ---
  useEffect(() => {
    if (currentSnapshotId && snapshots.length > 0) {
        const currentSnapshot = snapshots.find(snap => snap['snapshot-id'] == currentSnapshotId); // Find current by ID
        const currentSequenceNumber = currentSnapshot?.['sequence-number'];

        // Set the initial selected sequence number when data/current ID is available
        if (currentSequenceNumber !== undefined && selectedSequenceNumber === null) {
            setSelectedSequenceNumber(currentSequenceNumber);
        }

        // Validate if the current selection is still valid
        const isValidSelection = snapshots.some(
            snap => snap['sequence-number'] == selectedSequenceNumber // Use loose comparison
        );

        // If selection is invalid or wasn't set, reset to current sequence number
        if (currentSequenceNumber !== undefined && (!isValidSelection || selectedSequenceNumber === null)) {
            setSelectedSequenceNumber(currentSequenceNumber);
        }
    }
     // Reset if responseData becomes null
     if (!responseData) {
         setSelectedSequenceNumber(null);
     }
  }, [responseData, currentSnapshotId, snapshots, selectedSequenceNumber]); // Dependencies

  // --- Handle Loading and Initial Error States ---
  if (loading && !dataPayload) {
    return <PropertiesViewerSkeleton />;
  }
  if (error || !responseData || !responseData.table_type || !responseData.format_configuration) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
        {/* ... icon ... */}
        <h3 className="text-lg font-medium text-neutral-700">
            {error ? 'Error Loading Properties' : 'No Properties Available'}
        </h3>
        <p className="text-neutral-500 mt-1">
            {error ? error.message : 'Format-specific properties could not be found or are still loading.'}
        </p>
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
  const metrics = responseData.key_metrics; // Key metrics usually reflect CURRENT table state

  // --- Dropdown Change Handler ---
  const handleSnapshotChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSequenceNumber(event.target.value); // Value is string from select
  };

  // --- Find Data for the SELECTED Snapshot (using sequence number) ---
  let snapshotDisplayInfo: Record<string, any> | null = null;
  let rawSummaryForDetails: Record<string, any> | null = null;
  let selectedSnapshotData: SnapshotOverview | undefined | null = null;

  if (selectedSequenceNumber !== null) {
      // Find the snapshot data using the selected sequence number
      selectedSnapshotData = snapshots.find(snap => snap['sequence-number'] == selectedSequenceNumber); // Loose comparison

      // Determine if we should use the more detailed current_snapshot_details
      // Check if the FOUND snapshot's ID matches the current ID AND if details exist
      const isCurrentSnapshotSelected = selectedSnapshotData && selectedSnapshotData['snapshot-id'] == currentSnapshotId;
      const usePrimaryDetails = isCurrentSnapshotSelected && responseData.current_snapshot_details;

      if (usePrimaryDetails) {
          const primarySnapshotData = responseData.current_snapshot_details!;
          // Map from current_snapshot_details
          snapshotDisplayInfo = {
              // --- Key identifiers ---
              'Snapshot ID': primarySnapshotData.id ?? selectedSnapshotData?.['snapshot-id'], // Show the actual ID
              'Sequence Number': selectedSnapshotData?.['sequence-number'], // Show sequence number too
              'Created At': primarySnapshotData.created_at_iso ?? formatTimestampMs(primarySnapshotData.created_at_ms),
              'Manifest List': primarySnapshotData.manifest_list,
              'Operation': primarySnapshotData.operation,
              // --- Snapshot-level stats (from details) ---
              'Total Data Files (Snapshot)': primarySnapshotData.total_data_files,
              // --- Commit-level stats (from details) ---
              'Added Data Files (Commit)': primarySnapshotData.added_data_files ?? '0',
              'Removed Data Files (Commit)': primarySnapshotData.removed_data_files ?? '0',
              'Added Records (Commit)': primarySnapshotData.added_records ?? '0',
              'Removed Records (Commit)': primarySnapshotData.removed_records ?? '0', // Often N/A
              'Added Delete Files (Commit)': primarySnapshotData.summary_details?.['added-delete-files'] ?? '0',
              'Added Positional Deletes (Commit)': primarySnapshotData.summary_details?.['added-position-deletes'] ?? '0',
              'Added Equality Deletes (Commit)': primarySnapshotData.summary_details?.['added-equality-deletes'] ?? '0',
          };
          // Include other summary details
          if (primarySnapshotData.summary_details) {
              Object.entries(primarySnapshotData.summary_details).forEach(([key, value]) => {
                  const formattedKey = formatKey(key);
                   // Avoid overwriting keys we explicitly mapped above, unless it's a core ID/time field
                  if (!(formattedKey in snapshotDisplayInfo) || ['Snapshot ID', 'Sequence Number', 'Created At', 'Manifest List', 'Operation'].includes(formattedKey)) {
                       snapshotDisplayInfo[formattedKey] = value;
                  }
              });
          }
          rawSummaryForDetails = primarySnapshotData.summary_details; // Use detailed summary

      } else if (selectedSnapshotData?.summary) {
           // Map from selected snapshot's summary in snapshots_overview
           const summary = selectedSnapshotData.summary || {};
           snapshotDisplayInfo = {
                // --- Key identifiers ---
               'Snapshot ID': selectedSnapshotData['snapshot-id'], // Show the actual ID
               'Sequence Number': selectedSnapshotData['sequence-number'], // Show sequence number
               'Created At': formatTimestampMs(selectedSnapshotData['timestamp-ms']),
               'Manifest List': selectedSnapshotData['manifest-list'],
               // --- Map from summary ---
               ...Object.fromEntries(
                   Object.entries(summary).map(([key, value]) => [formatKey(key), value])
               )
           };
            // Ensure Operation is present if available in summary
           if (!snapshotDisplayInfo['Operation'] && summary.operation) {
               snapshotDisplayInfo['Operation'] = summary.operation;
           }
           rawSummaryForDetails = summary;

      } else if (selectedSnapshotData) {
          // Fallback if summary is missing but snapshot exists
           snapshotDisplayInfo = {
               'Snapshot ID': selectedSnapshotData['snapshot-id'],
               'Sequence Number': selectedSnapshotData['sequence-number'],
               'Created At': formatTimestampMs(selectedSnapshotData['timestamp-ms']),
               'Manifest List': selectedSnapshotData['manifest-list'],
               'Operation': 'N/A (Summary Missing)',
           };
          rawSummaryForDetails = { note: "Detailed summary not available for this snapshot." };
      }
  }

   // --- Calculate total size (Based on CURRENT metrics) ---
   const dataSizeBytes = metrics?.total_data_storage_bytes;
   const deleteSizeBytes = metrics?.total_delete_storage_bytes ?? 0;
   let totalSizeDisplay = 'Unknown';
   if (dataSizeBytes !== undefined && dataSizeBytes !== null) {
       totalSizeDisplay = formatBytes(dataSizeBytes + deleteSizeBytes);
   }


  // --- Preview Mode ---
  if (isPreview) {
      // (Preview mode remains unchanged - typically shows current state)
      return (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
            {/* ... Header ... */}
            <div className="flex justify-between items-center p-4 border-b border-neutral-200">
                <h2 className="text-base font-medium">{format} Format Properties</h2>
                <a href="#" className="text-sm text-neutral-600 flex items-center hover:text-primary">
                    <i className="ri-information-line mr-1"></i>
                    About {format} Format
                </a>
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
                        <div className="truncate">{location || 'N/A'}</div>
                        <div className="font-medium">Current Data Size:</div> {/* Clarified label */}
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
            <a href="#" className="text-sm text-neutral-600 flex items-center hover:text-primary">
                <i className="ri-information-line mr-1"></i>
                About {format} Format
            </a>
        </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div>
          {/* Manifest/Log Files section */}
          {manifestFiles && manifestFiles.length > 0 && (
            <>
             <h3 className="text-sm font-medium mb-2">
                {format === 'Iceberg' ? 'Manifest/Metadata Files (Current)' : 'Log Files (Current)'}
             </h3>
              <div className="border border-neutral-200 rounded-md overflow-hidden mb-4">
                 <div className="bg-neutral-50 p-2 border-b border-neutral-200 flex justify-between items-center">
                     <span className="text-xs font-medium">File Path</span>
                     <span className="text-xs font-medium">Size</span>
                 </div>
                 <div className="max-h-40 overflow-y-auto text-sm">
                     {manifestFiles.map((file, index) => (
                         <div key={index} className="p-2 border-b border-neutral-100 flex justify-between items-center hover:bg-neutral-50">
                             <span className="truncate w-4/5" title={file.file_path}>
                                { (format === 'Delta' && file.relative_path) ? file.relative_path : file.file_path }
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
          <h3 className="text-sm font-medium mb-2">Format Configuration</h3>
          <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200 overflow-hidden mb-4">
              <pre className="text-xs whitespace-pre-wrap break-words">
                  {formatConfig ? JSON.stringify(formatConfig, null, 2) : 'No configuration available'}
              </pre>
          </div>

          {/* Format Description */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
            <h3 className="text-sm font-medium mb-1 text-blue-700">About {format} Format</h3>
            <p className="text-sm text-blue-600">
                {getFormatDescription(format.toLowerCase() as any)}
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* --- Snapshot Selection Dropdown (Using Sequence Number) --- */}
          {snapshots.length > 0 && (
            <div className="mb-4">
              <label htmlFor="snapshot-select" className="block text-sm font-medium mb-1 text-neutral-700">
                Select Snapshot Version:
              </label>
              <select
                id="snapshot-select"
                // Use sequence number for the value, ensure it's a string or number consistent with state
                value={selectedSequenceNumber ?? ''}
                onChange={handleSnapshotChange}
                className="w-full p-2 border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary "
                disabled={loading || snapshots.length === 0} // Disable if loading or no snapshots
              >
                 {/* Add a default/placeholder option if desired */}
                 {/* <option value="" disabled={selectedSequenceNumber !== null}>-- Select Version --</option> */}
                {snapshots
                  // Optional: Sort snapshots by sequence number or timestamp if needed
                  // .sort((a, b) => (b['sequence-number'] ?? 0) - (a['sequence-number'] ?? 0)) // Example: descending sequence
                  .map((snap) => (
                  <option
                    // Use snapshot-id for the key for React's reconciliation, it's guaranteed unique
                    key={snap['snapshot-id']}
                    // Use sequence-number for the actual value passed to the handler
                    value={snap['sequence-number']}
                  >
                    Version: {snap['sequence-number']} ({formatTimestampMs(snap['timestamp-ms']) ?? 'No Timestamp'})
                    {/* Check if this snapshot's ID is the current one */}
                    {snap['snapshot-id'] == currentSnapshotId ? ' [Current]' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Snapshot Information section (Dynamically updated) */}
          <h3 className="text-sm font-medium mb-2">Snapshot Details</h3>
          {selectedSequenceNumber === null && !loading && <p className="text-sm text-neutral-500">Select a snapshot version to view details.</p>}
          {snapshotDisplayInfo && Object.keys(snapshotDisplayInfo).length > 0 ? (
            <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200 mb-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {Object.entries(snapshotDisplayInfo)
                  .filter(([, value]) => value !== null && value !== undefined && value !== '') // Filter out empty values
                   // Optional: Sort keys for consistent display order
                   .sort(([keyA], [keyB]) => {
                       const order = ['Snapshot ID', 'Sequence Number', 'Created At', 'Operation', 'Manifest List'];
                       const indexA = order.indexOf(keyA);
                       const indexB = order.indexOf(keyB);
                       if (indexA !== -1 && indexB !== -1) return indexA - indexB; // Sort by predefined order
                       if (indexA !== -1) return -1; // Known keys first
                       if (indexB !== -1) return 1;
                       return keyA.localeCompare(keyB); // Alphabetical for others
                    })
                  .map(([key, value]) => (
                    <React.Fragment key={key}>
                      <div className="font-medium text-neutral-600 truncate" title={key}>{key}:</div>
                      <div className="text-neutral-800 break-words" title={typeof value === 'object' ? JSON.stringify(value) : String(value)}>
                         {value === null || value === undefined
                            ? <span className="text-neutral-400">N/A</span>
                            : typeof value === 'boolean'
                            ? value ? 'True' : 'False'
                            : typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)}
                      </div>
                    </React.Fragment>
                  ))}
              </div>
              {/* Raw Summary Details */}
              {rawSummaryForDetails && (
                 <details className="mt-3 text-xs">
                     <summary className="cursor-pointer text-neutral-500 hover:text-neutral-700">Raw Snapshot Summary</summary>
                     <pre className="mt-1 overflow-x-auto bg-white p-2 rounded border border-neutral-200 text-[11px] leading-relaxed">
                         {JSON.stringify(rawSummaryForDetails, null, 2)}
                     </pre>
                 </details>
              )}
            </div>
          ) : selectedSequenceNumber !== null && !loading && (
             <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200 mb-4 text-sm text-neutral-500">
                 Details not available for the selected snapshot sequence ({selectedSequenceNumber}). Summary might be missing.
             </div>
          )}


          {/* Metadata Metrics section (Reflects CURRENT table state) */}
           {/* --- This section remains unchanged --- */}
           <h3 className="text-sm font-medium mb-2">Key Metrics (Current Table State)</h3>
            {metrics && Object.keys(metrics).length > 1 ? ( // Check length > 1 if metrics_note is always present
                <>
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(metrics)
                    .filter(([key]) => key !== 'metrics_note')
                    .filter(([key]) => { // Simplified filter: Remove raw if human exists
                        if (key.endsWith('_bytes') || key.endsWith('_mb')) {
                            const humanKey = `${key.replace('_bytes', '').replace('_mb', '')}_human`;
                            return !(humanKey in metrics);
                        }
                        return true;
                    })
                    .map(([key, value]) => {
                         const isHumanKey = key.endsWith('_human');
                         const baseKey = key.replace('_human', '').replace('_bytes', '').replace('_mb', '');
                         const humanValue = isHumanKey ? value : metrics[`${baseKey}_human`];
                         const rawValueBytes = metrics[`${baseKey}_bytes`];
                         const rawValueMb = metrics[`${baseKey}_mb`];
                         const rawValue = rawValueBytes ?? rawValueMb ?? (isHumanKey ? undefined : value); // Determine raw value for check

                         let displayValue: React.ReactNode;

                         // Use human-readable if available AND raw value isn't 0/null/undefined
                         if (humanValue !== undefined && rawValue !== 0 && rawValue != null) {
                              displayValue = humanValue;
                         }
                         // Format raw byte/MB values if no human key or if raw value is 0
                         else if (typeof value === 'number' && key.toLowerCase().includes('mb') && !isHumanKey) {
                              displayValue = formatBytes(value * 1000 * 1000);
                         } else if (typeof value === 'number' && (key.toLowerCase().includes('size') || key.toLowerCase().includes('bytes')) && !isHumanKey) {
                             displayValue = formatBytes(value);
                         }
                         // Handle non-size metrics that are 0
                         else if(value === 0 && !(key.toLowerCase().includes('size') || key.toLowerCase().includes('bytes') || key.toLowerCase().includes('mb'))){
                            displayValue = "0";
                         }
                         // Handle null/undefined or fall back to string
                          else if (value === null || value === undefined) {
                             displayValue = <span className="text-neutral-400">0</span>; // Or N/A
                         } else {
                              displayValue = value.toString();
                         }


                        return (
                            <div key={key} className="bg-neutral-50 p-3 rounded-md border border-neutral-200 flex flex-col justify-between">
                                <span className="text-xs text-neutral-500 mb-1">
                                    {formatKey(baseKey)} {/* Use baseKey for title */}
                                </span>
                                <span className="text-lg font-medium text-neutral-800">
                                    {displayValue}
                                </span>
                            </div>
                        );
                    })}
                </div>
                {metrics.metrics_note && (
                    <p className="text-xs text-neutral-500 mt-2 italic">{metrics.metrics_note}</p>
                )}
                </>
            ) : (
                <p className="text-sm text-neutral-500">No key metrics available.</p>
            )}
        </div>
      </div>
    </div>
  );
} 