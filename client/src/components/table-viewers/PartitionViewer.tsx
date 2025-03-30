import React, { useState, useCallback, useMemo } from 'react';
import { formatBytes, formatLargeNumber } from '@/lib/formatUtils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector, CartesianGrid
} from 'recharts';
import { Button } from '@/components/ui/button';
import { useRecoilValue } from 'recoil';
import { metadataAtom } from '@/atoms/metadataAtom';
import { FilesViewerSkeleton } from '../skeleton/FilesViewerSkeleton';


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
    // Map partition data (ensure robustness)
    return responseData.partition_explorer.map((p, index) => { // Added index for potential key fallback
      const partitionKey = p.partition_values ? Object.keys(p.partition_values)[0] : `unknown_key_${index}`;
      const partitionValue = p.partition_values ? p.partition_values[partitionKey] : `unknown_value_${index}`;
      return {
        // Create a more robust id
        id: `${partitionKey}=${partitionValue}-${index}`,
        name: partitionKey || 'unknown_key',
        value: partitionValue || 'unknown_value',
        size: p.size_bytes,
        rowCount: p.gross_record_count,
        numFiles: p.num_data_files,
        children: null // Assuming no nested structure for now
      };
    });
  }, [responseData]);

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

  // --- Custom Tooltip Component (defined inside or outside, doesn't matter for the error) ---
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-neutral-200 shadow-sm rounded-md text-xs">
          <p className="font-medium">{data.name}</p> {/* Partition Key=Value */}
          <p className="text-neutral-600">Size: {formatBytes(data.size)}</p>
          {data.rowCount > 0 && (
            <p className="text-neutral-600">Rows: {formatLargeNumber(data.rowCount)}</p>
          )}
        </div>
      );
    }
    return null;
  };

  // --- CONDITIONAL RETURNS (Now safe, as hooks are called before this) ---
  if (loading && !dataPayload) {
    // Consider passing isPreview to skeleton if its appearance should change
    return <FilesViewerSkeleton /* isPreview={isPreview} */ />;
  }

  if (!partitions.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
        {/* ... No Partition Information JSX ... */}
         <div className="text-3xl text-neutral-400 mb-2">
          <i className="ri-table-line"></i>
        </div>
        <h3 className="text-lg font-medium text-neutral-700">No Partition Information</h3>
        <p className="text-neutral-500 mt-1">This table does not appear to be partitioned, or partition information is unavailable.</p>
      </div>
    );
  }

  // Handle Preview Mode
  if (isPreview) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
         {/* ... Preview JSX using partitionKeys and partitions ... */}
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
            <div className="mb-4 p-3 bg-neutral-50 rounded-md">
                <h3 className="text-sm font-medium mb-2">Partition Strategy</h3>
                <div className="text-sm text-neutral-600">
                    <p><span className="font-medium">Fields:</span> {partitionKeys.join(', ') || 'None'}</p>
                    <p><span className="font-medium">Strategy:</span> {partitionKeys.length > 0 ? 'Field partitioning' : 'No partitioning'}</p>
                    <p><span className="font-medium">Total Partitions:</span> {partitions.length}</p>
                </div>
            </div>
            <div className="border border-neutral-200 rounded-md overflow-hidden">
                <div className="bg-neutral-50 p-2 border-b border-neutral-200 flex justify-between items-center">
                    <span className="text-xs font-medium">Partition</span>
                    <span className="text-xs font-medium">Size / Rows</span>
                </div>
                <div className="max-h-32 overflow-y-auto">
                    {partitions.slice(0, 3).map((partition) => ( // Use partition.id for key
                        <div key={partition.id} className="p-2 border-b border-neutral-100 flex justify-between">
                            <span className="text-sm truncate pr-2" title={`${partition.name}=${partition.value}`}>{partition.name}={partition.value}</span>
                            <span className="text-sm text-neutral-500 flex-shrink-0">
                                {partition.size != null ? formatBytes(partition.size) : partition.rowCount != null ? `${formatLargeNumber(partition.rowCount)} rows` : 'N/A'}
                            </span>
                        </div>
                    ))}
                    {partitions.length > 3 && (
                        <div className="p-2 text-center text-sm text-primary">
                            ... {partitions.length - 3} more partitions
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- FULL RENDER LOGIC (Only happens if not loading, has partitions, and not preview) ---
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
    '#82ca9d', '#ffc658', '#ff8373', '#a4de6c', '#d0ed57'
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
        {/* Header with view toggle buttons */}
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
                >
                    <i className="ri-pie-chart-line mr-1.5"></i>
                    Visualize
                </Button>
            </div>
        </div>

        <div className="p-4">
            {/* Partition Strategy Info Box */}
            <div className="mb-4">
                 {/* ... Strategy Box JSX using partitionKeys and partitions ... */}
                 <div className="p-3 bg-neutral-50 rounded-t-md border-b border-neutral-200">
                    <h3 className="text-sm font-medium">Partition Strategy</h3>
                </div>
                <div className="p-4 bg-white rounded-b-md border border-t-0 border-neutral-200">
                    <div className="grid grid-cols-3 gap-4 mb-4"> {/* Changed to grid for better alignment */}
                        <div className="p-3 bg-blue-50 rounded-md">
                            <p className="text-xs text-blue-600 font-medium mb-1">Fields</p>
                            <p className="text-sm truncate" title={partitionKeys.join(', ') || 'None'}>{partitionKeys.join(', ') || 'None'}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-md">
                            <p className="text-xs text-green-600 font-medium mb-1">Strategy</p>
                            <p className="text-sm">{partitionKeys.length > 0 ? 'Field partitioning' : 'No partitioning'}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-md">
                            <p className="text-xs text-purple-600 font-medium mb-1">Total Partitions</p>
                            <p className="text-sm font-medium">{formatLargeNumber(partitions.length)}</p> {/* Formatted count */}
                        </div>
                    </div>
                     {/* Optional Chips display */}
                    <details className="text-xs">
                        <summary className="cursor-pointer text-neutral-600 hover:text-primary">Show Partition Values ({Math.min(partitions.length, 50)}{partitions.length > 50 ? '+' : ''})</summary>
                        <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto p-2 border rounded bg-neutral-50">
                            {partitions.slice(0, 50).map((partition) => (
                                <div key={partition.id} className="px-2 py-0.5 bg-neutral-200 text-neutral-700 rounded text-xs whitespace-nowrap">
                                    {partition.name}={partition.value}
                                </div>
                            ))}
                            {partitions.length > 50 && <div className="text-xs text-neutral-500 italic self-center">... and {partitions.length - 50} more</div>}
                        </div>
                    </details>
                </div>
            </div>

            {/* Conditional rendering based on activeView */}
            {activeView === 'tree' && (
                <div>
                    {/* ... Partition Tree/List View JSX ... */}
                    <h3 className="text-sm font-medium mb-2">Partition Explorer</h3>
                    <div className="border border-neutral-200 rounded-md overflow-hidden">
                        {/* Toolbar */}
                        <div className="bg-neutral-50 border-b border-neutral-200 p-2 flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                                {/* Add actual functionality later */}
                                <button className="p-1 rounded hover:bg-neutral-200 text-neutral-700 disabled:text-neutral-400 disabled:cursor-not-allowed" title="Refresh (Not Implemented)" disabled>
                                    <i className="ri-refresh-line"></i>
                                </button>
                                <button className="p-1 rounded hover:bg-neutral-200 text-neutral-700 disabled:text-neutral-400 disabled:cursor-not-allowed" title="Search (Not Implemented)" disabled>
                                    <i className="ri-search-line"></i>
                                </button>
                                <button className="p-1 rounded hover:bg-neutral-200 text-neutral-700 disabled:text-neutral-400 disabled:cursor-not-allowed" title="Filter (Not Implemented)" disabled>
                                    <i className="ri-filter-line"></i>
                                </button>
                            </div>
                            <div className="text-xs text-neutral-500">
                                Showing {partitions.length} partitions
                            </div>
                        </div>

                        {/* Partition Tree/List View */}
                        <div className="max-h-96 overflow-y-auto divide-y divide-neutral-100">
                             {partitions.map((partition) => {
                                // Use the generated ID
                                const partitionId = partition.id;
                                const isExpanded = expandedPartitions[partitionId];
                                // Simplified: No real children data for now
                                const hasChildren = false;

                                return (
                                    <React.Fragment key={partitionId}>
                                        <div
                                            className={`p-2 ${isExpanded ? 'bg-blue-50' : 'hover:bg-neutral-50'} ${hasChildren ? 'cursor-pointer' : ''}`}
                                            onClick={() => hasChildren && togglePartition(partitionId)} // Only allow click if hasChildren
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm ${isExpanded ? 'font-medium text-blue-700' : 'text-neutral-800'} truncate pr-2`} title={`${partition.name}=${partition.value}`}>
                                                  {/* Maybe add indent/icon later if hierarchy exists */}
                                                  {partition.name}={partition.value}
                                                </span>
                                                <span className="text-xs text-neutral-500 flex-shrink-0">
                                                    {partition.numFiles != null ? `${partition.numFiles} files / ` : ''}
                                                    {partition.size != null
                                                        ? formatBytes(partition.size)
                                                        : partition.rowCount != null
                                                        ? `${formatLargeNumber(partition.rowCount)} rows`
                                                        : 'N/A'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                        {/* Placeholder for potential child rendering */}
                                        {/* {isExpanded && hasChildren && (
                                            <div className="pl-4 border-l border-blue-200">
                                                 Render child partitions here
                                            </div>
                                        )} */}
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
                    {/* ... Visualization JSX using chartData ... */}
                    <div className="mb-3 flex justify-between items-center">
                        <h3 className="text-sm font-medium">Partition Visualization <span className="text-xs text-neutral-500 font-normal">(by Size)</span></h3>
                        <div className="flex border border-neutral-200 rounded-md overflow-hidden">
                            <button
                                className={`px-3 py-1 text-xs ${vizType === 'bar' ? 'bg-primary text-primary-foreground font-medium' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                                onClick={() => setVizType('bar')}
                            >
                                Bar
                            </button>
                            <button
                                className={`px-3 py-1 text-xs ${vizType === 'pie' ? 'bg-primary text-primary-foreground font-medium' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                                onClick={() => setVizType('pie')}
                            >
                                Pie
                            </button>
                        </div>
                    </div>
                    {chartData.length === 0 ? (
                        <div className="p-4 text-center text-neutral-500 border rounded-md bg-neutral-50">
                            No valid size data available for visualization. Partitions might lack size information or all sizes might be zero.
                        </div>
                    ) : (
                         <div className="border border-neutral-200 rounded-md overflow-hidden p-3 bg-white">
                             <div className="text-xs text-neutral-500 mb-2 text-center">
                                 Showing top {chartData.length} partitions by size
                             </div>
                             {/* Bar Chart */}
                            {vizType === 'bar' && (
                                <div className="h-96 w-full"> {/* Ensure container has dimensions */}
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={chartData}
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 5, bottom: 5 }} // Adjusted left margin
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false}/> {/* Vertical grid lines */}
                                            <XAxis
                                                type="number"
                                                tickFormatter={(value) => formatBytes(value)}
                                                stroke="#94a3b8"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                domain={['auto', 'auto']}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                tick={{ fontSize: 11, fill: '#64748b' }}
                                                width={160} // Adjust width as needed for labels
                                                interval={0}
                                                tickLine={false}
                                                axisLine={false}
                                                scale="point" // Helps distribute category ticks
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }}/>
                                            <Bar
                                                dataKey="value"
                                                name="Partition Size"
                                                fill="#6366f1" // Indigo color
                                                background={{ fill: '#eef2ff', radius: 4 }} // Optional background
                                                radius={[0, 4, 4, 0]}
                                                barSize={chartData.length > 10 ? 12 : 16} // Adjust bar size based on count
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                             {/* Pie Chart */}
                            {vizType === 'pie' && (
                                <div className="h-96 w-full"> {/* Ensure container has dimensions */}
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={{ stroke: '#cbd5e1' }}
                                                innerRadius="55%" // Make it a doughnut
                                                outerRadius="80%"
                                                fill="#8884d8"
                                                paddingAngle={1}
                                                dataKey="value"
                                                nameKey="name"
                                                label={({ percent, name }) => percent > 0.03 ? `${(percent * 100).toFixed(0)}%` : ''} // Show label for >3% slices
                                                labelStyle={{ fill: '#475569', fontSize: 12 }}
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={1} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend
                                                layout="vertical"
                                                align="right"
                                                verticalAlign="middle"
                                                iconSize={10}
                                                wrapperStyle={{ fontSize: "11px", paddingLeft: "10px", maxHeight: '300px', overflowY: 'auto' }} // Add scroll if needed
                                                formatter={(value, entry) => <span className="text-neutral-600 truncate" title={value}>{value}</span>} // Truncate legend text
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