import React, { useState } from 'react';
import { TableMetadata } from '@shared/schema';
import { useTableSampleData } from '@/hooks/useTableMetadata';

interface SampleDataViewerProps {
  metadata: TableMetadata;
}

export default function SampleDataViewer({ metadata }: SampleDataViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  // Fetch sample data using the hook
  const { data: sampleData, isLoading, isError, error } = useTableSampleData(
    metadata.location,
    metadata.format
  );
  
  // If there's an error or no data
  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
        <div className="text-3xl text-red-500 mb-2">
          <i className="ri-error-warning-line"></i>
        </div>
        <h3 className="text-lg font-medium text-neutral-700">Error Loading Sample Data</h3>
        <p className="text-neutral-500 mt-1">{error?.message || "Failed to load sample data."}</p>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Check if we have sample data
  const samples = metadata.sampleData || [];
  if (samples.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
        <div className="text-3xl text-neutral-400 mb-2">
          <i className="ri-file-list-3-line"></i>
        </div>
        <h3 className="text-lg font-medium text-neutral-700">No Sample Data Available</h3>
        <p className="text-neutral-500 mt-1">Sample data could not be found for this table.</p>
      </div>
    );
  }
  
  // Get all unique column names from the sample data
  const allColumns = Array.from(
    new Set(
      samples.flatMap(sample => Object.keys(sample))
    )
  );
  
  // Calculate pagination
  const totalPages = Math.ceil(samples.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, samples.length);
  const currentRows = samples.slice(startIndex, endIndex);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
      <div className="flex justify-between items-center p-4 border-b border-neutral-200">
        <h2 className="text-base font-medium">Sample Data</h2>
        <div className="flex space-x-2">
          <button className="text-sm text-neutral-600 flex items-center hover:text-primary">
            <i className="ri-download-2-line mr-1"></i>
            Export CSV
          </button>
          <button className="text-sm text-neutral-600 flex items-center hover:text-primary">
            <i className="ri-code-line mr-1"></i>
            View as JSON
          </button>
        </div>
      </div>

      {/* Sample data table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              {allColumns.map(column => (
                <th 
                  key={column} 
                  scope="col" 
                  className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {currentRows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'bg-neutral-50' : ''}>
                {allColumns.map(column => (
                  <td key={`${rowIndex}-${column}`} className="px-4 py-3 text-sm text-neutral-700">
                    {formatCellValue(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-3 border-t border-neutral-200 bg-neutral-50">
          <div className="text-sm text-neutral-500">
            Showing {startIndex + 1} to {endIndex} of {samples.length} records
          </div>
          <div className="flex space-x-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 text-sm rounded-md ${
                currentPage === 1
                  ? 'text-neutral-400 cursor-not-allowed'
                  : 'text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentPage === page
                    ? 'bg-primary text-white'
                    : 'text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 text-sm rounded-md ${
                currentPage === totalPages
                  ? 'text-neutral-400 cursor-not-allowed'
                  : 'text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format cell values based on their type
function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `[Array: ${value.length} items]`;
    }
    return JSON.stringify(value);
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  return String(value);
}
