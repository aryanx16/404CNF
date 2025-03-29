// src/components/table-viewers/FilesViewer.tsx
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input'; // Assuming path is correct
import {
    ResponsiveContainer,
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Label
} from 'recharts';
import { formatLargeNumber, formatFileSize } from '@/lib/formatUtils'; // Assuming path is correct
import { useRecoilValue } from 'recoil';
import { metadataAtom, MetadataState } from '@/atoms/metadataAtom'; // Assuming path and corrected atom definition
import { formatAtom } from '@/atoms/formatAtom'; // Assuming path is correct
import { FilesViewerSkeleton } from '../skeleton/FilesViewerSkeleton'; // *** IMPORT SKELETON ***

// --- Helper Functions --- (Keep formatBytesForChart, formatTimestampForAxis, HistoryTooltip as before)
type ChartUnitInfo = { value: number; unit: 'Bytes' | 'KB' | 'MB' | 'GB' };
const formatBytesForChart = (bytes: number): ChartUnitInfo => { /* ... implementation ... */
    if (bytes === undefined || bytes === null || isNaN(bytes) || bytes <= 0) return { value: 0, unit: 'Bytes' };
    if (bytes < 1024 * 1024) return { value: parseFloat((bytes / 1024).toFixed(1)), unit: 'KB' };
    if (bytes < 1024 * 1024 * 1024) return { value: parseFloat((bytes / (1024 * 1024)).toFixed(1)), unit: 'MB' };
    return { value: parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(1)), unit: 'GB' };
};
const formatTimestampForAxis = (timestampMs: number): string => { /* ... implementation ... */
    if (!timestampMs || isNaN(timestampMs)) return '';
    try {
        const date = new Date(timestampMs);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return ''; }
};
const HistoryTooltip = ({ active, payload, label }: any) => { /* ... implementation ... */
     if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white dark:bg-gray-900 p-2 border border-gray-300 dark:border-gray-700 shadow-lg rounded text-sm max-w-xs overflow-hidden">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{`Date: ${data.dateLabel}`}</p>
                <p className="text-gray-700 dark:text-gray-300">{`Total Size: ${formatFileSize(data.totalSizeRaw)}`}</p>
                <p className="text-gray-700 dark:text-gray-300">{`Total Files: ${formatLargeNumber(data.totalFiles)}`}</p>
                <p className="text-gray-700 dark:text-gray-300 capitalize">{`Operation: ${data.operation || 'N/A'}`}</p>
            </div>
        );
    }
    return null;
};


// --- FilesViewer Component ---
export default function FilesViewer() {
    // --- Hooks ---
    const [searchTerm, setSearchTerm] = useState('');
    const { loading, error, data: dataPayload } = useRecoilValue(metadataAtom);
    const globalFormat = useRecoilValue(formatAtom);
    const isParquet = globalFormat && globalFormat.toLowerCase() === 'parquet';

    // --- Memos --- (Keep historyChartData and fileBreakdownData useMemo hooks as before)
    const historyChartData = useMemo(() => { /* ... implementation ... */
        if (isParquet || !dataPayload?.version_history?.snapshots_overview) {
           return { data: [], unit: 'MB', divisor: 1024 * 1024, hasData: false };
       }
       const history = dataPayload.version_history.snapshots_overview;
       if (!Array.isArray(history) || history.length === 0) {
            return { data: [], unit: 'MB', divisor: 1024 * 1024, hasData: false };
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
                timestampMs: timestamp, dateLabel: formatTimestampForAxis(timestamp),
                totalSizeRaw: totalSize, displaySize: displaySize, totalFiles: totalFiles,
                operation: snap.summary?.operation || 'unknown'
            };
       });
       return { data: chartData, unit: unit, divisor: divisor, hasData: chartData.length > 0 };
    }, [dataPayload, isParquet]);

    const fileBreakdownData = useMemo(() => { /* ... implementation ... */
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
        const hasValidData = chartData.length > 0 && chartData.some(d => d.value > 0);
        return { data: chartData, hasData: hasValidData };
    }, [dataPayload, isParquet]);

    // --- Other Derived Data --- (Keep calculations as before)
    const keyMetrics = dataPayload?.key_metrics;
    const current_snapshot_summary = dataPayload?.version_history?.current_snapshot_summary?.summary;
    const primaryFileType = globalFormat || dataPayload?.table_type || 'Unknown';
    const avgFileSizeMB = keyMetrics?.avg_data_file_size_mb;
    const approx_live_records = current_snapshot_summary
        ? Number(current_snapshot_summary?.['total-records'] || 0) - Number(current_snapshot_summary?.['total-position-deletes'] || 0)
        : keyMetrics?.approx_live_records;
    const total_data_files = current_snapshot_summary
        ? Number(current_snapshot_summary?.['total-data-files'] || 0)
        : keyMetrics?.total_data_files;
    const total_delete_files = current_snapshot_summary
        ? Number(current_snapshot_summary?.['total-delete-files'] || 0)
        : keyMetrics?.total_delete_files;
    const avgRecordsPerFile = (approx_live_records !== undefined && total_data_files !== undefined && total_data_files > 0)
        ? approx_live_records / total_data_files : undefined;
    const totalStorageBytes = keyMetrics?.total_data_storage_bytes;

    // --- Constants --- (Keep as before)
    const PIE_CHART_COLORS = ['#0088FE', '#FF8042', '#00C49F', '#FFBB28', '#AF19FF'];
    const LINE_CHART_COLOR = '#34D399';

    // --- Render Helpers ---
    /** Renders a pulsing placeholder element - slightly improved styling */
    const renderLoadingPulse = (className = 'h-4 w-full') => (
        <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md ${className}`}></div>
    );
    /** Renders a centered message for unavailable data/charts */
    const renderNotAvailableMessage = (message: string) => ( /* ... implementation ... */
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm p-4 text-center">{message}</div>
    );


    // --- Loading State ---
    // *** USE SKELETON SCREEN FOR INITIAL LOAD ***
    if (loading && !dataPayload) {
        return <FilesViewerSkeleton />;
    }

    // --- Error State ---
    if (error && !dataPayload) { // Keep error state for initial load failure
        return (
            <div className="p-4 flex flex-col items-center justify-center min-h-[400px] text-red-600">
                <i className="ri-error-warning-line text-4xl mb-2"></i>
                <p>Error loading file data.</p>
                {error.message && <p className="text-sm mt-1">{error.message}</p>}
            </div>
        );
    }

    // --- No Data State ---
    if (!loading && !error && !dataPayload) { // Keep no data state
        return (
            <div className="p-4 flex flex-col items-center justify-center min-h-[400px] text-neutral-500 dark:text-neutral-400">
                 <i className="ri-inbox-2-line text-4xl mb-2"></i>
                <p>No file analysis data available.</p>
            </div>
        );
    }

    // --- Component Render (Data available OR loading during refresh) ---
    return (
        <div className="p-4 space-y-6">
            {/* Header */}
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
                 {/* Use pulse for title only if dataPayload potentially missing during refresh (unlikely here) */}
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {loading && !primaryFileType ? renderLoadingPulse('h-8 w-32') : 'File Analysis'}
                </h1>
                <div className="flex items-center space-x-2">
                    <Input disabled type="text" placeholder="Search files..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-xs cursor-not-allowed bg-gray-100 dark:bg-gray-800" />
                    <select disabled className="border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-500 dark:text-gray-400"> <option>Sort by...</option> </select>
                </div>
            </div>

            {/* Key Metrics Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Files Card */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="text-base font-medium text-gray-600 dark:text-gray-400">Total Files</div>
                    <div className="text-2xl font-semibold font-mono text-gray-900 dark:text-gray-100 mt-1 min-h-[2rem]"> {/* Added min-h */}
                        {loading && (total_data_files === undefined || total_delete_files === undefined)
                            ? renderLoadingPulse('h-6 w-20') // Adjust size
                            : formatLargeNumber((total_data_files ?? 0) + (total_delete_files ?? 0))
                        }
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 min-h-[1rem]"> {/* Added min-h */}
                        Data ({loading && total_data_files === undefined ? '...' : formatLargeNumber(total_data_files ?? 0)})
                        {!isParquet && total_delete_files !== undefined && total_delete_files > 0 &&
                            ` + Delete (${loading && total_delete_files === undefined ? '...' : formatLargeNumber(total_delete_files ?? 0)})`
                        }
                         {isParquet && ' (N/A for Parquet)'}
                    </div>
                </div>
                {/* Total Records Card */}
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="text-base font-medium text-gray-600 dark:text-gray-400">Total Records</div>
                    <div className="text-2xl font-mono font-semibold text-gray-900 dark:text-gray-100 mt-1 min-h-[2rem]">
                        {loading && approx_live_records === undefined ? renderLoadingPulse('h-6 w-24') : formatLargeNumber(approx_live_records ?? 0)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Approx. live records</div>
                </div>
                {/* Avg Records/File Card */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="text-base font-medium text-gray-600 dark:text-gray-400">Avg Records/File</div>
                    <div className="text-2xl font-mono font-semibold text-gray-900 dark:text-gray-100 mt-1 min-h-[2rem]">
                        {loading && avgRecordsPerFile === undefined ? renderLoadingPulse('h-6 w-16') : (avgRecordsPerFile !== undefined ? formatLargeNumber(avgRecordsPerFile) : 'N/A')}
                    </div>
                     <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg live records / data file</div>
                </div>
                {/* Avg File Size Card */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="text-base font-medium text-gray-600 dark:text-gray-400">Avg File Size</div>
                    <div className="text-2xl font-mono font-semibold text-gray-900 dark:text-gray-100 mt-1 min-h-[2rem]">
                        {loading && avgFileSizeMB === undefined ? renderLoadingPulse('h-6 w-20') : (avgFileSizeMB !== undefined ? `${avgFileSizeMB.toFixed(1)} MB` : 'N/A')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg data file size</div>
                </div>
            </div>

            {/* File Visualizations Section */}
            {!isParquet && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">File Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* File Breakdown Pie Chart Card */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">File Count Breakdown</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Data files vs. Delete files</p>
                             {/* Ensure chart container maintains height */}
                            <div className="h-[240px] w-full">
                                {loading && !fileBreakdownData.hasData ? (
                                     // Use a pulse that better represents the chart area during refresh
                                     <div className="h-full w-full flex items-center justify-center">
                                        <renderLoadingPulse className="h-48 w-48 rounded-full" />
                                     </div>
                                ) : fileBreakdownData.hasData ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            {/* ... PieChart contents ... */}
                                             <Pie data={fileBreakdownData.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''} fontSize={11} >
                                                {fileBreakdownData.data.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />))}
                                            </Pie>
                                            <RechartsTooltip formatter={(value: number, name: string) => [`${formatLargeNumber(value)} files`, name]} wrapperStyle={{ zIndex: 10 }} />
                                            <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : ( renderNotAvailableMessage("File breakdown data not applicable or available.") )}
                            </div>
                        </div>

                        {/* Table Size History Line Chart Card */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                             <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Table Size History</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Total table size across snapshots</p>
                            <div className="h-[240px] w-full">
                                {loading && !historyChartData.hasData ? (
                                     // Use a pulse that better represents the chart area
                                    <div className="h-full w-full flex items-center justify-center">
                                        <renderLoadingPulse className="h-full w-full" />
                                    </div>
                                ) : historyChartData.hasData ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={historyChartData.data} margin={{ top: 5, right: 5, left: 15, bottom: 35 }}>
                                           {/* ... LineChart contents ... */}
                                           <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                                           <XAxis dataKey="dateLabel" fontSize={10} angle={-40} textAnchor="end" height={45} interval="preserveStartEnd" tick={{ fill: '#6b7280' }} />
                                           <YAxis fontSize={10} width={55} tick={{ fill: '#6b7280' }} tickFormatter={(value) => formatLargeNumber(value)} >
                                               <Label value={`Size (${historyChartData.unit})`} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: '11px', fill: '#666' }} offset={-5} />
                                           </YAxis>
                                           <RechartsTooltip content={<HistoryTooltip />} cursor={{ strokeDasharray: '3 3' }} wrapperStyle={{ zIndex: 10 }} />
                                           <Line type="monotone" dataKey="displaySize" stroke={LINE_CHART_COLOR} strokeWidth={2} dot={historyChartData.data.length < 30 ? { r: 3, strokeWidth: 1, fill: LINE_CHART_COLOR } : false} activeDot={{ r: 5 }} name={`Size (${historyChartData.unit})`} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : ( renderNotAvailableMessage("Snapshot history data not applicable or available.") )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* File Metrics Summary Section */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">File Metrics Summary</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Average and total values from the latest analysis</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-4">
                    {/* Column 1 */}
                    <div className="space-y-4">
                        <div className="min-h-[3.5rem]"> {/* Added min-h */}
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Data File Size</div>
                            <div className="mt-1 text-lg font-mono text-gray-900 dark:text-gray-100">
                                {loading && avgFileSizeMB === undefined ? renderLoadingPulse('h-6 w-20') : (avgFileSizeMB !== undefined ? `${avgFileSizeMB.toFixed(1)} MB` : 'N/A')}
                            </div>
                        </div>
                        {!isParquet && total_delete_files !== undefined && total_delete_files > 0 && (
                            <div className="min-h-[3.5rem]"> {/* Added min-h */}
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Delete Files</div>
                                <div className="mt-1 text-lg font-mono text-gray-900 dark:text-gray-100">
                                     {loading && (keyMetrics?.total_delete_files === undefined || keyMetrics?.total_delete_storage_bytes === undefined)
                                        ? renderLoadingPulse('h-6 w-24')
                                        : `${formatLargeNumber(keyMetrics?.total_delete_files ?? 0)} (${formatFileSize(keyMetrics?.total_delete_storage_bytes ?? 0)})`
                                     }
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Count & Total Size</div>
                            </div>
                        )}
                    </div>
                    {/* Column 2 */}
                    <div className="space-y-4">
                         <div className="min-h-[3.5rem]"> {/* Added min-h */}
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Data Storage</div>
                            <div className="mt-1 text-lg font-mono text-gray-900 dark:text-gray-100">
                                {loading && totalStorageBytes === undefined ? renderLoadingPulse('h-6 w-20') : (totalStorageBytes !== undefined ? formatFileSize(totalStorageBytes) : 'N/A')}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Combined size of data files</div>
                        </div>
                        <div className="min-h-[3.5rem]"> {/* Added min-h */}
                             <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Primary File Type</div>
                             <div className="mt-1 text-lg font-mono text-gray-900 dark:text-gray-100">
                                 {loading && !primaryFileType ? renderLoadingPulse('h-6 w-16') : primaryFileType}
                             </div>
                         </div>
                    </div>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 italic">
                    Note: Detailed distributions (e.g., size ranges) or Min/Max values per file require deeper analysis beyond this summary.
                </div>
            </div>

            {/* Informational message for Parquet */}
            {isParquet && ( /* ... message div ... */
                 <div className="p-3 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800 flex items-start gap-2">
                    <i className="ri-information-line mt-0.5 flex-shrink-0" aria-hidden="true"></i>
                    <span>
                        File count breakdown (Data vs. Delete) and table size history charts are typically associated with table formats like Apache Iceberg or Delta Lake, not standard Parquet file listings. Key metrics are based on available Parquet metadata.
                    </span>
                </div>
            )}

        </div>
    );
}