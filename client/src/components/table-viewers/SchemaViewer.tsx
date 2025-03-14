import React from 'react';
import { TableMetadata, TableSchemaField } from '@shared/schema';

interface SchemaViewerProps {
  metadata: TableMetadata;
  isPreview?: boolean;
}

export default function SchemaViewer({ metadata, isPreview = false }: SchemaViewerProps) {
  const fields = metadata.schema?.fields || [];
  
  // If no schema data, show empty state
  if (!fields.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
        <div className="text-3xl text-neutral-400 mb-2">
          <i className="ri-file-list-3-line"></i>
        </div>
        <h3 className="text-lg font-medium text-neutral-700">No Schema Available</h3>
        <p className="text-neutral-500 mt-1">Schema information could not be found for this table.</p>
      </div>
    );
  }
  
  // For preview mode, only show a limited number of fields
  const displayFields = isPreview ? fields.slice(0, 5) : fields;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
      <div className="flex justify-between items-center p-4 border-b border-neutral-200">
        <h2 className="text-base font-medium">Schema Overview</h2>
        <div className="flex space-x-2">
          <button className="text-sm text-neutral-600 flex items-center hover:text-primary">
            <i className="ri-history-line mr-1"></i>
            View Schema History
          </button>
          <button className="text-sm text-neutral-600 flex items-center hover:text-primary">
            <i className="ri-code-line mr-1"></i>
            JSON Schema
          </button>
        </div>
      </div>

      {/* Schema Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Field Name</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nullable</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Partition Key</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Description</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {displayFields.map((field, index) => (
              <tr key={field.name} className={index % 2 === 1 ? 'bg-neutral-50' : ''}>
                <td className="px-4 py-3 text-sm font-medium text-neutral-900">{field.name}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{field.type}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{field.nullable ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{field.partitionKey ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{field.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Show "View more" button in preview mode if there are more fields */}
      {isPreview && fields.length > 5 && (
        <div className="p-3 text-center border-t border-neutral-200">
          <button className="text-sm cursor-not-allowed text-primary hover:text-blue-600">
            View all {fields.length} fields
          </button>
        </div>
      )}
    </div>
  );
}
