import React from 'react';
import { formatDate } from '@/lib/formatUtils'; // Keep your import

export default function RecentVersionTimeline({ responseData }) { 
  
  const snapshots = responseData?.version_history?.snapshots_overview || [];
  const latestSnapshotId = responseData?.version_history?.current_snapshot_summary?.['snapshot-id'];

  if (!snapshots.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
        <div className="text-3xl text-neutral-400 mb-2">
          <i className="ri-history-line"></i>
        </div>
        <h3 className="text-lg font-medium text-neutral-700">No Version Information</h3>
        <p className="text-neutral-500 mt-1">
          Version history could not be found for this table.
        </p>
      </div>
    );
  }
  
  const displaySnapshots = snapshots.slice(-3); 
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
      {/* Simplified Header */}
      <div className="p-4 border-b border-neutral-200">
        <h2 className="text-base font-medium">Recent Version Timeline (Last 3)</h2>
      </div>

      {/* Timeline visualization */}
      <div className="p-4">
        <div className="relative">
          {/* Central timeline bar */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200" style={{marginLeft: '0.125rem'}}></div> {/* Adjusted position slightly */}
          
          {/* Version items container */}
          <div className="space-y-6 ml-10 relative pt-2 pb-4"> {/* Adjusted margin */}
            
            {/* Map through the latest 3 snapshots */}
            {displaySnapshots.reverse().map((snapshot) => {
                // Extract data for this version
                const versionId = snapshot['sequence-number'];
                const snapshotId = snapshot['snapshot-id'];
                const timestamp = snapshot['timestamp-ms'];
                const summary = snapshot.summary || {};
                const operation = summary.operation || 'Unknown';
                const isLatest = snapshotId === latestSnapshotId;

                // --- Generate a simple description of changes based on summary ---
                let changesDescription = [];
                const addedDeletes = parseInt(summary['added-position-deletes'] || '0', 10);
                const addedDataFiles = parseInt(summary['added-data-files'] || '0', 10);
                const addedDeleteFiles = parseInt(summary['added-delete-files'] || '0', 10);
                
                if (!isNaN(addedDeletes) && addedDeletes > 0) {
                    changesDescription.push(`Removed ${addedDeletes.toLocaleString()} rows`); 
                }
                 // You could add more based on other summary fields if needed
                // e.g., if (addedDataFiles > 0 || addedDeleteFiles > 0) { changesDescription.push(`Changed files`); }
                 
                const changeString = changesDescription.join(', ');
                // --- End of change description ---

                return (
                  // Container for a single version entry
                  <div className="relative" key={snapshotId}> {/* Use unique snapshotId as key */}
                    
                    {/* Left-side icon/version number bubble */}
                    <div className={`absolute -left-10 -top-0.5 w-8 h-8 rounded-full ${ // Adjusted positioning
                      isLatest 
                        ? 'bg-blue-500 text-white ring-4 ring-white' // Add ring for better visibility
                        : 'bg-neutral-200 text-neutral-500'
                    } flex items-center justify-center shadow-sm text-xs font-medium`}>
                      {isLatest ? (
                        <i className="ri-check-line text-base"></i> // Slightly larger icon
                      ) : (
                        versionId // Display sequence number for older versions
                      )}
                    </div>

                    {/* Right-side content box */}
                    <div className={`border rounded-lg p-3 ${
                      isLatest 
                        ? 'bg-blue-50 border-blue-200' // Highlight latest version
                        : 'bg-white border-neutral-200'
                    }`}>
                      {/* Header row: Version ID/Latest badge and Timestamp */}
                      <div className="flex justify-between items-start mb-1"> {/* Added margin-bottom */}
                        <div>
                          {isLatest && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium mr-2">Latest</span>
                          )}
                          <span className="text-sm font-semibold">Version {versionId}</span> 
                        </div>
                        <span className="text-xs text-neutral-500">{formatDate(timestamp)}</span> 
                      </div>

                      {/* Body row: Operation and Changes */}
                      <p className="text-sm text-neutral-700">
                        <span className="capitalize font-medium">{operation}</span>
                        {/* Display generated change description if it exists */}
                        {changeString && <span className="text-neutral-600"> - {changeString}</span>} 
                      </p>
                      
                      {/* Footer row: Removed buttons for simplicity */}
                      {/* <div className="mt-2 flex space-x-3"> ... </div> */}
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
