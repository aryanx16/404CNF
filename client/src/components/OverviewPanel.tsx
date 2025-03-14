
import { TableMetadata } from '@shared/schema';
import { formatLargeNumber } from '@/lib/formatUtils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface OverviewPanelProps {
  metadata: TableMetadata;
}

export default function OverviewPanel({ metadata }: OverviewPanelProps) {
  // Generate snapshot data
  const snapshotData = Array.from({ length: 10 }, (_, i) => ({
    snapshot: 1000 + i * 1000,
    files: Math.floor(10 + (i * 0.8)),
    records: Math.floor(1800000 + (i * 100000))
  }));

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-200">
          <h3 className="text-sm font-medium mb-4">Total Files</h3>
          <p className="text-lg font-semibold">{formatLargeNumber(metadata.fileCount)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-200">
          <h3 className="text-sm font-medium mb-4">Total Records</h3>
          <p className="text-lg font-semibold">{formatLargeNumber(metadata.recordCount)}</p>
        </div>
      </div>

      {/* Snapshot Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-200">
          <h3 className="text-sm font-medium mb-4">Snapshot Total Files</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshotData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="snapshot"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  fontSize={11}
                  tickLine={false}
                  domain={[0, 'auto']}
                />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="files" 
                  stroke="#4ade80"
                  fill="#bbf7d0"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-200">
          <h3 className="text-sm font-medium mb-4">Snapshot Total Records</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshotData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="snapshot"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  fontSize={11}
                  tickLine={false}
                  domain={[0, 'auto']}
                  tickFormatter={(value) => formatLargeNumber(value)}
                />
                <Tooltip formatter={(value: any) => formatLargeNumber(value)}/>
                <Area 
                  type="monotone" 
                  dataKey="records" 
                  stroke="#94a3b8"
                  fill="#e2e8f0"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
