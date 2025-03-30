import React, { useState, useCallback, useMemo } from 'react';
import { formatBytes, formatLargeNumber } from '@/lib/formatUtils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector, CartesianGrid
} from 'recharts';
import { Button } from '@/components/ui/button';
// Assuming a simple Select component might be available or using native select
// If using shadcn/ui, you'd import Select components:
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Helper to render partition value safely
const renderPartitionValue = (value) => {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'object') {
    if (Object.keys(value).length === 0) {
        return '<unpartitioned>';
    }
    return JSON.stringify(value);
  }
  return String(value);
};

// Helper to create the display name for a partition
const getPartitionDisplayName = (partitionValues) => {
    // Handle the special case of a truly unpartitioned table
    if (partitionValues && partitionValues['_raw'] !== undefined && typeof partitionValues['_raw'] === 'object' && Object.keys(partitionValues['_raw']).length === 0) {
      return 'Table (Unpartitioned)';
    }
    // Build the string for partitioned tables
    return Object.entries(partitionValues)
        .map(([key, value]) => `${key}=${renderPartitionValue(value)}`)
        .join(', ');
};


export default function PartitionViewer({ metadata, isPreview = false, responseData }) {

  const partitionKeys = useMemo(() => {
    // Get partition keys from the spec if available
    if (responseData?.partition_spec?.fields?.length > 0) {
        return responseData.partition_spec.fields.map(field => field.name);
    }
    // Fallback: Infer from the first partition's values if spec is missing/empty
    if (responseData?.partition_explorer?.length > 0) {
        const firstPartitionValues = responseData.partition_explorer[0].partition_values;
        // Exclude the '_raw' key used for unpartitioned representation
        return Object.keys(firstPartitionValues).filter(key => key !== '_raw');
    }
    return []; // No keys found
  }, [responseData]);

  const isTableUnpartitioned = useMemo(() => partitionKeys.length === 0, [partitionKeys]);

  const partitions = useMemo(() => {
    if (!responseData || !responseData.partition_explorer) {
      return [];
    }

    return responseData.partition_explorer.map((p, index) => {
      const displayString = getPartitionDisplayName(p.partition_values);
      // Use a combination of the string and index for a more robust key
      const id = `${displayString.replace(/[^a-zA-Z0-9]/g, '_')}-${index}`;

      return {
        id: id, // Unique ID for keys/state
        partitionValues: p.partition_values, // Keep original values
        displayString: displayString,
        size: p.size_bytes,
        rowCount: p.gross_record_count,
        numFiles: p.num_data_files,
        // children: null // Assuming flat structure based on provided data
      };
    });
  }, [responseData]);

  console.log('Processed partitions: ', partitions); // Check the processed structure


  const [expandedPartitions, setExpandedPartitions] = useState({});

  const togglePartition = (partitionId) => {
    setExpandedPartitions(prev => ({
      ...prev,
      [partitionId]: !prev[partitionId]
    }));
  };

  const [activeView, setActiveView] = useState('tree');
  const [vizType, setVizType] = useState('bar'); // Default to bar
  // *** NEW STATE: Add state for the visualization sort metric ***
  const [vizSortMetric, setVizSortMetric] = useState('size'); // 'size', 'rowCount', or 'numFiles'

  // *** MODIFIED: chartData calculation now depends on vizSortMetric ***
  const chartData = useMemo(() => {
    const metricToSortBy = vizSortMetric; // 'size', 'rowCount', or 'numFiles'

    return partitions
      // Filter based on the *selected* metric having a valid number
      .filter(p => typeof p[metricToSortBy] === 'number' && p[metricToSortBy] >= 0)
      // Sort based on the selected metric
      .sort((a, b) => b[metricToSortBy] - a[metricToSortBy]) // Sort descending
      .slice(0, 20) // Limit to top 20
      .map(p => ({
        name: p.displayString, // Use displayString for the chart label
        // The primary 'value' for the chart depends on the selected metric
        value: p[metricToSortBy],
        // Keep all metrics available for the tooltip
        size: p.size || 0,
        rowCount: p.rowCount || 0,
        numFiles: p.numFiles || 0,
        // Formatted versions for convenience if needed elsewhere (tooltip uses raw)
        displaySize: formatBytes(p.size || 0),
        displayRowCount: formatLargeNumber(p.rowCount || 0),
        displayNumFiles: formatLargeNumber(p.numFiles || 0)
      }));
  }, [partitions, vizSortMetric]); // Add vizSortMetric to dependencies

  // *** MODIFIED: Custom tooltip to show all metrics, potentially highlighting the sorted one ***
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Contains name, value, size, rowCount, numFiles etc.
      return (
        <div className="bg-white p-2 border border-neutral-200 shadow-sm rounded-md text-xs">
          <p className="font-medium">{data.name}</p> {/* Already the displayString */}
          {/* Display all metrics, optionally highlighting the active sort metric */}
          <p className={`text-neutral-600 ${vizSortMetric === 'size' ? 'font-semibold text-blue-700' : ''}`}>
            Size: {formatBytes(data.size)}
          </p>
          {/* Only show rowCount and numFiles if they are > 0 */}
          {data.rowCount > 0 && (
            <p className={`text-neutral-600 ${vizSortMetric === 'rowCount' ? 'font-semibold text-blue-700' : ''}`}>
              Rows: {formatLargeNumber(data.rowCount)}
            </p>
          )}
          {data.numFiles > 0 && (
             <p className={`text-neutral-600 ${vizSortMetric === 'numFiles' ? 'font-semibold text-blue-700' : ''}`}>
               Files: {formatLargeNumber(data.numFiles)}
             </p>
          )}
        </div>
      );
    }
    return null;
  };


  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
    '#82ca9d', '#ffc658', '#ff8373', '#a4de6c', '#d0ed57'
  ];


  // --- No Partition Handling (remains the same) ---
  if (!partitions.length && (!responseData || !responseData.partition_explorer)) {
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

  const isEffectivelyUnpartitioned = isTableUnpartitioned && partitions.length === 1 && partitions[0].displayString === 'Table (Unpartitioned)';

  if (!isEffectivelyUnpartitioned && partitions.length === 0) {
    // This condition might be less likely now but kept for safety
    return (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
          {/* ... (same no partition info message) ... */}
           <div className="text-3xl text-neutral-400 mb-2">
             <i className="ri-table-line"></i>
           </div>
           <h3 className="text-lg font-medium text-neutral-700">No Partition Information</h3>
           <p className="text-neutral-500 mt-1">Partition information is unavailable for this table.</p>
        </div>
      );
  }


  // --- Preview Mode ---
  if (isPreview) {
    // Check if it's the single unpartitioned entry
     if (isEffectivelyUnpartitioned) {
       return (
         <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
           {/* ... (Unpartitioned Preview remains the same) ... */}
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
                    <span className="text-xs font-medium">Size / Rows / Files</span> {/* Updated header */}
                  </div>
                   <div className="p-2 border-b border-neutral-100 flex justify-between items-center"> {/* Use items-center */}
                      <span className="text-sm">{partitions[0].displayString}</span> {/* Should show "Table (Unpartitioned)" */}
                      <span className="text-xs text-neutral-500 text-right"> {/* Use text-right and text-xs */}
                          {partitions[0].size != null && <div>{formatBytes(partitions[0].size)}</div>}
                          {partitions[0].rowCount != null && <div>{formatLargeNumber(partitions[0].rowCount)} rows</div>}
                          {partitions[0].numFiles != null && <div>{formatLargeNumber(partitions[0].numFiles)} files</div>}
                          {(partitions[0].size == null && partitions[0].rowCount == null && partitions[0].numFiles == null) && 'Unknown'}
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
         <div className="flex justify-between items-center p-4 border-b border-neutral-200">
           <h2 className="text-base font-medium">Partition Layout</h2>
           <div className="flex space-x-2">
             <span className="text-sm text-neutral-600 flex items-center">
               <i className="ri-pie-chart-line mr-1"></i>
               {partitions.length} {partitions.length === 1 ? 'Partition' : 'Partitions'}
             </span>
           </div>
         </div>

        <div className="p-4">
          {/* Partition Strategy Info */}
          <div className="mb-4 p-3 bg-neutral-50 rounded-md">
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
              <span className="text-xs font-medium">Size / Rows / Files</span> {/* Updated header */}
            </div>
            <div className="max-h-32 overflow-y-auto">
              {partitions.slice(0, 3).map((partition) => (
                <div key={partition.id} className="p-2 border-b border-neutral-100 flex justify-between items-center"> {/* Use items-center */}
                  <span className="text-sm flex-1 mr-2 truncate" title={partition.displayString}>{partition.displayString}</span> {/* Added truncate */}
                  {/* Display Size/Rows/Files */}
                   <span className="text-xs text-neutral-500 text-right flex-shrink-0"> {/* Use text-right, text-xs, flex-shrink-0 */}
                     {partition.size != null && <div>{formatBytes(partition.size)}</div>}
                     {partition.rowCount != null && <div>{formatLargeNumber(partition.rowCount)} rows</div>}
                     {partition.numFiles != null && <div>{formatLargeNumber(partition.numFiles)} files</div>}
                     {(partition.size == null && partition.rowCount == null && partition.numFiles == null) && 'Unknown'}
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


  // --- Full View ---
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
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
             // Disable viz if table is unpartitioned or no numeric data for *any* metric
             disabled={isEffectivelyUnpartitioned || partitions.every(p => p.size == null && p.rowCount == null && p.numFiles == null)}
           >
             <i className="ri-pie-chart-line mr-1.5"></i>
             Visualize
           </Button>
         </div>
       </div>


      <div className="p-4">
        {/* Partition Strategy Info Box */}
        <div className="mb-4">
            <div className="p-3 bg-neutral-50 rounded-t-md border-b border-neutral-200">
              <h3 className="text-sm font-medium">Partition Strategy</h3>
            </div>
            <div className="p-4 bg-white rounded-b-md border border-t-0 border-neutral-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"> {/* Use grid for responsiveness */}
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-600 font-medium mb-1">Fields</p>
                  <p className="text-sm break-words">{partitionKeys.join(', ') || 'None'}</p> {/* Allow wrapping */}
                </div>
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="text-xs text-green-600 font-medium mb-1">Strategy</p>
                  <p className="text-sm">{partitionKeys.length > 0 ? 'Field partitioning' : 'No partitioning'}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-md">
                  <p className="text-xs text-purple-600 font-medium mb-1">Total Partitions</p>
                  <p className="text-sm font-medium">{formatLargeNumber(partitions.length)}</p>
                </div>
              </div>
               {/* Displaying partitions as chips - use displayString */}
               <div className="flex flex-wrap gap-1.5 mt-4 max-h-20 overflow-y-auto border-t pt-3"> {/* Smaller gap, border top */}
                {partitions.slice(0, 50).map((partition) => (
                  <div key={partition.id} className="px-2 py-0.5 bg-neutral-100 rounded text-xs border border-neutral-200" title={partition.displayString}>
                    {/* Truncate long display strings in chips */}
                    {partition.displayString.length > 50 ? partition.displayString.substring(0, 47) + '...' : partition.displayString}
                  </div>
                ))}
                 {partitions.length > 50 && <div className="text-xs text-neutral-500 self-center">... and {formatLargeNumber(partitions.length - 50)} more</div>}
              </div>
            </div>
        </div>


        {/* Conditional rendering based on activeView */}
        {activeView === 'tree' && (
          <div>
            <h3 className="text-sm font-medium mb-2">Partition Explorer</h3>
            <div className="border border-neutral-200 rounded-md overflow-hidden">
               <div className="bg-neutral-50 border-b border-neutral-200 p-2 flex items-center justify-between">
                    <div className="text-xs text-neutral-500">
                      Showing {partitions.length} {partitions.length === 1 ? 'partition' : 'partitions'}
                      {isEffectivelyUnpartitioned ? ' (representing the full table)' : ''}
                    </div>
                    {/* Maybe add expand/collapse all buttons here in future */}
               </div>

              {/* Partition Tree/List View */}
              <div className="max-h-96 overflow-y-auto">
                {partitions.map((partition) => {
                  const partitionId = partition.id;
                  const isExpanded = expandedPartitions[partitionId];
                  // For now, assume no nesting based on sample data
                  const hasChildren = false; // Update if hierarchy is introduced

                  return (
                    <React.Fragment key={partitionId}>
                      <div
                        className={`p-1.5 border-b border-neutral-100 ${isExpanded ? 'bg-blue-50' : 'hover:bg-neutral-50'} ${hasChildren ? 'cursor-pointer' : ''}`}
                        onClick={() => hasChildren && togglePartition(partitionId)}
                      >
                        <div className="flex items-center justify-between"> {/* Use justify-between */}
                           {/* Partition Name */}
                           <span className={`text-sm ml-1 ${isExpanded ? 'font-medium' : ''} mr-2 truncate`} title={partition.displayString}>
                             {partition.displayString}
                           </span>
                           {/* Display Size, Rows, Files */}
                           <span className="text-xs text-neutral-500 pr-2 space-x-3 flex-shrink-0"> {/* Added space-x, flex-shrink */}
                             {partition.size != null && (
                               <span title="Size">{formatBytes(partition.size)}</span>
                             )}
                              {partition.rowCount != null && (
                               <span title="Row Count">{formatLargeNumber(partition.rowCount)} rows</span>
                              )}
                              {partition.numFiles != null && (
                               <span title="Number of Files">{formatLargeNumber(partition.numFiles)} files</span>
                              )}
                           </span>
                        </div>
                      </div>
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
            {/* *** MODIFIED: Header includes Sort Metric Dropdown *** */}
            <div className="mb-3 flex flex-wrap gap-y-2 justify-between items-center"> {/* Added flex-wrap, gap-y */}
                <h3 className="text-sm font-medium mr-4">Partition Visualization</h3>
                 {/* Group Toggles and Dropdown */}
                <div className="flex items-center gap-x-3">
                    {/* Sort Metric Dropdown */}
                    <div className="flex items-center">
                      <label htmlFor="vizSortMetric" className="text-xs text-neutral-600 mr-1.5">Top 20 by:</label>
                      {/* Using native select for simplicity, replace with UI library component if needed */}
                      <select
                        id="vizSortMetric"
                        value={vizSortMetric}
                        onChange={(e) => setVizSortMetric(e.target.value)}
                        className="text-xs border border-neutral-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label="Sort partitions by"
                      >
                        <option value="size">Size</option>
                        <option value="rowCount">Row Count</option>
                        <option value="numFiles">Num Files</option>
                      </select>
                    </div>

                   {/* Viz Type Toggle */}
                   <div className="flex border border-neutral-200 rounded-md overflow-hidden">
                    <button
                      className={`px-3 py-1 text-xs ${vizType === 'bar' ? 'bg-blue-50 text-blue-600' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                      onClick={() => setVizType('bar')}
                      aria-label="Show as bar chart"
                    >
                      Bar
                    </button>
                    <button
                      className={`px-3 py-1 text-xs ${vizType === 'pie' ? 'bg-blue-50 text-blue-600' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                      onClick={() => setVizType('pie')}
                      aria-label="Show as pie chart"
                    >
                      Pie
                    </button>
                  </div>
                </div>
              </div>


            {/* Check if chart data exists for the selected metric */}
            {chartData.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 border border-dashed border-neutral-300 rounded-md bg-neutral-50 min-h-[150px] flex items-center justify-center">
                {isEffectivelyUnpartitioned
                  ? "Visualization is not applicable for unpartitioned tables."
                  : `No partitions found with valid ${vizSortMetric === 'rowCount' ? 'row count' : vizSortMetric === 'numFiles' ? 'file count' : 'size'} data for visualization.`}
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-md overflow-hidden p-3 bg-white">
                 {/* *** MODIFIED: Info text reflects current sort metric *** */}
                  <div className="text-xs text-neutral-500 mb-2">
                    Showing top {chartData.length} partitions by {vizSortMetric === 'rowCount' ? 'row count' : vizSortMetric === 'numFiles' ? 'number of files' : 'size'}
                  </div>

                 {/* Bar Chart */}
                 {vizType === 'bar' && (
                   <div className="h-96"> {/* Consider dynamic height based on items? */}
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart
                         data={chartData}
                         layout="vertical"
                         // Increased left margin for potentially longer partition names
                         margin={{ top: 5, right: 30, left: 180, bottom: 5 }}
                       >
                         <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                         {/* *** MODIFIED: XAxis formatter depends on metric *** */}
                         <XAxis
                           type="number"
                           tickFormatter={(value) => {
                              if (vizSortMetric === 'rowCount') return formatLargeNumber(value);
                              if (vizSortMetric === 'numFiles') return formatLargeNumber(value);
                              return formatBytes(value); // Default size
                           }}
                           stroke="#64748b"
                           fontSize={11}
                           tickLine={false}
                           axisLine={false}
                           domain={[0, 'auto']} // Ensure axis starts at 0
                         />
                         <YAxis
                           type="category"
                           dataKey="name" // Uses displayString from chartData
                           tick={{ fontSize: 11, fill: '#64748b', width: 170 }} // Give tick more width
                           width={180} // Increased width to prevent label cutoff
                           interval={0} // Show all labels
                           tickLine={false}
                           axisLine={false}
                           // Ellipsis for overflow, though width adjustment is preferred
                           // tickFormatter={(value) => value.length > 30 ? value.substring(0, 27) + '...' : value}
                         />
                         {/* Use the updated CustomTooltip */}
                         <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }}/>
                         <Bar
                           dataKey="value" // 'value' now holds the selected metric's value
                           // Name reflects the current metric
                           name={`Partition ${vizSortMetric === 'rowCount' ? 'Row Count' : vizSortMetric === 'numFiles' ? 'File Count' : 'Size'}`}
                           fill="#818cf8" // Consider dynamic fill based on metric?
                           radius={[0, 4, 4, 0]} // Rounded corners
                           barSize={chartData.length > 10 ? 12 : 16} // Adjust bar size based on number of items
                         />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                 )}


                 {/* Pie Chart */}
                 {vizType === 'pie' && (
                   <div className="h-96"> {/* Consider adjusting height if legend moves */}
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart margin={{ top: 0, right: 100, bottom: 20, left: 0 }}> {/* Adjust margin for legend */}
                         <Pie
                           data={chartData}
                           cx="50%"
                           cy="50%" // Center vertically
                           labelLine={{ stroke: '#64748b', strokeWidth: 0.5 }}
                           innerRadius="55%" // Create donut chart
                           outerRadius="80%" // Adjust outer radius
                           fill="#8884d8"
                           paddingAngle={1} // Small space between slices
                           dataKey="value" // Size/RowCount/NumFiles based on vizSortMetric
                           nameKey="name"   // displayString
                           // Adjust label rendering for clarity
                           label={({ percent, name }) => percent > 0.02 ? `${(percent * 100).toFixed(0)}%` : ''} // Show % only if > 2%
                           labelStyle={{ fill: '#475569', fontSize: 11 }}
                         >
                           {chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={1} />
                           ))}
                         </Pie>
                         {/* *** MODIFIED: Tooltip formatter depends on metric, uses CustomTooltip *** */}
                         <Tooltip content={<CustomTooltip />} />
                         {/* Adjusted Legend: vertical, aligned right */}
                          <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            iconSize={10}
                            wrapperStyle={{
                                fontSize: "11px",
                                // Allow legend to scroll if too many items
                                maxHeight: '340px', // Limit height
                                overflowY: 'auto',
                                paddingLeft: '10px' // Space from pie
                            }}
                            // Format legend text to prevent overflow
                            formatter={(value, entry, index) => {
                                const name = entry?.payload?.name ?? value;
                                return name.length > 25 ? name.substring(0, 22) + '...' : name;
                            }}
                         />
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