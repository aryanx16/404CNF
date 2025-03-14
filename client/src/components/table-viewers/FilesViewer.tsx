
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { TableMetadata } from '@shared/schema';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface FilesViewerProps {
  metadata: TableMetadata;
}

export default function FilesViewer({ metadata }: FilesViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const fileAnalysis = {
    totalFiles: metadata.fileCount || 0,
    totalRecords: metadata.rowCount || 0,
    avgRecordsPerFile: metadata.fileCount ? Math.round((metadata.rowCount || 0) / metadata.fileCount) : 0,
    avgFileSize: `${(metadata.size / (1024 * 1024 * metadata.fileCount)).toFixed(2)} MB`,
    distributions: {
      fileSize: [
        { range: "0-1 MB", files: 40, percentage: 30 },
        { range: "1-5 MB", files: 70, percentage: 45 },
        { range: "5-10 MB", files: 35, percentage: 25 },
        { range: "10-20 MB", files: 15, percentage: 10 },
        { range: "20+ MB", files: 5, percentage: 5 }
      ],
      recordCount: [
        { range: "0-1K", files: 20, percentage: 10 },
        { range: "1K-10K", files: 45, percentage: 25 },
        { range: "10K-50K", files: 60, percentage: 30 },
        { range: "50K-100K", files: 70, percentage: 35 },
        { range: "100K+", files: 40, percentage: 20 }
      ],
      fileTypes: [
        { name: "parquet", value: 30 },
        { name: "orc", value: 42 },
        { name: "avro", value: 28 }
      ]
    }
  };

  const COLORS = ['#0088FE', '#FFB300', '#00C49F'];
  const CHART_COLORS = ['#818CF8', '#34D399'];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="text-2xl font-semibold text-gray-900">File Analysis</div>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs cursor-not-allowed"
          />
          <select className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-white">
            <option>Sort by Records</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-xl font-semibold  text-black">Total Files</div>
          <div className="text-2xl font-semibold font-mono text-black mt-1">{fileAnalysis.totalFiles}</div>
          <div className="text-sm text-gray-500 font-semibold mt-1">Number of data files</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-xl font-semibold  text-black">Total Records</div>
          <div className="text-2xl font-mono font-semibold text-gray-900 mt-1">{fileAnalysis.totalRecords.toLocaleString()}</div>
          <div className="text-sm text-gray-500 font-semibold mt-1">Across all files</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-xl font-semibold  text-black">Avg Records/File</div>
          <div className="text-2xl font-mono font-semibold text-gray-900 mt-1">{fileAnalysis.avgRecordsPerFile.toLocaleString()}</div>
          <div className="text-sm text-gray-500 font-semibold mt-1">Average records per file</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-xl font-semibold  text-black">Avg File Size</div>
          <div className="text-2xl font-mono font-semibold text-gray-900 mt-1">{fileAnalysis.avgFileSize}</div>
          <div className="text-sm text-gray-500 font-semibold mt-1">Average size in MB</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="text-2xl font-semibold mb-4">Distributions</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-xl font-semibold  text-black mb-2">File Size Distribution</div>
            <div className="text-sm text-gray-500 font-semibold mb-4">Distribution of files by size ranges</div>
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fileAnalysis.distributions.fileSize}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" fontSize={12} />
                  <YAxis yAxisId="left" orientation="left" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" fontSize={12} />
                  <Bar yAxisId="left" dataKey="files" fill={CHART_COLORS[0]} />
                  <Bar yAxisId="right" dataKey="percentage" fill={CHART_COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-xl font-semibold  text-black mb-2">Record Count Distribution</div>
            <div className="text-sm text-gray-500 font-semibold mb-4">Distribution of files by record count ranges</div>
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fileAnalysis.distributions.recordCount}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" fontSize={12} />
                  <YAxis yAxisId="left" orientation="left" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" fontSize={12} />
                  <Bar yAxisId="left" dataKey="files" fill={CHART_COLORS[0]} />
                  <Bar yAxisId="right" dataKey="percentage" fill={CHART_COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-xl font-semibold  text-black mb-2">File Type Distribution</div>
          <div className="text-sm text-gray-500 font-semibold mb-4">Distribution of files by file format</div>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fileAnalysis.distributions.fileTypes}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {fileAnalysis.distributions.fileTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-xl font-semibold  text-black mb-2">File Metrics Summary</div>
          <div className="text-sm text-gray-500 font-semibold mb-4">Min, max, and average values</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-600">Record Count Range</div>
                <div className="mt-1 text-sm">
                  <div>Min: 1</div>
                  <div>Max: 423,295</div>
                  <div>Avg: 117,910</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Compression Ratio</div>
                <div className="mt-1 text-sm">
                  <div>Min: 0.2 records/KB</div>
                  <div>Max: 153.4 records/KB</div>
                  <div>Avg: 12.9 records/KB</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-600">File Size Range</div>
                <div className="mt-1 text-sm">
                  <div>Min: 0.007 MB</div>
                  <div>Max: 42.882 MB</div>
                  <div>Avg: 8.04 MB</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Storage Efficiency</div>
                <div className="mt-1 text-sm">
                  <div>Total Size: 531 MB</div>
                  <div>Avg Size/Record: 243 bytes</div>
                  <div>Records/MB: 4213</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
