import React from 'react';
import { TableMetadata } from '@shared/schema';
import { getFormatIcon } from '@/lib/formatUtils';

interface TableFormatCardProps {
  metadata: TableMetadata;
}

import Pulse from '../skeleton/Pulse';

export default function TableFormatCard({ metadata, data }) {
  const tableFormat = data?.table_type.toLowerCase();
  const formatIcon = getFormatIcon(tableFormat);

  console.log(data);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-neutral-500">Table Format</h3>
          {
            tableFormat ? 
            <p className="mt-1 text-lg font-semibold">{tableFormat?.charAt(0).toUpperCase() + tableFormat?.slice(1)}</p>
            :
            <Pulse />
          }
        </div>
        <div className="text-blue-500">
          <i className={`${formatIcon} text-2xl`}></i>
        </div>
      </div>
      <div className="mt-2 text-sm text-neutral-600">
        {data?.format_version ? (
          <p>Format Version: {data?.format_version}</p>
        )
        :
        <></>
        }
        {tableFormat === 'iceberg' && (
          <p>Spec: org.apache.iceberg.{data?.format_version || 'v2'}</p>
        )}
        {tableFormat === 'delta' && (
          <p>Spec: io.delta.{metadata.properties?.formatVersion || 'v1'}</p>
        )}
        {tableFormat === 'hudi' && (
          <p>Type: {metadata.properties?.formatConfig?.["hoodie.table.type"] || 'COPY_ON_WRITE'}</p>
        )}
      </div>
    </div>
  );
}
