import React from 'react';
import { useRecoilValue } from 'recoil';
import { metadataAtom } from '@/atoms/metadataAtom';

interface SchemaViewerProps {
  isPreview?: boolean;
}

export default function SchemaViewer({ isPreview = false, onChange }) {
  const response = useRecoilValue(metadataAtom);
  const fields = response?.data?.table_schema?.fields || [];

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

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Field Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Required</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {displayFields.map((field) => (
              <tr key={field.id}>
                <td className="px-4 py-3 text-sm text-neutral-700">{field.name}</td>
                <td className="px-4 py-3 text-sm text-neutral-500">{field.type}</td>
                <td className="px-4 py-3 text-sm text-neutral-500">{field.required ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isPreview && fields.length > 5 && (
        <div className="p-3 text-center border-t border-neutral-200">
          <button className="text-sm text-primary hover:text-blue-600" onClick={() => onChange("schema")}>
            View all {fields.length} fields
          </button>
        </div>
      )}
    </div>
  );
}
