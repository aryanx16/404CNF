import React, { useState, useMemo } from 'react';
// Removed TableMetadata import
// import { TableMetadata } from '@shared/schema';
// Removed unused hook import
// import { useTableSampleData } from '@/hooks/useTableMetadata';
import { useRecoilValue } from 'recoil';
import { metadataAtom } from '@/atoms/metadataAtom';
import { formatLargeNumber } from '@/lib/formatUtils'; // Assuming you might need this

// Interface no longer needs metadata prop
interface SampleDataViewerProps {
  // metadata: TableMetadata; // Removed prop
}

// Helper function to format cell values based on their type
function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return '<span class="text-neutral-400 italic">NULL</span>';
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `<span class="text-blue-600">[${value.length} items]</span>`;
    }
    return `<span class="text-purple-600">${JSON.stringify(value)}</span>`;
  }
  if (typeof value === 'boolean') {
    return value ? '<span class="text-green-600 font-medium">true</span>' : '<span class="text-red-600 font-medium">false</span>';
  }
  if (typeof value === 'number') {
     // Optional: Format large numbers if needed
     // if (value > 10000 || value < -10000) { return `<span class="text-teal-700">${formatLargeNumber(value)}</span>`; }
     return `<span class="text-teal-700">${value}</span>`;
  }
  return String(value);
}


export default function SampleDataViewer(/* { metadata }: SampleDataViewerProps */) {
  // --- Hooks ---
  const [currentPage, setCurrentPage] = useState(1);
  const response = useRecoilValue(metadataAtom);

  // --- Constants ---
  const rowsPerPage = 10;

  // --- Derive state ---
  const responseData = response?.data;
  const samples = responseData?.sample_data || [];
  const schemaFields = responseData?.table_schema?.fields; // Get schema fields

  // --- Get Columns based on Schema ID Order ---
  const allColumns = useMemo(() => {
    if (!Array.isArray(schemaFields) || schemaFields.length === 0) {
        if (!Array.isArray(samples) || samples.length === 0) return [];
        console.warn("SampleDataViewer: No schema found, deriving columns from sample data.");
        return Array.from(new Set(samples.flatMap(sample => Object.keys(sample || {}))));
    }
    try {
        return [...schemaFields]
              .sort((a, b) => (a.id ?? Infinity) - (b.id ?? Infinity))
              .map(field => field.name);
    } catch (error) {
        console.error("Error processing schema fields:", error);
        if (!Array.isArray(samples) || samples.length === 0) return [];
        return Array.from(new Set(samples.flatMap(sample => Object.keys(sample || {}))));
    }
  }, [schemaFields, samples]);

  // --- Loading/Error Handling ---
  if (!response || !responseData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
        <div className="text-neutral-500">No Sample Data Available</div>
      </div>
    );
  }

  // --- No Sample Data State ---
  if (samples.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
        <div className="text-3xl text-neutral-400 mb-2"> <i className="ri-table-line"></i> </div>
        <h3 className="text-lg font-medium text-neutral-700">No Sample Data Available</h3>
        <p className="text-neutral-500 mt-1">Sample data could not be found in the table metadata.</p>
      </div>
    );
  }

  // --- Calculate Pagination ---
  const totalPages = Math.ceil(samples.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, samples.length);
  const currentRows = samples.slice(startIndex, endIndex);

  // --- Render Logic ---
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-neutral-200">
        <h2 className="text-base font-semibold text-neutral-800">Sample Data</h2>
        <div className="flex space-x-3">
          <button className="text-sm text-neutral-600 flex items-center hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled title="Functionality not implemented">
            <i className="ri-download-2-line mr-1"></i> Export CSV
          </button>
          <button className="text-sm text-neutral-600 flex items-center hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled title="Functionality not implemented">
            <i className="ri-code-s-slash-line mr-1"></i> View as JSON
          </button>
        </div>
      </div>

      {/* Sample data table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50/80">
            <tr>
             {/* Render headers based on schema-ordered allColumns */}
              {allColumns.map(column => (
                <th key={column} scope="col" className="sticky top-0 px-4 py-2.5 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider bg-neutral-50/80 z-10" >
                    {/* FIX: Display column name directly without modification */}
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-100">
            {currentRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-neutral-50 transition-colors duration-150">
                 {/* Render cells based on schema-ordered allColumns */}
                {allColumns.map(column => (
                  <td key={`${rowIndex}-${column}`} className="px-4 py-2.5 whitespace-nowrap text-sm text-neutral-800 font-mono">
                      {/* Access row data using the ordered column name */}
                    <span dangerouslySetInnerHTML={{ __html: formatCellValue(row?.[column]) }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-2 border-t border-neutral-200 bg-neutral-50/80 space-y-2 sm:space-y-0">
          <div className="text-xs text-neutral-500">
            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{endIndex}</span> of <span className="font-medium">{samples.length}</span> records
          </div>
          <div className="flex space-x-1">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} title="Previous page" className="px-2.5 py-1 text-sm rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed" >
              <i className="ri-arrow-left-s-line"></i>
            </button>
            <span className="px-3 py-1 text-xs font-medium text-neutral-600"> Page {currentPage} of {totalPages} </span>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} title="Next page" className="px-2.5 py-1 text-sm rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed" >
              <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}