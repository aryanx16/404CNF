import React from 'react';
import FilesViewer from './table-viewers/FilesViewer';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatBytes } from '@/lib/formatUtils';
import { TableMetadata } from '@shared/schema';
import TableFormatCard from './summary-cards/TableFormatCard';
import RowCountCard from './summary-cards/RowCountCard';
import StorageSizeCard from './summary-cards/StorageSizeCard';
import VersionCard from './summary-cards/VersionCard';
import SchemaViewer from './table-viewers/SchemaViewer';
import SchemaHistoryViewer from './table-viewers/SchemaHistoryViewer';
import PartitionViewer from './table-viewers/PartitionViewer';
import VersionViewer from './table-viewers/VersionViewer';
import PropertiesViewer from './table-viewers/PropertiesViewer';
import SampleDataViewer from './table-viewers/SampleDataViewer';

interface MetadataViewerProps {
  metadata: TableMetadata;
  activeTab: string;
  isLoading: boolean;
}

export default function MetadataViewer({ metadata, activeTab, isLoading }: MetadataViewerProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Overview tab with summary cards
  if (activeTab === 'overview') {
    return (
      <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <TableFormatCard metadata={metadata} />
          <RowCountCard metadata={metadata} />
          <StorageSizeCard metadata={metadata} />
          <VersionCard metadata={metadata} />
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
            <h3 className="text-sm font-medium mb-4">Storage Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Data Files', value: 1024 * 1024 * 500 }, // 500MB
                      { name: 'Manifest Files', value: 1024 * 1024 * 50 }, // 50MB
                      { name: 'Other Files', value: 1024 * 1024 * 10 } // 10MB
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B'][index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatBytes(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
            <h3 className="text-sm font-medium mb-4">Version History</h3>
            {metadata.versions && metadata.versions.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { version: 'v5', changes: 12 },
                      { version: 'v4', changes: 8 },
                      { version: 'v3', changes: 15 },
                      { version: 'v2', changes: 6 },
                      { version: 'v1', changes: 10 }
                    ]}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="version" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="changes" 
                      fill="#3B82F6" 
                      name="File Changes"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Schema Section */}
        <SchemaViewer metadata={metadata} isPreview={true} />

        {/* Schema History Preview (if versions exist) */}
        {metadata.versions && metadata.versions.length > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-medium">Schema History</h2>
                <a 
                  className="text-sm text-primary flex items-center" 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    const tabNav = document.querySelector('button[data-value="schema-history"]');
                    if (tabNav) (tabNav as HTMLButtonElement).click();
                  }}
                >
                  <i className="ri-history-line mr-1"></i>
                  View Full History
                </a>
              </div>

              <div className="text-sm text-neutral-600">
                <p>This table has {metadata.versions.length} recorded schema changes.</p>
                <p className="mt-1">Last updated: {metadata.versions[0]?.timestamp 
                  ? new Date(metadata.versions[0].timestamp).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })
                  : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Version History Preview */}
        <VersionViewer metadata={metadata} isPreview={true} />

        {/* Partition Layout Preview */}
        <PartitionViewer metadata={metadata} isPreview={true} />

        {/* Format Properties Preview */}
        <PropertiesViewer metadata={metadata} isPreview={true} />
      </>
    );
  }

  // Schema tab
  if (activeTab === 'schema') {
    return <SchemaViewer metadata={metadata} />;
  }

  // Schema History tab
  if (activeTab === 'schema-history') {
    return <SchemaHistoryViewer metadata={metadata} />;
  }

  // Partitions tab
  if (activeTab === 'partitions') {
    return <PartitionViewer metadata={metadata} />;
  }

  // Versions tab
  if (activeTab === 'versions') {
    return <VersionViewer metadata={metadata} />;
  }

  // Properties tab
  if (activeTab === 'properties') {
    return <PropertiesViewer metadata={metadata} />;
  }

  // Files tab
  if (activeTab === 'files') {
    return <FilesViewer metadata={metadata} />;
  }

  // Sample Data tab
  if (activeTab === 'sample-data') {
    return <SampleDataViewer metadata={metadata} />;
  }

  return null;
}