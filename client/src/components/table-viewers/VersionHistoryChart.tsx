import React from 'react';
import { 
    ResponsiveContainer, 
    BarChart, 
    CartesianGrid, 
    XAxis, 
    YAxis, 
    Tooltip, 
    Bar 
} from 'recharts'; // Make sure you have 'recharts' installed

// Assuming responseData is passed as a prop
interface VersionHistoryChartProps {
  responseData: any; // Ideally, define a more specific type for your responseData structure
}

export default function VersionHistoryChart({ responseData }: VersionHistoryChartProps) {
  // Extract snapshot history from responseData
  const history = responseData?.version_history?.snapshots_overview;
  let chartData = [];

  // Process history if it exists and is an array
  if (history && Array.isArray(history) && history.length > 0) {
      chartData = history.map(snapshot => {
          const summary = snapshot?.summary || {};
          
          // Get added file counts, default to 0 if missing or not a number
          const addedDataFiles = parseInt(summary['added-data-files'] || '0', 10);
          const addedDeleteFiles = parseInt(summary['added-delete-files'] || '0', 10);
          
          // Sum data and delete files added in this snapshot
          const totalChanges = (isNaN(addedDataFiles) ? 0 : addedDataFiles) + 
                               (isNaN(addedDeleteFiles) ? 0 : addedDeleteFiles);
          
          const sequenceNumber = snapshot['sequence-number'] || snapshot['snapshot-id'];

          // Return the object format expected by the chart
          return {
              version: `v${sequenceNumber}`, // Label for X-axis (e.g., v1, v2)
              changes: totalChanges,         // Value for Y-axis (file changes)
              // Add extra info for potential use in custom tooltip
              snapshotId: snapshot['snapshot-id'],
              operation: summary['operation'],
              timestamp: snapshot['timestamp-ms']
          };
      });
      
      // Optional: Sort by version number if the API doesn't guarantee order
      // chartData.sort((a, b) => parseInt(a.version.substring(1), 10) - parseInt(b.version.substring(1), 10));
  }

  // Custom Tooltip Component for richer info on hover
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Access the full data point for this bar
      return (
        <div className="bg-white border border-neutral-200 rounded shadow-sm p-2 text-xs">
          <p className="font-semibold">{`Version: ${label}`}</p>
          <p>{`File Changes: ${data.changes}`}</p>
          <p>{`Operation: ${data.operation || 'N/A'}`}</p>
          {/* Show first 8 chars of snapshot ID */}
          <p>{`Snapshot ID: ${data.snapshotId?.toString().substring(0, 8)}...`}</p> 
          <p>{`Timestamp: ${new Date(data.timestamp).toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
      <h3 className="text-sm font-medium mb-4">Version History</h3>
      
      {/* Render chart only if there is data */}
      {chartData.length > 0 ? (
        // Ensure the container has a defined height for ResponsiveContainer to work
        <div className="h-64"> 
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              // Use the dynamically generated data
              data={chartData} 
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} /> 
              <XAxis 
                  dataKey="version"   // Key for x-axis labels
                  stroke="#64748b" 
                  tick={{ fontSize: 12 }} // Adjust tick font size if needed
              />
              <YAxis 
                  stroke="#64748b" 
                  tick={{ fontSize: 12 }}
                  allowDecimals={false} // File counts should be integers
              />
              <Tooltip 
                // Use the custom tooltip component
                content={<CustomTooltip />} 
                cursor={{ fill: 'rgba(200, 200, 200, 0.2)' }} // Optional: visual feedback on hover
              />
              <Bar 
                dataKey="changes" // Key for y-axis values (bar height)
                fill="#3B82F6"    // Bar color
                name="File Changes" // Name shown in tooltip (if not using custom)
                radius={[4, 4, 0, 0]} // Rounded top corners
                // barSize={30} // Optional: fixed bar width
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        // Display a message if no history data is available
        <div className="text-center text-neutral-500 py-8">
            No version history data found.
        </div>
      )}
    </div>
  );
}