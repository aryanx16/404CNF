import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
    ResponsiveContainer,
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, // Renamed Tooltip
    LineChart, Line, XAxis, YAxis, CartesianGrid, Label
} from 'recharts';
import { formatLargeNumber, formatFileSize } from '@/lib/formatUtils'; // Assuming correct path
import { useRecoilValue } from 'recoil';
import { metadataAtom } from '@/atoms/metadataAtom';
import { formatAtom } from '@/atoms/formatAtom'; // Import formatAtom

// Helper functions (formatBytesForChart, formatTimestampForAxis) remain the same...
// Define helper function types if needed
type ChartUnitInfo = { value: number; unit: 'Bytes' | 'KB' | 'MB' | 'GB' };
const formatBytesForChart = (bytes: number): ChartUnitInfo => {
    if (bytes === undefined || bytes === null || isNaN(bytes) || bytes <= 0) return { value: 0, unit: 'Bytes' };
    if (bytes < 1024 * 1024) return { value: parseFloat((bytes / 1024).toFixed(1)), unit: 'KB' };
    if (bytes < 1024 * 1024 * 1024) return { value: parseFloat((bytes / (1024 * 1024)).toFixed(1)), unit: 'MB' };
    return { value: parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(1)), unit: 'GB' };
};

const formatTimestampForAxis = (timestampMs: number): string => {
    if (!timestampMs) return '';
    try {
        const date = new Date(timestampMs);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
};

// --- FilesViewer Component ---
export default function FilesViewer() {
    const [searchTerm, setSearchTerm] = useState('');
    const response = useRecoilValue(metadataAtom);
    // Get format from Recoil
    const globalFormat = useRecoilValue(formatAtom);
    // Determine if format is Parquet (case-insensitive)
    const isParquet = globalFormat && globalFormat.toLowerCase() === 'parquet';

    // Extract data payload for convenience (adjust based on metadataAtom structure if needed)
    const dataPayload = response?.data;

    // --- Process History data for Line Chart ---
    const historyChartData = useMemo(() => {
        // No need to calculate if format is Parquet
        if (isParquet || !dataPayload?.version_history?.snapshots_overview) {
           return { data: [], unit: 'MB', divisor: 1, hasData: false };
        }
        const history = dataPayload.version_history.snapshots_overview;
        // Rest of the calculation logic...
        if (!Array.isArray(history) || history.length === 0) {
            return { data: [], unit: 'MB', divisor: 1, hasData: false };
        }
        const sortedHistory = [...history].sort((a, b) => (a['timestamp-ms'] || 0) - (b['timestamp-ms'] || 0));
        const maxBytes = Math.max(...sortedHistory.map(snap => Number(snap.summary?.['total-files-size'] || 0)), 0);
        const unitInfo = formatBytesForChart(maxBytes);
        const unit = unitInfo.unit;
        const divisor = unit === 'GB' ? 1024 * 1024 * 1024 : (unit === 'MB' ? 1024 * 1024 : (unit === 'KB' ? 1024 : 1));

        const chartData = sortedHistory.map(snap => {
            const timestamp = snap['timestamp-ms'];
            const totalSize = Number(snap.summary?.['total-files-size'] || 0);
            const totalFiles = Number(snap.summary?.['total-data-files'] || 0);
            const displaySize = totalSize > 0 && divisor > 0 ? parseFloat((totalSize / divisor).toFixed(1)) : 0;
            return {
                timestampMs: timestamp,
                dateLabel: formatTimestampForAxis(timestamp),
                totalSizeRaw: totalSize,
                displaySize: displaySize,
                totalFiles: totalFiles,
                operation: snap.summary?.operation || 'unknown'
            };
        });
        return { data: chartData, unit: unit, divisor: divisor, hasData: chartData.length > 0 };

    }, [dataPayload, isParquet]); // Add isParquet dependency

    // --- Data for File Breakdown Pie Chart ---
    const fileBreakdownData = useMemo(() => {
         // No need to calculate if format is Parquet (delete files concept doesn't apply)
         if (isParquet || !dataPayload?.key_metrics) {
            return { data: [], hasData: false };
         }
        const dataFiles = dataPayload.key_metrics.total_data_files;
        const deleteFiles = dataPayload.key_metrics.total_delete_files;

        if (dataFiles === undefined || dataFiles === null) {
            return { data: [], hasData: false };
        }
        const chartData = [];
        chartData.push({ name: 'Data Files', value: dataFiles });
        if (deleteFiles !== undefined && deleteFiles !== null && deleteFiles > 0) {
            chartData.push({ name: 'Delete Files', value: deleteFiles });
        }
        return { data: chartData, hasData: chartData.length > 0 && chartData.some(d => d.value > 0) }; // Check if any slice > 0
    }, [dataPayload, isParquet]); // Add isParquet dependency

    // --- Other Derived Data --- (Ensure robustness for potentially missing data)
    const keyMetrics = dataPayload?.key_metrics;
    const current_snapshot_summary = dataPayload?.version_history?.current_snapshot_summary?.summary; // Use optional chaining

    const primaryFileType = globalFormat || dataPayload?.table_type || 'Unknown'; // Use globalFormat first
    const avgFileSizeMB = keyMetrics?.avg_data_file_size_mb;
    // Correct calculation using current snapshot summary if available, fallback slightly less accurate
    const approx_live_records = current_snapshot_summary
        ? Number(current_snapshot_summary?.['total-records'] || 0) - Number(current_snapshot_summary?.['total-position-deletes'] || 0)
        : keyMetrics?.approx_live_records; // Fallback to keyMetrics if needed

    const total_data_files = current_snapshot_summary
        ? Number(current_snapshot_summary?.['total-data-files'] || 0)
        : keyMetrics?.total_data_files; // Fallback

    const total_delete_files = current_snapshot_summary
        ? Number(current_snapshot_summary?.['total-delete-files'] || 0)
        : keyMetrics?.total_delete_files; // Fallback

    const avgRecordsPerFile = (approx_live_records !== undefined && total_data_files !== undefined && total_data_files > 0)
        ? approx_live_records / total_data_files
        : undefined; // Calculate if possible

    const totalStorageBytes = keyMetrics?.total_data_storage_bytes;

    // console.log(avgRecordsPerFile); // DEBUG

    // --- Constants ---
    const COLORS = ['#0088FE', '#FF8042', '#00C49F', '#FFB300', '#AF19FF'];
    const CHART_COLORS = ['#818CF8', '#34D399'];

    // --- Render Helpers ---
    const renderLoadingPulse = (width = 'w-14') => <div className={`${width} rounded-lg h-4 animate-pulse bg-gray-200`}></div>;
    const renderNotAvailableMessage = (message: string) => (<div className="flex items-center justify-center h-full text-gray-500 text-sm p-4 text-center">{message}</div>);

    // --- Custom Tooltip for History Chart --- (remains the same)
    const HistoryTooltip = ({ active, payload, label }: any) => {
        // ... tooltip logic ...
         if (active && payload && payload.length) {
             const data = payload[0].payload;
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
                {/* Search/Sort can remain, just disabled for now */}
                <div className="flex items-center space-x-2">
                    <Input disabled type="text" placeholder="Search files..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-xs cursor-not-allowed" />
                    <select disabled className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-white cursor-not-allowed"> <option>Sort by Records</option> </select>
                </div>
            </div>

            {/* Key Metrics Section - Always show */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {/* Cards - use optional chaining and checks for robustness */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"> <div className="text-xl font-semibold text-black">Total Files</div> <div className="text-2xl font-semibold font-mono text-black mt-1">{total_data_files !== undefined ? formatLargeNumber(total_data_files + (total_delete_files || 0)) : renderLoadingPulse()}</div> <div className="text-sm text-gray-500 font-semibold mt-1">Data {total_data_files !== undefined ? `(${formatLargeNumber(total_data_files)})` : ''} + Delete files {total_delete_files !== undefined && total_delete_files > 0 ? `(${formatLargeNumber(total_delete_files)})` : '(0)'}</div> </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"> <div className="text-xl font-semibold text-black">Total Records</div> <div className="text-2xl font-mono font-semibold text-gray-900 mt-1">{approx_live_records !== undefined ? formatLargeNumber(approx_live_records) : renderLoadingPulse()}</div> <div className="text-sm text-gray-500 font-semibold mt-1">Approx. live records</div> </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"> <div className="text-xl font-semibold text-black">Avg Records/File</div> <div className="text-2xl font-mono font-semibold text-gray-900 mt-1">{avgRecordsPerFile !== undefined ? formatLargeNumber(avgRecordsPerFile) : renderLoadingPulse()}</div> <div className="text-sm text-gray-500 font-semibold mt-1">Avg live records / data file</div> </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"> <div className="text-xl font-semibold text-black">Avg File Size</div> <div className="text-2xl font-mono font-semibold text-gray-900 mt-1">{avgFileSizeMB !== undefined ? `${avgFileSizeMB.toFixed(2)} MB` : renderLoadingPulse()}</div> <div className="text-sm text-gray-500 font-semibold mt-1">Avg data file size (MB)</div> </div>
            </div>

            {/* File Visualizations Section - Conditionally hide this entire section for Parquet */}
            {!isParquet && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="text-2xl font-semibold mb-4">File Overview</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* File Breakdown (Data vs Delete) Pie Chart */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="text-xl font-semibold text-black mb-2">File Count Breakdown</div>
                            <div className="text-sm text-gray-500 font-semibold mb-4">Data files vs. Delete files</div>
                            <div style={{ height: '240px' }}>
                                {!response // Check if response wrapper exists first
                                    ? <div className="h-full flex items-center justify-center">{renderLoadingPulse('w-full')}</div>
                                    : fileBreakdownData.hasData
                                        ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                     {/* Adjusted label */}
                                                    <Pie data={fileBreakdownData.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} >
                                                        {fileBreakdownData.data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                                    </Pie>
                                                    <RechartsTooltip formatter={(value: number, name: string) => [`${formatLargeNumber(value)} files`, name]} />
                                                    <Legend verticalAlign="bottom" height={36} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        )
                                        : renderNotAvailableMessage("File breakdown data not applicable or available.") // Adjusted message
                                }
                            </div>
                        </div>

                        {/* Table Size History Line Chart */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="text-xl font-semibold text-black mb-2">Table Size History</div>
                            <div className="text-sm text-gray-500 font-semibold mb-4">Total table size across snapshots</div>
                            <div style={{ height: '240px' }}>
                                {!response ? <div className="h-full flex items-center justify-center">{renderLoadingPulse('w-full')}</div>
                                    : historyChartData.hasData ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={historyChartData.data} margin={{ top: 5, right: 10, left: 10, bottom: 30 }}>
                                                <CartesianGrid strokeDasharray="2 2" vertical={false} />
                                                <XAxis dataKey="dateLabel" fontSize={10} angle={-45} textAnchor="end" height={40} interval="preserveStartEnd" /* Adjusted interval */ />
                                                <YAxis fontSize={10} unit={historyChartData.unit} width={55}>
                                                     {/* Adjusted label style */}
                                                    <Label value={`Size (${historyChartData.unit})`} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: '11px', fill: '#666' }} offset={-5} />
                                                </YAxis>
                                                <RechartsTooltip content={<HistoryTooltip />} />
                                                <Line type="monotone" dataKey="displaySize" stroke={CHART_COLORS[1]} strokeWidth={2} dot={historyChartData.data.length < 20} name={`Size (${historyChartData.unit})`} />
                                            </LineChart>
                                        </ResponsiveContainer>)
                                    : renderNotAvailableMessage("Snapshot history data not applicable or available.") // Adjusted message
                               }
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* File Metrics Summary Section - Always show */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6"> {/* Added mb-6 */}
                <div className="text-xl font-semibold text-black mb-2">File Metrics Summary</div>
                <div className="text-sm text-gray-500 font-semibold mb-4">Average and total values</div>
                {!response ? (
                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-4">{renderLoadingPulse('w-3/4')}<br />{renderLoadingPulse('w-1/2')}</div>
                        <div className="space-y-4">{renderLoadingPulse('w-3/4')}<br />{renderLoadingPulse('w-1/2')}</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        {/* Column 1 */}
                        <div className="space-y-4">
                            <div><div className="text-sm font-medium text-gray-600">Avg. File Size</div><div className="mt-1 text-lg font-mono">{avgFileSizeMB !== undefined ? `${avgFileSizeMB.toFixed(2)} MB` : 'N/A'}</div><div className="text-xs text-gray-500">per data file</div></div>
                            {/* Hide delete file metrics if format is Parquet OR if no delete files */}
                             {!isParquet && keyMetrics?.total_delete_files !== undefined && keyMetrics.total_delete_files > 0 && (
                                 <div><div className="text-sm font-medium text-gray-600">Delete Files</div><div className="mt-1 text-lg font-mono">{formatLargeNumber(keyMetrics.total_delete_files)} ({formatFileSize(keyMetrics.total_delete_storage_bytes || 0)})</div><div className="text-xs text-gray-500">Count & Total Size</div></div>
                             )}
                        </div>
                        {/* Column 2 */}
                        <div className="space-y-4">
                            <div><div className="text-sm font-medium text-gray-600">Total Storage</div><div className="mt-1 text-lg font-mono">{totalStorageBytes !== undefined ? formatFileSize(totalStorageBytes) : 'N/A'}</div><div className="text-xs text-gray-500">for data files</div></div>
                             {/* Use globalFormat for Primary File Type */}
                            <div><div className="text-sm font-medium text-gray-600">Primary File Type</div><div className="mt-1 text-lg font-mono">{primaryFileType}</div><div className="text-xs text-gray-500">Format</div></div>

                             {/* Storage Efficiency might be less relevant, keep or hide based on preference */}
                             {/* <div><div className="text-sm font-medium text-gray-600">Storage Efficiency</div><div className="mt-1 text-lg font-mono">{(approxLiveRecords !== undefined && totalStorageBytes !== undefined && totalStorageBytes > 0) ? `${(approxLiveRecords / (totalStorageBytes / (1024 * 1024))).toFixed(0)}` : 'N/A'}</div><div className="text-xs text-gray-500">records per MB (approx.)</div></div> */}
                         </div>
                    </div>
                )}
                 <div className="text-xs text-gray-400 mt-4 italic"> Note: Detailed distributions per range or Min/Max values per file are not available from this summary. </div>
            </div>

             {/* Optional: Informational message for Parquet */}
             {isParquet && (
                 <div className="p-4 mb-6 text-sm text-neutral-600 bg-blue-50 rounded border border-blue-200">
                    <i className="ri-information-line mr-2 align-middle"></i>
                    File count breakdown (Data vs. Delete) and table size history charts are specific to table formats (Iceberg, Delta) and are not applicable to standard Parquet files.
                </div>
            )}

        </div>
    );
}