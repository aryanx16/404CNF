import React from 'react';
import { formatDate } from '@/lib/formatUtils'; // Keep your existing date formatting import

export default function RecentVersionTimeline({ responseData }) {

  // Check for necessary data structure
  const snapshots = responseData?.version_history?.snapshots_overview;
  const latestSnapshotSummary = responseData?.version_history?.current_snapshot_summary;
  const tableType = responseData?.table_type;

  // Handle cases where data is missing or not an array
  if (!Array.isArray(snapshots) || snapshots.length === 0 || !latestSnapshotSummary) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
        <div className="text-3xl text-neutral-400 mb-2">
          <i className="ri-history-line"></i>
        </div>
        <h3 className="text-lg font-medium text-neutral-700">No Version Information</h3>
        <p className="text-neutral-500 mt-1">
          Version history could not be found or is incomplete for this table.
        </p>
      </div>
    );
  }

  const latestSnapshotId = latestSnapshotSummary['snapshot-id'];
  // Take the first 3 snapshots (assuming they are ordered newest first)
  const displaySnapshots = snapshots.slice(0, 3);

  console.log("Displaying Snapshots:", displaySnapshots, "Latest ID:", latestSnapshotId);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <h2 className="text-base font-medium">Recent Version Timeline (Last 3)</h2>
      </div>

      {/* Timeline visualization */}
      <div className="p-4">
        <div className="relative">
          {/* Central timeline bar */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200" style={{marginLeft: '0.125rem'}}></div>

          {/* Version items container */}
          <div className="space-y-6 ml-10 relative pt-2 pb-4">

            {/* Map through the latest 3 snapshots */}
            {displaySnapshots.map((snapshot) => {
                // --- Extract Generic Data ---
                const snapshotId = snapshot['snapshot-id'];
                // Use sequence-number if available (Iceberg), otherwise snapshot-id (Delta/fallback)
                const versionId = snapshot['sequence-number'] ?? snapshot['snapshot-id'];
                const timestamp = snapshot['timestamp-ms'];
                const summary = snapshot.summary || {};
                const operation = (summary.operation || 'Unknown').toString(); // Ensure string
                const isLatest = snapshotId === latestSnapshotId;

                // --- Generate a more Generic Change Description ---
                let changes = [];
                const addedFiles = parseInt(summary['added-data-files'] || '0', 10);
                const removedFiles = parseInt(summary['removed-data-files'] || '0', 10);
                // Iceberg specific delete counts
                const addedDeleteFiles = parseInt(summary['added-delete-files'] || summary['added-position-delete-files'] || '0', 10);
                const addedPosDeletes = parseInt(summary['added-position-deletes'] || '0', 10);
                // Delta removed bytes can indicate replaced files
                const removedBytes = parseInt(summary['removed-files-size'] || '0', 10);

                if (!isNaN(addedFiles) && addedFiles > 0) {
                    changes.push(`Added ${addedFiles} data file${addedFiles > 1 ? 's' : ''}`);
                }
                if (!isNaN(removedFiles) && removedFiles > 0) {
                    changes.push(`Removed ${removedFiles} data file${removedFiles > 1 ? 's' : ''}`);
                } else if (operation.toLowerCase() === 'overwrite' && !isNaN(removedBytes) && removedBytes > 0 && removedFiles === 0) {
                    // Indicate overwrites even if removed-data-files isn't explicit in Delta summary
                    // This is an approximation based on removed bytes during overwrite
                    changes.push(`Replaced files`);
                }

                if (!isNaN(addedDeleteFiles) && addedDeleteFiles > 0) {
                    changes.push(`Added ${addedDeleteFiles} delete file${addedDeleteFiles > 1 ? 's' : ''}`);
                }
                if (!isNaN(addedPosDeletes) && addedPosDeletes > 0 && addedDeleteFiles === 0) {
                     // Only show row count if file count wasn't shown
                     changes.push(`Removed ${addedPosDeletes.toLocaleString()} rows`);
                }
                // You could add more heuristics based on operation type if needed

                const changeString = changes.join(', ');
                // --- End of change description ---

                return (
                  // Container for a single version entry
                  <div className="relative" key={snapshotId}> {/* Use unique snapshotId as key */}

                    {/* Left-side icon/version number bubble */}
                    <div className={`absolute -left-10 -top-0.5 w-8 h-8 rounded-full ${
                      isLatest
                        ? 'bg-blue-500 text-white ring-4 ring-white'
                        : 'bg-neutral-200 text-neutral-500'
                    } flex items-center justify-center shadow-sm text-xs font-medium`} title={`Snapshot ID: ${snapshotId}`}>
                      {isLatest ? (
                        <i className="ri-check-line text-base"></i>
                      ) : (
                        // Display the determined version ID
                        versionId
                      )}
                    </div>

                    {/* Right-side content box */}
                    <div className={`border rounded-lg p-3 ${
                      isLatest
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-neutral-200'
                    }`}>
                      {/* Header row: Version ID/Latest badge and Timestamp */}
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          {isLatest && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium mr-2">Latest</span>
                          )}
                          {/* Use the determined version ID */}
                          <span className="text-sm font-semibold">Version {versionId}</span>
                        </div>
                        <span className="text-xs text-neutral-500">{formatDate(timestamp)}</span>
                      </div>

                      {/* Body row: Operation and Changes */}
                      <p className="text-sm text-neutral-700">
                        {/* Display Operation */}
                        <span className="capitalize font-medium">{operation.replace(/_/g, ' ')}</span>
                        {/* Display generated change description if it exists */}
                        {changeString && <span className="text-neutral-600"> - {changeString}</span>}
                      </p>

                    </div>
                  </div>
                );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}