import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, // Renamed Tooltip to avoid conflict if needed
  LineChart, Line, XAxis, YAxis, CartesianGrid, Label
} from 'recharts'; // Added LineChart, Line
import { formatLargeNumber, formatFileSize } from '@/lib/formatUtils';
import { useRecoilValue } from 'recoil';
import { metadataAtom } from '@/atoms/metadataAtom';

// Helper: Format bytes for chart display (e.g., Y-axis unit)
const formatBytesForChart = (bytes: number): { value: number; unit: 'Bytes' | 'KB' | 'MB' | 'GB' } => {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes <= 0) return { value: 0, unit: 'Bytes' };
  if (bytes < 1024 * 1024) return { value: parseFloat((bytes / 1024).toFixed(1)), unit: 'KB' };
  if (bytes < 1024 * 1024 * 1024) return { value: parseFloat((bytes / (1024 * 1024)).toFixed(1)), unit: 'MB' };
  return { value: parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(1)), unit: 'GB' };
};

// Helper: Format timestamp for chart axis
const formatTimestampForAxis = (timestampMs: number): string => {
  if (!timestampMs) return '';
  try {
    const date = new Date(timestampMs);
    // Simple date format, adjust as needed (e.g., include time)
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

// --- FilesViewer Component ---
export default function FilesViewer() {
  const [searchTerm, setSearchTerm] = useState('');
  const response = useRecoilValue(metadataAtom);

  // --- Process History data for Line Chart ---
  const historyChartData = useMemo(() => {
    const history = response?.data?.version_history?.snapshots_overview;
    if (!history || !Array.isArray(history) || history.length === 0) {
      return { data: [], unit: 'MB', divisor: 1, hasData: false };
    }

    // Sort snapshots chronologically
    const sortedHistory = [...history].sort((a, b) => a['timestamp-ms'] - b['timestamp-ms']);

    // Determine common unit based on max size across history
    const maxBytes = Math.max(...sortedHistory.map(snap => Number(snap.summary?.['total-files-size'] || 0)), 0);
    const unitInfo = formatBytesForChart(maxBytes);
    const unit = unitInfo.unit;
    const divisor = unit === 'GB' ? 1024 * 1024 * 1024 : (unit === 'MB' ? 1024 * 1024 : (unit === 'KB' ? 1024 : 1));

    // Map data for the chart
    const chartData = sortedHistory.map(snap => {
      const timestamp = snap['timestamp-ms'];
      const totalSize = Number(snap.summary?.['total-files-size'] || 0);
      const totalFiles = Number(snap.summary?.['total-data-files'] || 0); // Can also track files
      const displaySize = totalSize > 0 && divisor > 0 ? parseFloat((totalSize / divisor).toFixed(1)) : 0;

      return {
        timestampMs: timestamp,
        dateLabel: formatTimestampForAxis(timestamp),
        totalSizeRaw: totalSize,
        displaySize: displaySize, // Size in common unit
        totalFiles: totalFiles,
        operation: snap.summary?.operation || 'unknown'
      };
    });

    // console.log("[FilesViewer] History Chart Data:", { data: chartData, unit }); // DEBUG LOG
    return { data: chartData, unit: unit, divisor: divisor, hasData: chartData.length > 0 };

  }, [response]);

  // --- Data for File Breakdown Pie Chart ---
  const fileBreakdownData = useMemo(() => {
    const dataFiles = response?.data?.key_metrics?.total_data_files;
    const deleteFiles = response?.data?.key_metrics?.total_delete_files; // Might be 0 or undefined for V1 tables

    if (dataFiles === undefined || dataFiles === null) {
      return { data: [], hasData: false };
    }

    const chartData = [];
    chartData.push({ name: 'Data Files', value: dataFiles });

    // Only add delete files if they exist and are > 0 for a meaningful slice
    if (deleteFiles !== undefined && deleteFiles !== null && deleteFiles > 0) {
      chartData.push({ name: 'Delete Files', value: deleteFiles });
    }

    return { data: chartData, hasData: chartData.length > 0 && (dataFiles > 0 || deleteFiles > 0) };
  }, [response]);


  // --- Other Derived Data ---
  const keyMetrics = response?.data?.key_metrics;
  // Keep fileTypeData simple for now, just showing primary type if known
  const primaryFileType = response?.data?.table_properties?.['write.parquet.compression-codec'] ? 'Parquet' : 'Unknown';
  const avgFileSizeMB = keyMetrics?.avg_data_file_size_mb;
  const avgRecordsPerFile = keyMetrics?.avg_live_records_per_data_file;
  const totalStorageBytes = keyMetrics?.total_data_storage_bytes;
  const approxLiveRecords = keyMetrics?.approx_live_records;

  // --- Constants ---
  const COLORS = ['#0088FE', '#FF8042', '#00C49F', '#FFB300', '#AF19FF']; // Adjusted order
  const CHART_COLORS = ['#818CF8', '#34D399']; // May need different colors

  // --- Render Helpers ---
  const renderLoadingPulse = (width = 'w-14') => <div className={`${width} rounded-lg h-4 animate-pulse bg-gray-200`}></div>;
  const renderNotAvailableMessage = (message: string) => (<div className="flex items-center justify-center h-full text-gray-500 text-sm p-4 text-center">{message}</div>);

  // --- Custom Tooltip for History Chart ---
  const HistoryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Full data object for the point
      return (
        <div className="bg-white p-2 border border-gray-300 shadow rounded text-sm max-w-xs overflow-hidden">
          <p className="font-semibold">{`Date: ${data.dateLabel}`}</p>
          <p className="text-gray-700">{`Total Size: ${formatFileSize(data.totalSizeRaw)}`}</p>
          <p className="text-gray-700">{`Total Files: ${formatLargeNumber(data.totalFiles)}`}</p>
          <p className="text-gray-700 capitalize">{`Operation: ${data.operation}`}</p>
        </div>
      );
    }
    return null;
  };


  // --- Component Render ---
  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-2xl font-semibold text-gray-900">File Analysis</div>
        <div className="flex items-center space-x-2">
          <Input disabled type="text" placeholder="Search files..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-xs cursor-not-allowed" />
          <select disabled className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-white cursor-not-allowed"> <option>Sort by Records</option> </select>
        </div>
      </div>

      {/* Key Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Cards as before */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"> <div className="text-xl font-semibold text-black">Total Files</div> <div className="text-2xl font-semibold font-mono text-black mt-1">{keyMetrics?.total_data_files !== undefined ? formatLargeNumber(keyMetrics.total_data_files + (keyMetrics.total_delete_files || 0)) : renderLoadingPulse()}</div> <div className="text-sm text-gray-500 font-semibold mt-1">Data + Delete files</div> </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"> <div className="text-xl font-semibold text-black">Total Records</div> <div className="text-2xl font-mono font-semibold text-gray-900 mt-1">{keyMetrics?.approx_live_records !== undefined ? formatLargeNumber(keyMetrics.approx_live_records) : renderLoadingPulse()}</div> <div className="text-sm text-gray-500 font-semibold mt-1">Approx. live records</div> </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"> <div className="text-xl font-semibold text-black">Avg Records/File</div> <div className="text-2xl font-mono font-semibold text-gray-900 mt-1">{avgRecordsPerFile !== undefined ? formatLargeNumber(avgRecordsPerFile) : renderLoadingPulse()}</div> <div className="text-sm text-gray-500 font-semibold mt-1">Avg live records / data file</div> </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"> <div className="text-xl font-semibold text-black">Avg File Size</div> <div className="text-2xl font-mono font-semibold text-gray-900 mt-1">{avgFileSizeMB !== undefined ? `${avgFileSizeMB.toFixed(2)} MB` : renderLoadingPulse()}</div> <div className="text-sm text-gray-500 font-semibold mt-1">Avg data file size (MB)</div> </div>
      </div>

      {/* File Visualizations Section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="text-2xl font-semibold mb-4">File Overview</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* File Breakdown (Data vs Delete) Pie Chart */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-xl font-semibold text-black mb-2">File Count Breakdown</div>
            <div className="text-sm text-gray-500 font-semibold mb-4">Data files vs. Delete files</div>
            <div style={{ height: '240px' }}>
              {!response
                ? <div className="h-full flex items-center justify-center">{renderLoadingPulse('w-full')}</div>
                : fileBreakdownData.hasData
                  ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={fileBreakdownData.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent, value }) => `${name} (${formatLargeNumber(value)})`} >
                          {fileBreakdownData.data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => formatLargeNumber(value)} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  )
                  : renderNotAvailableMessage("File breakdown data not available.")
              }
            </div>
          </div>

          {/* Table Size History Line Chart */}
          {/* Table Size History Line Chart */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-xl font-semibold text-black mb-2">Table Size History</div>
            <div className="text-sm text-gray-500 font-semibold mb-4">Total table size across snapshots</div>
            <div style={{ height: '240px' }}>
              {!response ? <div className="h-full flex items-center justify-center">{renderLoadingPulse('w-full')}</div>
                : historyChartData.hasData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {/* Increased bottom margin for angled labels */}
                    <LineChart data={historyChartData.data} margin={{ top: 5, right: 10, left: 10, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="2 2" vertical={false} />
                      <XAxis
                        dataKey="dateLabel"
                        fontSize={10}
                        angle={-45} // Keep angled labels
                        textAnchor="end"
                        height={40}
                      // You might try interval="auto" again if angling is too cluttered
                      // interval="auto"
                      />
                      {/* ---- FIX: Increased YAxis width ---- */}
                      <YAxis fontSize={10} unit={historyChartData.unit} width={55}>
                        <Label value={`Size (${historyChartData.unit})`} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: '12px' }} />
                      </YAxis>
                      {/* ------------------------------------ */}
                      <RechartsTooltip content={<HistoryTooltip />} />
                      <Line type="monotone" dataKey="displaySize" stroke={CHART_COLORS[1]} strokeWidth={2} dot={historyChartData.data.length < 20} name={`Size (${historyChartData.unit})`} />
                    </LineChart>
                  </ResponsiveContainer>)
                  : renderNotAvailableMessage("Snapshot history data not available.")}
            </div>
          </div>
        </div>
      </div>

      {/* File Metrics Summary Section (No change needed here) */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 md:col-span-2"> {/* Simplified Example Layout */}
        <div className="text-xl font-semibold text-black mb-2">File Metrics Summary</div>
        <div className="text-sm text-gray-500 font-semibold mb-4">Average and total values</div>
        {!response ? (
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-4">{renderLoadingPulse('w-3/4')}<br />{renderLoadingPulse('w-1/2')}</div>
            <div className="space-y-4">{renderLoadingPulse('w-3/4')}<br />{renderLoadingPulse('w-1/2')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="space-y-4">
              <div><div className="text-sm font-medium text-gray-600">Avg. Record Count</div><div className="mt-1 text-lg font-mono">{avgRecordsPerFile !== undefined ? formatLargeNumber(avgRecordsPerFile) : 'N/A'}</div><div className="text-xs text-gray-500">per data file</div></div>
              <div><div className="text-sm font-medium text-gray-600">Total Storage</div><div className="mt-1 text-lg font-mono">{totalStorageBytes !== undefined ? formatFileSize(totalStorageBytes) : 'N/A'}</div><div className="text-xs text-gray-500">for data files</div></div>
              <div><div className="text-sm font-medium text-gray-600">Primary File Type</div><div className="mt-1 text-lg font-mono">{primaryFileType}</div><div className="text-xs text-gray-500">Detected format</div></div>

            </div>
            <div className="space-y-4">
              <div><div className="text-sm font-medium text-gray-600">Avg. File Size</div><div className="mt-1 text-lg font-mono">{avgFileSizeMB !== undefined ? `${avgFileSizeMB.toFixed(2)} MB` : 'N/A'}</div><div className="text-xs text-gray-500">per data file</div></div>
              <div><div className="text-sm font-medium text-gray-600">Storage Efficiency</div><div className="mt-1 text-lg font-mono">{(approxLiveRecords !== undefined && totalStorageBytes !== undefined && totalStorageBytes > 0) ? `${(approxLiveRecords / (totalStorageBytes / (1024 * 1024))).toFixed(0)}` : 'N/A'}</div><div className="text-xs text-gray-500">live records per MB (approx.)</div></div>
              {/* Can add more metrics here if needed, e.g., delete file count/size */}
              {keyMetrics?.total_delete_files !== undefined && keyMetrics.total_delete_files > 0 && (
                <div><div className="text-sm font-medium text-gray-600">Delete Files</div><div className="mt-1 text-lg font-mono">{formatLargeNumber(keyMetrics.total_delete_files)} ({formatFileSize(keyMetrics.total_delete_storage_bytes || 0)})</div><div className="text-xs text-gray-500">Count & Total Size</div></div>
              )}
            </div>
          </div>
        )}
        <div className="text-xs text-gray-400 mt-4 italic"> Note: Detailed distributions per range or Min/Max values per file are not available from this summary. </div>
      </div>

    </div>
  );
}