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

interface StorageDistributionChartProps {
  responseData: any; // Use specific type if available
}

// Define colors for the categories we can extract
const COLORS = {
  'Data Files': '#3B82F6', // Blue
  'Delete Files': '#EF4444', // Red (or another distinct color)
  // Add more if other categories become available
};

export default function StorageDistributionChart({ responseData }: StorageDistributionChartProps) {

  const metrics = responseData?.key_metrics;
  let chartData = [];

  if (metrics) {
      const dataSize = metrics.total_data_storage_bytes ?? 0;
      const deleteSize = metrics.total_delete_storage_bytes ?? 0;

      // Add data files if size > 0
      if (dataSize > 0) {
          chartData.push({ name: 'Data Files', value: dataSize });
      }
      // Add delete files if size > 0
      if (deleteSize > 0) {
          chartData.push({ name: 'Delete Files', value: deleteSize });
      }

      // NOTE: Manifest file size and other metadata size are not available 
      // in the provided key_metrics. This chart only reflects data/delete file storage.
      // If these sizes become available, add them here.
      // e.g., const manifestSize = metrics.total_manifest_storage_bytes ?? 0;
      // if (manifestSize > 0) chartData.push({ name: 'Manifest Files', value: manifestSize });
  }

  // Ensure total value is > 0 before rendering chart
  const totalValue = chartData.reduce((sum, entry) => sum + entry.value, 0);


  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
      <h3 className="text-sm font-medium mb-4">Storage Distribution (Data & Delete Files)</h3> 
      {/* Title adjusted to reflect data limitation */}

      {totalValue > 0 ? (
        <div className="h-64"> {/* Ensure height is defined */}
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData} // Use the extracted data
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80} // Adjust as needed
                fill="#8884d8" // Default fill (overridden by Cells)
                dataKey="value" // Key for the slice value
                nameKey="name" // Key for the slice name (used by Legend/Tooltip)
              >
                {/* Map data entries to Cells with specific colors */}
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#cccccc'} /> // Use defined colors, fallback to gray
                ))}
              </Pie>
              {/* Tooltip to show formatted size on hover */}
              <Tooltip formatter={(value: number) => formatBytes(value)} /> 
              {/* Legend to identify slices */}
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
         // Show message if no storage data is available or total is zero
         <div className="text-center text-neutral-500 py-8 h-64 flex items-center justify-center">
            Storage distribution data unavailable or size is zero.
         </div>
      )}
    </div>
  );
}