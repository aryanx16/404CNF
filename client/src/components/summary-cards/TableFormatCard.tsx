import React from 'react';
import { TableMetadata } from '@shared/schema';
import { getFormatIcon } from '@/lib/formatUtils';

interface TableFormatCardProps {
  metadata: TableMetadata;
}

export default function TableFormatCard({ metadata }: TableFormatCardProps) {
  const formatIcon = getFormatIcon(metadata.format as any);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-neutral-500">Table Format</h3>
          <p className="mt-1 text-lg font-semibold">{metadata.format.charAt(0).toUpperCase() + metadata.format.slice(1)}</p>
        </div>
        <div className="text-blue-500">
          <i className={`${formatIcon} text-2xl`}></i>
        </div>
      </div>
      <div className="mt-2 text-sm text-neutral-600">
        {metadata.properties?.formatVersion && (
          <p>Format Version: {metadata.properties.formatVersion}</p>
        )}
        {metadata.format === 'iceberg' && (
          <p>Spec: org.apache.iceberg.{metadata.properties?.formatVersion || 'v2'}</p>
        )}
        {metadata.format === 'delta' && (
          <p>Spec: io.delta.{metadata.properties?.formatVersion || 'v1'}</p>
        )}
        {metadata.format === 'hudi' && (
          <p>Type: {metadata.properties?.formatConfig?.["hoodie.table.type"] || 'COPY_ON_WRITE'}</p>
        )}
      </div>
    </div>
  );
}
