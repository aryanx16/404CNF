import React from 'react';
import { 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell, 
    Tooltip, 
    Legend 
} from 'recharts'; // Ensure recharts is installed
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
  'Data Files': '#3B82F6',        // Blue-500
  'Manifest Files': '#10B981',    // Emerald-500
  'Other (Delete Files)': '#F59E0B', // Amber-500 (Changed from Red for better distinction if needed)
  // Add more if other categories become available
};

// Custom Tooltip Content for better formatting
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white border border-neutral-300 shadow-sm rounded-md p-2 text-sm">
        <p className="font-medium">{`${data.name}`}</p>
        <p className="text-neutral-600">{`Size: ${formatBytes(data.value)}`}</p>
        {/* Optionally add percentage */}
        {/* <p className="text-neutral-500">{`(${(data.percent * 100).toFixed(1)}%)`}</p> */}
      </div>
    );
  }
  return null;
};


export default function StorageDistributionChart({ responseData }: StorageDistributionChartProps) {

  const metrics = responseData?.key_metrics;
  const tableType = responseData?.table_type?.toLowerCase();
  let chartData = [];

  // --- Calculate sizes for categories ---
  let dataSize = 0;
  let manifestSize = 0;
  let otherSize = 0; // Primarily delete files for Iceberg

  if (metrics) {
    dataSize = metrics.total_data_storage_bytes ?? 0;
    // Use delete storage bytes for the "Other" category
    otherSize = metrics.total_delete_storage_bytes ?? 0; 
  }

  // Calculate total manifest/log file size
  const manifestFileArray = tableType === 'iceberg' 
                            ? responseData?.iceberg_manifest_files 
                            : responseData?.delta_log_files;

  if (manifestFileArray && Array.isArray(manifestFileArray)) {
      manifestSize = manifestFileArray.reduce((sum, file) => {
          // Add size only if it's a valid positive number
          const size = file?.size_bytes;
          return sum + (typeof size === 'number' && size > 0 ? size : 0);
      }, 0);
  }

  // --- Build chartData array ---
  if (dataSize >= 0) {
    chartData.push({ name: 'Data Files', value: dataSize });
  }
  if (manifestSize >= 0) {
    chartData.push({ name: 'Manifest Files', value: manifestSize });
  }
  if (otherSize >= 0) {
    // Use a more descriptive name if 'Other' only contains delete files
    chartData.push({ name: 'Other (Delete Files)', value: otherSize }); 
  }

  const totalValue = chartData.reduce((sum, entry) => sum + entry.value, 0);


  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
      {/* Updated Title */}
      <h3 className="text-sm font-medium mb-4">Storage Distribution</h3> 

      {totalValue > 0 ? (
        <div className="h-64 w-full"> {/* Use w-full for responsiveness */}
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                 // Adjust radius based on container size/preference
                innerRadius={40} 
                outerRadius={85} 
                fill="#8884d8"
                paddingAngle={chartData.length > 1 ? 2 : 0} // Add padding if multiple slices
                dataKey="value"
                nameKey="name"
                // Optional: Add labels to slices if desired
                // label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} 
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name as keyof typeof COLORS] || '#CCCCCC'} // Typed color access
                    stroke={COLORS[entry.name as keyof typeof COLORS] || '#CCCCCC'} // Add stroke for definition
                    /> 
                ))}
              </Pie>
              {/* Use Custom Tooltip */}
              <Tooltip content={<CustomTooltip />} /> 
              {/* Legend layout can be adjusted */}
              <Legend verticalAlign="bottom" height={36}/> 
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