import React from 'react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend
} from 'recharts'; // Ensure recharts is installed
import { useRecoilValue } from 'recoil'; // Import useRecoilValue
import { formatAtom } from '@/atoms/formatAtom'; // Import the atom
import { formatBytes } from '@/lib/formatUtils'; // Assuming this utility exists

// Define a type for the expected responseData structure (simplified)
interface ResponseData {
    table_type?: string;
    iceberg_manifest_files?: Array<{ size_bytes?: number | null }>;
    delta_log_files?: Array<{ size_bytes?: number | null }>;
    key_metrics?: {
        total_data_storage_bytes?: number | null;
        total_delete_storage_bytes?: number | null;
        // Add other metrics if needed
    };
    // Add other expected top-level keys if needed
}

interface StorageDistributionChartProps {
    responseData: ResponseData | null; // Use specific type if available
}

// --- Updated COLORS for new categories ---
const COLORS = {
    'Data Files': '#3B82F6',       // Blue-500
    'Manifest Files': '#10B981',   // Emerald-500
    'Other (Delete Files)': '#F59E0B', // Amber-500
    // Add more if other categories become available
};

// Custom Tooltip Content for better formatting
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        // Ensure data.value is a number before formatting
        const value = typeof data.value === 'number' ? data.value : 0;
        return (
            <div className="bg-white border border-neutral-300 shadow-sm rounded-md p-2 text-sm">
                <p className="font-medium">{`${data.name}`}</p>
                <p className="text-neutral-600">{`Size: ${formatBytes(value)}`}</p>
                {/* Optionally add percentage */}
                {/* <p className="text-neutral-500">{`(${(data.percent * 100).toFixed(1)}%)`}</p> */}
            </div>
        );
    }
    return null;
};


export default function StorageDistributionChart({ responseData }: StorageDistributionChartProps) {
    // Get the global format from Recoil state
    const globalFormat = useRecoilValue(formatAtom);

    // --- Conditional Rendering based on format ---
    // If the format is Parquet, do not render this chart.
    // Use case-insensitive comparison for robustness.
    if (globalFormat && globalFormat.toLowerCase() === 'parquet') {
        // Return null to render nothing, or you could return a placeholder message:
        // return <div className="p-4 text-sm text-neutral-500">Storage distribution chart is not applicable for Parquet format.</div>;
        return null;
    }

    // --- Proceed with chart logic only if format is NOT Parquet ---

    const metrics = responseData?.key_metrics;
    // Determine table type from response, fallback if needed (though shouldn't be parquet here)
    const tableType = responseData?.table_type?.toLowerCase() || globalFormat?.toLowerCase();

    let chartData: { name: string; value: number }[] = []; // Add type

    // --- Calculate sizes for categories ---
    let dataSize = 0;
    let manifestSize = 0;
    let otherSize = 0; // Primarily delete files for Iceberg/Delta

    if (metrics) {
        dataSize = metrics.total_data_storage_bytes ?? 0;
        // Use delete storage bytes for the "Other" category (applicable to Iceberg/Delta)
        otherSize = metrics.total_delete_storage_bytes ?? 0;
    }

    // Calculate total manifest/log file size based on table type
    const manifestFileArray = tableType === 'iceberg'
        ? responseData?.iceberg_manifest_files
        : tableType === 'delta' // Explicitly check for delta for clarity
            ? responseData?.delta_log_files
            : []; // Default to empty array if type is unknown/unexpected

    if (manifestFileArray && Array.isArray(manifestFileArray)) {
        manifestSize = manifestFileArray.reduce((sum, file) => {
            const size = file?.size_bytes;
            return sum + (typeof size === 'number' && size > 0 ? size : 0);
        }, 0);
    }

    // --- Build chartData array (only include slices with size > 0 for clarity) ---
    if (dataSize > 0) {
        chartData.push({ name: 'Data Files', value: dataSize });
    }
    if (manifestSize > 0) {
         // Adjust name based on type if needed, e.g., 'Log Files' for Delta
         const manifestName = tableType === 'delta' ? 'Log Files' : 'Manifest Files';
        chartData.push({ name: manifestName, value: manifestSize });
        // Ensure COLORS object has the corresponding key (e.g., 'Log Files') if name changes
        // If keeping 'Manifest Files' generic:
        // chartData.push({ name: 'Manifest Files', value: manifestSize });
    }
    if (otherSize > 0) {
        // Keep the name descriptive
        chartData.push({ name: 'Other (Delete Files)', value: otherSize });
    }

    // Ensure COLORS keys match the names pushed into chartData
    // If using 'Log Files' for Delta, update COLORS:
    // const COLORS = { ... 'Log Files': '#10B981', ... };

    const totalValue = chartData.reduce((sum, entry) => sum + entry.value, 0);


    return (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
            <h3 className="text-sm font-medium mb-4">Storage Distribution</h3>

            {totalValue > 0 ? (
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                innerRadius={40}
                                outerRadius={85}
                                fill="#8884d8" // Default fill, overridden by Cell
                                paddingAngle={chartData.length > 1 ? 2 : 0}
                                dataKey="value"
                                nameKey="name"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        // Use type assertion for safety accessing COLORS
                                        fill={COLORS[entry.name as keyof typeof COLORS] || '#CCCCCC'} // Fallback color
                                        stroke={COLORS[entry.name as keyof typeof COLORS] || '#CCCCCC'}
                                        />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="text-center text-neutral-500 py-8 h-64 flex items-center justify-center">
                    Storage distribution data unavailable or size is zero.
                </div>
            )}
        </div>
    );
}