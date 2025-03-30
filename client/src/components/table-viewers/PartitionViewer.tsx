import React, { useState, useCallback, useMemo } from 'react';
import { formatBytes, formatLargeNumber } from '@/lib/formatUtils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector, CartesianGrid
} from 'recharts';
import { Button } from '@/components/ui/button';

// Helper to render partition value safely
const renderPartitionValue = (value) => {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'object') {
    // Handle empty object specifically for unpartitioned case representation
    if (Object.keys(value).length === 0) {
        return '<unpartitioned>';
    }
    // Otherwise, stringify for display (though complex objects might not be ideal here)
    return JSON.stringify(value);
  }
  return String(value); // Ensure it's a string
};

// Helper to create the display name for a partition
const getPartitionDisplayName = (name, value) => {
    const renderedValue = renderPartitionValue(value);
    // If it's the special unpartitioned case, just show the name (e.g., "Table")
    if (renderedValue === '<unpartitioned>') {
        // Maybe use a more descriptive name if the key indicates it's the whole table
        return name === '_raw' ? 'Table (Unpartitioned)' : `${name}=<unpartitioned>`;
    }
    // Otherwise, format as key=value
    return `${name}=${renderedValue}`;
}


export default function PartitionViewer({ metadata, isPreview = false, responseData }) {
  // --- ALL HOOKS MUST BE CALLED AT THE TOP LEVEL ---
  const { loading, error, data: dataPayload } = useRecoilValue(metadataAtom);
  const [expandedPartitions, setExpandedPartitions] = useState({});
  // MOVE THESE HOOKS UP!
  const [activeView, setActiveView] = useState('tree');
  const [vizType, setVizType] = useState('bar');

  // --- useMemo hooks are also hooks, keep them early ---
  const partitions = useMemo(() => {
    if (!responseData || !responseData.partition_explorer) {
      return [];
    }

    // Check if the table is *truly* unpartitioned based on spec
    const isTableUnpartitioned = !responseData.partition_spec?.fields?.length;

    return responseData.partition_explorer.map((p, index) => {
      const partitionKey = Object.keys(p.partition_values)[0];
      const partitionValue = p.partition_values[partitionKey];

      let displayName = partitionKey || 'unknown_key';
      let displayValue = partitionValue; // Keep original value for potential complex logic later

      // Adjust display name/value for the common unpartitioned case
      if (isTableUnpartitioned && partitionKey === '_raw' && typeof partitionValue === 'object' && Object.keys(partitionValue).length === 0) {
          displayName = 'Table'; // Use 'Table' as the name
          displayValue = {}; // Keep the original empty object to signify unpartitioned state internally if needed
          // Or potentially set displayValue to a specific string marker like '<unpartitioned_marker>'
      }

      return {
        id: `${displayName}-${index}`, // Unique ID for keys/state
        name: displayName,
        value: displayValue, // Store original value type, handle rendering separately
        // Pre-calculate display string for convenience
        displayString: getPartitionDisplayName(displayName, displayValue),
        size: p.size_bytes,
        rowCount: p.gross_record_count,
        numFiles: p.num_data_files,
        children: null // Assuming flat structure for now
      };
    });
  }, [responseData]);

  console.log('Processed partitions: ', partitions); // Check the processed structure

  const partitionKeys = useMemo(() => {
    if (!responseData || !responseData.partition_spec || !responseData.partition_spec.fields) {
      return [];
    }
    return responseData.partition_spec.fields.map(field => field.name);
  }, [responseData]);

  // Chart data calculation can also be moved up or kept here,
  // as long as it's before the final return and after its dependencies (partitions).
  const chartData = useMemo(() => {
    // Ensure partitions exist before processing
    if (!partitions || partitions.length === 0) return [];

    return partitions
      .filter(p => typeof p.size === 'number' && p.size > 0) // Ensure size is valid number > 0
      .map(p => ({
        name: `${p.name}=${p.value}`, // Use the combined key=value for uniqueness
        value: p.size, // Value for the chart (size)
        size: p.size,  // Keep original size for tooltip
        rowCount: p.rowCount || 0, // Keep row count for tooltip
        displaySize: formatBytes(p.size) // Pre-formatted size
      }))
      .sort((a, b) => b.size - a.size) // Sort descending by size
      .slice(0, 20); // Limit to top 20 for performance/clarity
  }, [partitions]);


  // --- Non-Hook Helper Functions ---
  const togglePartition = (partitionId) => {
    setExpandedPartitions(prev => ({
      ...prev,
      [partitionId]: !prev[partitionId]
    }));
  };

  // --- No Partition Handling (remains the same) ---
  if (!partitions.length && (!responseData || !responseData.partition_explorer)) {
     // Only show if partition_explorer is explicitly missing or empty
     // If partition_explorer has the single unpartitioned entry, we *do* want to show it.
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
        <div className="text-3xl text-neutral-400 mb-2">
          <i className="ri-table-line"></i>
        </div>
        <h3 className="text-lg font-medium text-neutral-700">No Partition Information</h3>
        <p className="text-neutral-500 mt-1">Partition information is unavailable for this table.</p>
      </div>
    );
  }

  // Handle the case where the *only* partition is the 'unpartitioned' one
  // and the spec confirms it's unpartitioned. Avoid showing the "No Partition Info" message.
  const isEffectivelyUnpartitioned = partitions.length === 1 && partitions[0].displayString === 'Table (Unpartitioned)' && partitionKeys.length === 0;

  if (!isEffectivelyUnpartitioned && partitions.length === 0) {
    // This condition might be less likely now with the above logic, but kept for safety
    return (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
          {/* ... No Partition Information message ... */}
        </div>
      );
  }


  // --- Preview Mode ---
  if (isPreview) {
    // Check if it's the single unpartitioned entry
     if (isEffectivelyUnpartitioned) {
       return (
         <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
           <div className="flex justify-between items-center p-4 border-b border-neutral-200">
             <h2 className="text-base font-medium">Partition Layout</h2>
             <span className="text-sm text-neutral-600 flex items-center">
               <i className="ri-forbid-line mr-1"></i> {/* Icon for unpartitioned */}
               Unpartitioned
             </span>
           </div>
           <div className="p-4">
             <div className="mb-4 p-3 bg-neutral-50 rounded-md">
               <h3 className="text-sm font-medium mb-2">Partition Strategy</h3>
               <div className="text-sm text-neutral-600">
                 <p><span className="font-medium">Fields:</span> None</p>
                 <p><span className="font-medium">Strategy:</span> No partitioning</p>
                 <p><span className="font-medium">Total Partitions:</span> 1 (represents the whole table)</p>
               </div>
             </div>
              <div className="border border-neutral-200 rounded-md overflow-hidden">
                 <div className="bg-neutral-50 p-2 border-b border-neutral-200 flex justify-between items-center">
                   <span className="text-xs font-medium">Segment</span>
                   <span className="text-xs font-medium">Size / Rows</span>
                 </div>
                  <div className="p-2 border-b border-neutral-100 flex justify-between">
                     <span className="text-sm">{partitions[0].displayString}</span> {/* Should show "Table (Unpartitioned)" */}
                     <span className="text-sm text-neutral-500">
                         {partitions[0].size != null ? formatBytes(partitions[0].size) : partitions[0].rowCount != null ? `${formatLargeNumber(partitions[0].rowCount)} rows` : 'Unknown'}
                     </span>
                   </div>
              </div>
           </div>
         </div>
       );
     }

    // Original preview logic for potentially partitioned tables
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
        {/* ... (Header remains the same) ... */}
         <div className="flex justify-between items-center p-4 border-b border-neutral-200">
           <h2 className="text-base font-medium">Partition Layout</h2>
           <div className="flex space-x-2">
             <span className="text-sm text-neutral-600 flex items-center">
               <i className="ri-pie-chart-line mr-1"></i>
               {partitions.length} Partitions
             </span>
           </div>
         </div>

        <div className="p-4">
          {/* Partition Strategy Info */}
          <div className="mb-4 p-3 bg-neutral-50 rounded-md">
             {/* ... (Strategy Info remains the same, using partitionKeys) ... */}
              <h3 className="text-sm font-medium mb-2">Partition Strategy</h3>
              <div className="text-sm text-neutral-600">
                <p><span className="font-medium">Fields:</span> {partitionKeys.join(', ') || 'None'}</p>
                <p><span className="font-medium">Strategy:</span> {partitionKeys.length > 0 ? 'Field partitioning' : 'No partitioning'}</p>
                <p><span className="font-medium">Total Partitions:</span> {partitions.length}</p>
              </div>
          </div>

          {/* Preview of partitions */}
          <div className="border border-neutral-200 rounded-md overflow-hidden">
            <div className="bg-neutral-50 p-2 border-b border-neutral-200 flex justify-between items-center">
              <span className="text-xs font-medium">Partition</span>
              <span className="text-xs font-medium">Size / Rows</span>
            </div>
            <div className="max-h-32 overflow-y-auto">
              {/* Use the pre-calculated displayString */}
              {partitions.slice(0, 3).map((partition) => (
                <div key={partition.id} className="p-2 border-b border-neutral-100 flex justify-between">
                  {/* Use displayString which is safe */}
                  <span className="text-sm">{partition.displayString}</span>
                  <span className="text-sm text-neutral-500">
                    {partition.size != null ? formatBytes(partition.size) : partition.rowCount != null ? `${formatLargeNumber(partition.rowCount)} rows` : 'Unknown'}
                  </span>
                </div>
              ))}
              {partitions.length > 3 && (
                <div className="p-2 text-center text-sm text-primary">
                  {partitions.length - 3} more partitions...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }


  // --- Full View Logic ---
  const [activeView, setActiveView] = useState('tree');
  const [vizType, setVizType] = useState('bar'); // Default to bar

  const chartData = useMemo(() => {
    return partitions
      .filter(p => typeof p.size === 'number') // Ensure size is valid
      .map(p => ({
        // Use displayString for the chart label name
        name: p.displayString,
        value: p.size || 0, // Use size for the chart value
        size: p.size || 0, // Keep raw size for tooltip
        rowCount: p.rowCount || 0, // Keep row count for tooltip
        displaySize: formatBytes(p.size || 0)
      }))
      .sort((a, b) => b.size - a.size) // Sort by size descending
      .slice(0, 20); // Limit to top 20 for performance/clarity
  }, [partitions]);

  // Custom tooltip for charts (remains the same, uses data derived above)
  const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-white p-2 border border-neutral-200 shadow-sm rounded-md text-xs">
            <p className="font-medium">{data.name}</p> {/* Already the displayString */}
            <p className="text-neutral-600">Size: {formatBytes(data.size)}</p>
            {data.rowCount > 0 && (
              <p className="text-neutral-600">Rows: {formatLargeNumber(data.rowCount)}</p>
            )}
          </div>
        );
      }
      return null;
    };


  const COLORS = [ /* ... (colors remain the same) ... */ ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
      {/* Header with view toggle buttons (remains the same) */}
       <div className="flex justify-between items-center p-4 border-b border-neutral-200">
         <h2 className="text-base font-medium">Partition Layout</h2>
         <div className="flex space-x-2">
           <Button
             variant={activeView === 'tree' ? 'default' : 'outline'}
             size="sm"
             onClick={() => setActiveView('tree')}
             className="flex items-center"
           >
             <i className="ri-list-check mr-1.5"></i>
             Table View
           </Button>
           <Button
             variant={activeView === 'visualization' ? 'default' : 'outline'}
             size="sm"
             onClick={() => setActiveView('visualization')}
             className="flex items-center"
             // Disable viz if no chart data (e.g., unpartitioned or no size info)
             disabled={chartData.length === 0}
           >
             <i className="ri-pie-chart-line mr-1.5"></i>
             Visualize
           </Button>
         </div>
       </div>


      <div className="p-4">
        {/* Partition Strategy Info Box (remains the same) */}
        <div className="mb-4">
           {/* ... (Strategy Info Box content remains the same, uses partitionKeys) ... */}
            <div className="p-3 bg-neutral-50 rounded-t-md border-b border-neutral-200">
              <h3 className="text-sm font-medium">Partition Strategy</h3>
            </div>
            <div className="p-4 bg-white rounded-b-md border border-t-0 border-neutral-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 p-3 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-600 font-medium mb-1">Fields</p>
                  <p className="text-sm">{partitionKeys.join(', ') || 'None'}</p>
                </div>
                <div className="flex-1 p-3 bg-green-50 rounded-md">
                  <p className="text-xs text-green-600 font-medium mb-1">Strategy</p>
                  <p className="text-sm">{partitionKeys.length > 0 ? 'Field partitioning' : 'No partitioning'}</p>
                </div>
                <div className="flex-1 p-3 bg-purple-50 rounded-md">
                  <p className="text-xs text-purple-600 font-medium mb-1">Total Partitions</p>
                  <p className="text-sm font-medium">{partitions.length}</p>
                </div>
              </div>
               {/* Displaying partitions as chips - use displayString */}
               <div className="flex flex-wrap gap-2 mt-4 max-h-20 overflow-y-auto">
                {partitions.slice(0, 50).map((partition) => (
                  <div key={partition.id} className="px-2 py-1 bg-neutral-100 rounded text-xs">
                    {partition.displayString} {/* Use safe display string */}
                  </div>
                ))}
                 {partitions.length > 50 && <div className="text-xs text-neutral-500">... and {partitions.length - 50} more</div>}
              </div>

            </div>
        </div>


        {/* Conditional rendering based on activeView */}
        {activeView === 'tree' && (
          <div>
            <h3 className="text-sm font-medium mb-2">Partition Explorer</h3>
            <div className="border border-neutral-200 rounded-md overflow-hidden">
              {/* Toolbar (remains the same) */}
               <div className="bg-neutral-50 border-b border-neutral-200 p-2 flex items-center justify-between">
                   {/* ... Toolbar buttons ... */}
                    <div className="text-xs text-neutral-500">
                      Showing {partitions.length} {partitions.length === 1 ? 'partition' : 'partitions'}
                      {isEffectivelyUnpartitioned ? ' (representing the full table)' : ''}
                    </div>
               </div>


              {/* Partition Tree/List View */}
              <div className="max-h-96 overflow-y-auto">
                {partitions.map((partition) => {
                  const partitionId = partition.id; // Use pre-generated ID
                  const isExpanded = expandedPartitions[partitionId];
                  // For now, assume no nesting based on sample data
                  const hasChildren = false;

                  return (
                    <React.Fragment key={partitionId}>
                      <div
                        className={`p-1.5 border-b border-neutral-100 ${isExpanded ? 'bg-blue-50' : 'hover:bg-blue-50'} ${hasChildren ? 'cursor-pointer' : ''}`}
                        onClick={() => hasChildren && togglePartition(partitionId)}
                      >
                        <div className="flex items-center">
                           {/* Use safe displayString */}
                          <span className={`text-sm ml-1 ${isExpanded ? 'font-medium' : ''}`}>
                             {partition.displayString}
                          </span>
                          {/* Display size or row count */}
                          <span className="ml-auto text-xs text-neutral-500 pr-2"> {/* Added padding */}
                             {partition.size != null
                              ? formatBytes(partition.size)
                              : partition.rowCount != null
                                ? `${formatLargeNumber(partition.rowCount)} rows`
                                : ''
                            }
                          </span>
                        </div>
                      </div>
                      {/* Potential rendering of children if hasChildren were true */}
                      {/* {isExpanded && hasChildren && ( ... child rendering ... )} */}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Visualization View */}
        {activeView === 'visualization' && (
          <div>
            {/* Header with Viz Type Toggle (remains the same) */}
            <div className="mb-3 flex justify-between items-center">
                <h3 className="text-sm font-medium">Partition Visualization</h3>
                <div className="flex border border-neutral-200 rounded-md overflow-hidden">
                  <button
                    className={`px-3 py-1.5 text-xs ${vizType === 'bar' ? 'bg-blue-50 text-blue-600' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                    onClick={() => setVizType('bar')}
                  >
                    Bar
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs ${vizType === 'pie' ? 'bg-blue-50 text-blue-600' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                    onClick={() => setVizType('pie')}
                  >
                    Pie
                  </button>
                </div>
              </div>


            {/* Check if chart data exists */}
            {chartData.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 border border-neutral-200 rounded-md bg-neutral-50">
                {isEffectivelyUnpartitioned
                  ? "Visualization is not applicable for unpartitioned tables."
                  : "No size data available for visualization or partitions lack size info."}
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-md overflow-hidden p-3 bg-white">
                 {/* Info text (remains the same) */}
                  <div className="text-xs text-neutral-500 mb-2">
                    Showing top {chartData.length} partitions by size
                  </div>


                 {/* Bar Chart */}
                 {vizType === 'bar' && (
                   <div className="h-96">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart
                         data={chartData}
                         layout="vertical"
                         margin={{ top: 5, right: 30, left: 150, bottom: 5 }} // Adjust left margin if labels are long
                       >
                         <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                         <XAxis
                           type="number"
                           tickFormatter={(value) => formatBytes(value)}
                           stroke="#64748b"
                           fontSize={11}
                           tickLine={false}
                           axisLine={false}
                         />
                         <YAxis
                           type="category"
                           dataKey="name" // Uses displayString from chartData
                           tick={{ fontSize: 11, fill: '#64748b' }}
                           width={150} // Adjust as needed
                           interval={0}
                           tickLine={false}
                           axisLine={false}
                         />
                         <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }}/>
                         <Bar
                           dataKey="value" // 'value' in chartData holds the size
                           name="Partition Size"
                           fill="#818cf8"
                           radius={[0, 4, 4, 0]}
                           barSize={16}
                         />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                 )}


                 {/* Pie Chart */}
                 {vizType === 'pie' && (
                   <div className="h-96">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={chartData}
                           cx="50%"
                           cy="50%"
                           labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                           innerRadius={80}
                           outerRadius={140}
                           fill="#8884d8"
                           dataKey="value" // Size
                           nameKey="name"   // displayString
                           label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                           labelStyle={{ fill: '#475569', fontSize: 12 }}
                         >
                           {chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={1} />
                           ))}
                         </Pie>
                         <Tooltip formatter={(value) => formatBytes(value)} content={<CustomTooltip />} />
                         {/* Adjust legend position if needed */}
                         <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} layout="vertical" align="right" verticalAlign="middle"/>
                       </PieChart>
                     </ResponsiveContainer>
                   </div>
                 )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
);
}