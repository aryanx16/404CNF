import React from 'react';
import { useRecoilValue } from 'recoil';
import { metadataAtom } from '@/atoms/metadataAtom';

interface SchemaViewerProps {
  isPreview?: boolean;
  onChange: (tab: string) => void; // Added type definition for onChange
}

// Helper function to render potentially complex types as strings
const renderType = (type: any): string => {
  if (typeof type === 'string') {
    return type; // Simple types like "string", "int", "boolean", "timestamp", "date", "decimal(10, 2)"
  }
  if (typeof type === 'object' && type !== null) {
    switch (type.type) {
      case 'list':
        // Get the type of the elements within the list
        const elementType = type.element?.type; // Use optional chaining
        // Recursively render the element type
        return `list<${renderType(elementType)}>`;
      case 'map':
         // Get the key and value types
        const keyType = type.key;
        const valueType = type.value;
         // Recursively render key/value types (value might be complex too)
        return `map<${renderType(keyType)}, ${renderType(valueType)}>`;
      case 'struct':
         // For structs, just indicating 'struct' is often sufficient in a schema overview
         // You could potentially list field names but it might get too wide
        return 'struct';
      default:
         // Fallback for unrecognized object type structures
        return 'complex type'; // Or JSON.stringify(type) if you want to see the raw object string
    }
  }
  return 'unknown'; // Fallback for null, undefined, etc.
};


export default function SchemaViewer({ isPreview = false, onChange }: SchemaViewerProps) { // Added type annotation
  const response = useRecoilValue(metadataAtom);
  // Ensure response and deeper properties exist before accessing fields
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
        {/* Buttons - Add onClick handlers if needed */}
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
              {/* Optional: Add Doc column if useful */}
              {/* <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Description</th> */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {displayFields.map((field) => (
              // Use field.id as key if it's guaranteed unique, otherwise generate one if needed
              <tr key={field.id}>
                <td className="px-4 py-3 text-sm text-neutral-700 break-words">{field.name}</td>
                {/* Use the helper function to render the type */}
                <td className="px-4 py-3 text-sm text-neutral-500 break-words">
                  {renderType(field.type)}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500">
                  {/* Handle required field potentially being undefined/null */}
                  {field.required ? 'Yes' : 'No'}
                </td>
                 {/* Optional: Display documentation */}
                {/* <td className="px-4 py-3 text-sm text-neutral-500">{field.doc}</td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isPreview && fields.length > 5 && (
        <div className="p-3 text-center border-t border-neutral-200">
          {/* Ensure onChange is called correctly */}
          <button
            className="text-sm text-primary hover:text-blue-600"
            onClick={() => onChange("schema")} // Pass the correct identifier for the schema tab/view
          >
            View all {fields.length} fields
          </button>
        </div>
      )}
    </div>
  );
}