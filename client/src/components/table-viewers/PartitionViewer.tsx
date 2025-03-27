import React, { useState, useCallback, useMemo } from 'react';
import { formatBytes, formatLargeNumber } from '@/lib/formatUtils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector, CartesianGrid
} from 'recharts';
import { Button } from '@/components/ui/button';


export default function PartitionViewer({ metadata, isPreview = false, responseData }) {
  const partitions = useMemo(() => {
    if (!responseData || !responseData.partition_explorer) {
      return [];
    }
    return responseData.partition_explorer.map(p => {
      const partitionKey = Object.keys(p.partition_values)[0];
      const partitionValue = p.partition_values[partitionKey];
      return {
        name: partitionKey || 'unknown_key',
        value: partitionValue || 'unknown_value',
        size: p.size_bytes,
        rowCount: p.gross_record_count,
        numFiles: p.num_data_files,
        children: null
      };
    });
  }, [responseData]);

  console.log('repsonse data from overview ', responseData)

  const partitionKeys = useMemo(() => {
    if (!responseData || !responseData.partition_spec || !responseData.partition_spec.fields) {
      return [];
    }
    return responseData.partition_spec.fields.map(field => field.name);
  }, [responseData]);

  const [expandedPartitions, setExpandedPartitions] = useState({});

  const togglePartition = (partitionId) => {
    setExpandedPartitions(prev => ({
      ...prev,
      [partitionId]: !prev[partitionId]
    }));
  };

  if (!partitions.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
        <div className="text-3xl text-neutral-400 mb-2">
          <i className="ri-table-line"></i>
        </div>
        <h3 className="text-lg font-medium text-neutral-700">No Partition Information</h3>
        <p className="text-neutral-500 mt-1">This table does not appear to be partitioned, or partition information is unavailable.</p>
      </div>
    );
  }

  if (isPreview) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
        <div className="flex justify-between items-center p-4 border-b border-neutral-200">
          <h2 className="text-base font-medium">Partition Layout</h2>
          {/* Button might link to full view */}
          <div className="flex space-x-2">
             {/* Simplified visualize button for preview */}
             <span className="text-sm text-neutral-600 flex items-center">
              <i className="ri-pie-chart-line mr-1"></i>
              {partitions.length} Partitions
            </span>
          </div>
        </div>

        <div className="p-4">
          {/* Partition Strategy Info */}
          <div className="mb-4 p-3 bg-neutral-50 rounded-md">
            <h3 className="text-sm font-medium mb-2">Partition Strategy</h3>
            <div className="text-sm text-neutral-600">
              {/* Use derived partitionKeys */}
              <p><span className="font-medium">Fields:</span> {partitionKeys.join(', ') || 'None'}</p>
              {/* Basic strategy assumption */}
              <p><span className="font-medium">Strategy:</span> {partitionKeys.length > 0 ? 'Field partitioning' : 'No partitioning'}</p>
              {/* Use length of derived partitions */}
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
              {/* Slice the derived partitions array */}
              {partitions.slice(0, 3).map((partition, index) => (
                <div key={`${partition.name}-${partition.value}-${index}`} className="p-2 border-b border-neutral-100 flex justify-between">
                  <span className="text-sm">{partition.name}={partition.value}</span>
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

  const [activeView, setActiveView] = useState('tree');
  const [vizType, setVizType] = useState('bar');

  const chartData = useMemo(() => {
    return partitions
      .filter(p => typeof p.size === 'number')
      .map(p => ({
        name: `${p.name}=${p.value}`, 
        value: p.size || 0,        
        size: p.size || 0,
        rowCount: p.rowCount || 0,
        displaySize: formatBytes(p.size || 0)
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 20);
  }, [partitions]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Access the full data object
      return (
        <div className="bg-white p-2 border border-neutral-200 shadow-sm rounded-md text-xs">
          {/* Use 'name' from chartData which is key=value */}
          <p className="font-medium">{data.name}</p>
          {/* Display formatted size */}
          <p className="text-neutral-600">Size: {formatBytes(data.size)}</p>
          {/* Display formatted row count if available */}
          {data.rowCount > 0 && (
            <p className="text-neutral-600">Rows: {formatLargeNumber(data.rowCount)}</p>
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
                {/* Determine strategy based on keys presence, can be enhanced */}
                <p className="text-sm">{partitionKeys.length > 0 ? 'Field partitioning' : 'No partitioning'}</p>
                 {/* Example of format-specific strategy (if format was available) */}
                 {/* { metadata.format === 'iceberg'
                    ? 'Identity / Transform partitioning'
                    : metadata.format === 'hudi'
                      ? 'Hudi partitioning'
                      : partitionKeys.length > 0 ? 'Field partitioning' : 'No partitioning'
                 } */}
              </div>
              <div className="flex-1 p-3 bg-purple-50 rounded-md">
                <p className="text-xs text-purple-600 font-medium mb-1">Total Partitions</p>
                {/* Use length of derived partitions array */}
                <p className="text-sm font-medium">{partitions.length}</p>
              </div>
            </div>
             {/* Displaying partitions as chips (optional, maybe too many) */}
             <div className="flex flex-wrap gap-2 mt-4 max-h-20 overflow-y-auto">
              {partitions.slice(0, 50).map((partition, i) => ( // Limit chips shown
                <div key={`${partition.name}-${partition.value}-${i}`} className="px-2 py-1 bg-neutral-100 rounded text-xs">
                  {partition.name}={partition.value}
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
              {/* Toolbar */}
              <div className="bg-neutral-50 border-b border-neutral-200 p-2 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <button className="p-1 rounded hover:bg-neutral-200 text-neutral-700 disabled:text-neutral-400" title="Refresh (Not Implemented)" disabled>
                    <i className="ri-refresh-line"></i>
                  </button>
                  <button className="p-1 rounded hover:bg-neutral-200 text-neutral-700 disabled:text-neutral-400" title="Search (Not Implemented)" disabled>
                    <i className="ri-search-line"></i>
                  </button>
                  <button className="p-1 rounded hover:bg-neutral-200 text-neutral-700 disabled:text-neutral-400" title="Filter (Not Implemented)" disabled>
                    <i className="ri-filter-line"></i>
                  </button>
                </div>
                <div className="text-xs text-neutral-500">
                  {/* Showing all partitions, could be changed to sort/filter */}
                  Showing {partitions.length} partitions
                </div>
              </div>

              {/* Partition Tree/List View */}
              <div className="max-h-96 overflow-y-auto">
                {/* Iterate over derived partitions */}
                {partitions.map((partition, index) => {
                  const partitionId = `${partition.name}-${partition.value}-${index}`;
                  const isExpanded = expandedPartitions[partitionId];
                  const hasChildren = false;

                  return (
                    <React.Fragment key={partitionId}>
                      <div
                        className={`p-1.5 border-b border-neutral-100 ${isExpanded ? 'bg-blue-50' : 'hover:bg-blue-50'} ${hasChildren ? 'cursor-pointer' : ''}`}
                        onClick={() => hasChildren && togglePartition(partitionId)}
                      >
                        <div className="flex items-center">
                          <span className={`text-sm ml-1 ${isExpanded ? 'font-medium' : ''}`}>
                            {partition.name}={partition.value}
                          </span>
                          {/* Display size or row count on the right */}
                          <span className="ml-auto text-xs text-neutral-500">
                             {partition.size != null
                              ? formatBytes(partition.size)
                              : partition.rowCount != null
                                ? `${formatLargeNumber(partition.rowCount)} rows`
                                : '' 
                            }
                          </span>
                        </div>
                      </div>
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
            {/* Header with Viz Type Toggle */}
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
              <div className="p-4 text-center text-neutral-500">
                No size data available for visualization or partitions lack size info.
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-md overflow-hidden p-3 bg-white">
                <div className="text-xs text-neutral-500 mb-2">
                  {/* Indicate that only top N are shown */}
                  Showing top {chartData.length} partitions by size
                </div>

                {/* Bar Chart */}
                {vizType === 'bar' && (
                  <div className="h-96"> {/* Fixed height container */}
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical" // Vertical bars
                        margin={{ top: 5, right: 30, left: 150, bottom: 5 }} // Adjusted margins for labels
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          type="number"
                          tickFormatter={(value) => formatBytes(value)} // Format X-axis labels as bytes
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name" // Use key=value as label
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          width={150} // Increased width for longer labels
                          interval={0} // Show all labels
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }}/>
                        {/* <Legend wrapperStyle={{ paddingTop: "10px" }} /> */} {/* Legend might be redundant here */}
                        <Bar
                          dataKey="value" // 'value' in chartData holds the size
                          name="Partition Size" // Name for tooltip/legend
                          fill="#818cf8" // Bar color
                          radius={[0, 4, 4, 0]} // Rounded corners
                          barSize={16} // Fixed bar height
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Pie Chart */}
                {vizType === 'pie' && (
                  <div className="h-96"> {/* Fixed height container */}
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                          innerRadius={80} // Doughnut chart effect
                          outerRadius={140}
                          fill="#8884d8"
                          dataKey="value" // 'value' in chartData holds the size
                          nameKey="name"  
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`} // Simple percentage label
                          labelStyle={{ fill: '#475569', fontSize: 12 }}
                        >
                          {/* Assign colors to pie slices */}
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={1} />
                          ))}
                        </Pie>
                         {/* Tooltip formatter for pie chart */}
                        <Tooltip formatter={(value) => formatBytes(value)} content={<CustomTooltip />} />
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