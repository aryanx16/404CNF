import React, { useState, useCallback, useMemo } from 'react';
import { TableMetadata, TablePartition } from '@shared/schema';
import { formatBytes, formatLargeNumber } from '@/lib/formatUtils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector, CartesianGrid
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PartitionViewerProps {
  metadata: TableMetadata;
  isPreview?: boolean;
}

export default function PartitionViewer({ metadata, isPreview = false }: PartitionViewerProps) {
  const partitions = metadata.partitions || [];
  const [expandedPartitions, setExpandedPartitions] = useState<Record<string, boolean>>({});

  // Toggle partition expansion
  const togglePartition = (partitionId: string) => {
    setExpandedPartitions(prev => ({
      ...prev,
      [partitionId]: !prev[partitionId]
    }));
  };

  // If no partition data, show empty state
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

  // Find partition keys from schema
  const partitionKeys = metadata.schema?.fields
    .filter(field => field.partitionKey)
    .map(field => field.name) || [];

  // For preview mode, show a limited view
  if (isPreview) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
        <div className="flex justify-between items-center p-4 border-b border-neutral-200">
          <h2 className="text-base font-medium">Partition Layout</h2>
          <div className="flex space-x-2">
            <button className="text-sm text-neutral-600 flex items-center hover:text-primary">
              <i className="ri-pie-chart-line mr-1"></i>
              Visualize
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Partition Strategy Info */}
          <div className="mb-4 p-3 bg-neutral-50 rounded-md">
            <h3 className="text-sm font-medium mb-2">Partition Strategy</h3>
            <div className="text-sm text-neutral-600">
              <p><span className="font-medium">Fields:</span> {partitionKeys.join(', ') || 'None'}</p>
              <p><span className="font-medium">Strategy:</span> {partitionKeys.length > 0 ? 'Identity partitioning' : 'No partitioning'}</p>
              <p><span className="font-medium">Total Partitions:</span> {partitions.length}</p>
            </div>
          </div>

          {/* Preview of partitions */}
          <div className="border border-neutral-200 rounded-md overflow-hidden">
            <div className="bg-neutral-50 p-2 border-b border-neutral-200 flex justify-between items-center">
              <span className="text-xs font-medium">Partition</span>
              <span className="text-xs font-medium">Size</span>
            </div>
            <div className="max-h-32 overflow-y-auto">
              {partitions.slice(0, 3).map((partition, index) => (
                <div key={`${partition.name}-${partition.value}`} className="p-2 border-b border-neutral-100 flex justify-between">
                  <span className="text-sm">{partition.name}={partition.value}</span>
                  <span className="text-sm text-neutral-500">{partition.size ? formatBytes(partition.size) : 'Unknown'}</span>
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

  // Process partition data for charts
  const [activeView, setActiveView] = useState<'tree' | 'visualization'>('tree');
  const [vizType, setVizType] = useState<'bar' | 'pie'>('bar');

  // Convert partition data for visualization
  const chartData = useMemo(() => {
    return partitions
      .filter(p => p.size !== undefined)
      .map(p => ({
        name: `${p.name}=${p.value}`,
        value: p.size || 0,
        size: p.size || 0,
        rowCount: p.rowCount || 0,
        displaySize: formatBytes(p.size || 0)
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 20); // Only show top 20 partitions
  }, [partitions]);

  // Custom tooltip formatter for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-neutral-200 shadow-sm rounded-md text-xs">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-neutral-600">Size: {formatBytes(payload[0].value)}</p>
          {payload[0].payload.rowCount > 0 && (
            <p className="text-neutral-600">Rows: {formatLargeNumber(payload[0].payload.rowCount)}</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Chart colors
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
    '#82ca9d', '#ffc658', '#ff8373', '#a4de6c', '#d0ed57'
  ];

  // Full partition viewer
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
          >
            <i className="ri-pie-chart-line mr-1.5"></i>
            Visualize
          </Button>
        </div>
      </div>

      <div className="p-4">
        {/* Partition Strategy Info */}
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
                <p className="text-sm">{
                  metadata.format === 'iceberg' 
                    ? 'Identity hash partitioning' 
                    : metadata.format === 'hudi'
                      ? 'Hudi partitioning'
                      : 'Identity partitioning'
                }</p>
              </div>
              <div className="flex-1 p-3 bg-purple-50 rounded-md">
                <p className="text-xs text-purple-600 font-medium mb-1">Total Partitions</p>
                <p className="text-sm font-medium">{partitions.length}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {partitions.map((partition, i) => (
                <div key={i} className="px-2 py-1 bg-neutral-100 rounded text-xs">
                  {partition.name}={partition.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {activeView === 'tree' && (
          <div>
            <h3 className="text-sm font-medium mb-2">Partition Explorer</h3>
            <div className="border border-neutral-200 rounded-md overflow-hidden">
              {/* Explorer Toolbar */}
              <div className="bg-neutral-50 border-b border-neutral-200 p-2 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <button className="p-1 rounded hover:bg-neutral-200 text-neutral-700">
                    <i className="ri-refresh-line"></i>
                  </button>
                  <button className="p-1 rounded hover:bg-neutral-200 text-neutral-700">
                    <i className="ri-search-line"></i>
                  </button>
                  <button className="p-1 rounded hover:bg-neutral-200 text-neutral-700">
                    <i className="ri-filter-line"></i>
                  </button>
                </div>
                <div className="text-xs text-neutral-500">
                  Showing top partitions by size
                </div>
              </div>

              {/* Partition Tree View */}
              <div className="max-h-96 overflow-y-auto">
                {partitions.map((partition) => {
                  const partitionId = `${partition.name}-${partition.value}`;
                  const isExpanded = expandedPartitions[partitionId];
                  const hasChildren = partition.children && partition.children.length > 0;

                  return (
                    <React.Fragment key={partitionId}>
                      <div 
                        className={`p-1.5 border-b border-neutral-100 ${isExpanded ? 'bg-blue-50' : 'hover:bg-blue-50'} cursor-pointer`}
                        onClick={() => hasChildren && togglePartition(partitionId)}
                      >
                        <div className="flex items-center">
                          {hasChildren ? (
                            <i className={`${isExpanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'} text-neutral-${isExpanded ? '600' : '400'} mx-1`}></i>
                          ) : (
                            <span className="w-5"></span>
                          )}
                          <span className={`text-sm ml-1 ${isExpanded ? 'font-medium' : ''}`}>
                            {partition.name}={partition.value}
                          </span>
                          <span className="ml-auto text-xs text-neutral-500">
                            {hasChildren 
                              ? `${partition.children?.length} partitions` 
                              : partition.size 
                                ? formatBytes(partition.size)
                                : partition.rowCount
                                  ? `${formatLargeNumber(partition.rowCount)} rows`
                                  : ''}
                          </span>
                        </div>
                      </div>
                      {isExpanded && partition.children && partition.children.map((child) => (
                        <div 
                          key={`${child.name}-${child.value}`}
                          className="pl-8 p-1.5 border-b border-neutral-100 hover:bg-blue-50"
                        >
                          <div className="flex items-center">
                            <span className="text-sm">{child.name}={child.value}</span>
                            <span className="ml-auto text-xs text-neutral-500">
                              {child.size ? formatBytes(child.size) : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeView === 'visualization' && (
          <div>
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

            {chartData.length === 0 ? (
              <div className="p-4 text-center text-neutral-500">
                No size data available for visualization
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-md overflow-hidden p-3 bg-white">
                <div className="text-xs text-neutral-500 mb-2">
                  Showing top {chartData.length} partitions by size
                </div>

                {vizType === 'bar' && (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 20, right: 50, left: 180, bottom: 10 }}
                      >
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
                          dataKey="name" 
                          tick={{ fontSize: 11, fill: '#64748b' }} 
                          width={120}
                          tickLine={false}
                          axisLine={false}
                        />
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: "10px" }} />
                        <Bar 
                          dataKey="size" 
                          name="Partition Size" 
                          fill="#818cf8"
                          radius={[0, 4, 4, 0]}
                          barSize={16}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

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
                          dataKey="size"
                          nameKey="name"
                          label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                          labelStyle={{ fill: '#64748b', fontSize: 12 }}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatBytes(value)} contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
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