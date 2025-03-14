import React, { useState } from 'react';
import { TableMetadata, TableVersion } from '@shared/schema';
import { timeAgo, formatDate } from '@/lib/formatUtils';

interface VersionViewerProps {
  metadata: TableMetadata;
  isPreview?: boolean;
}

export default function VersionViewer({ metadata, isPreview = false }: VersionViewerProps) {
  const versions = metadata.versions || [];
  const [showAllVersions, setShowAllVersions] = useState(false);
  
  // If no version data, show empty state
  if (!versions.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
        <div className="text-3xl text-neutral-400 mb-2">
          <i className="ri-history-line"></i>
        </div>
        <h3 className="text-lg font-medium text-neutral-700">No Version Information</h3>
        <p className="text-neutral-500 mt-1">
          {metadata.format === 'parquet' 
            ? 'Parquet format does not support versioning.' 
            : 'Version history could not be found for this table.'}
        </p>
      </div>
    );
  }
  
  // For preview mode, show a limited view
  const displayVersions = isPreview ? versions.slice(0, 3) : showAllVersions ? versions : versions.slice(0, 5);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
      <div className="flex justify-between items-center p-4 border-b border-neutral-200">
        <h2 className="text-base font-medium">Version Timeline</h2>
        <div className="flex space-x-2">
          <button className="text-sm text-neutral-600 flex items-center hover:text-primary">
            <i className="ri-filter-3-line mr-1"></i>
            Filter
          </button>
          {!isPreview && (
            <button className="text-sm text-primary border border-primary px-2 py-1 rounded flex items-center hover:bg-blue-50">
              <i className="ri-time-line mr-1"></i>
              View All Versions
            </button>
          )}
        </div>
      </div>

      {/* Timeline visualization */}
      <div className="p-4">
        <div className="relative">
          {/* Timeline */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200"></div>
          
          {/* Version items */}
          <div className="space-y-6 ml-12 relative pt-2 pb-4">
            {/* Map through versions to display */}
            {displayVersions.map((version, index) => (
              <div className="relative" key={version.id}>
                <div className={`absolute -left-12 mt-1 w-8 h-8 rounded-full ${
                  version.isLatest 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-neutral-200 text-neutral-500'
                } flex items-center justify-center shadow-sm`}>
                  {version.isLatest ? (
                    <i className="ri-check-line"></i>
                  ) : (
                    <span className="text-xs font-medium">{version.id}</span>
                  )}
                </div>
                <div className={`${
                  version.isLatest 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-white border-neutral-200'
                } border rounded-lg p-3`}>
                  <div className="flex justify-between items-start">
                    <div>
                      {version.isLatest && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Latest</span>
                      )}
                      <h3 className="text-sm font-medium mt-1">Version {version.id}</h3>
                    </div>
                    <span className="text-xs text-neutral-500">{formatDate(version.timestamp)}</span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">
                    {version.operation && (
                      <span className="capitalize">{version.operation}</span>
                    )}
                    {version.changes && Object.entries(version.changes).map(([key, value]) => {
                      if (key === 'rowsAdded' && typeof value === 'number') {
                        return ` Added ${value.toLocaleString()} rows`;
                      }
                      if (key === 'rowsDeleted' && typeof value === 'number') {
                        return ` Removed ${value.toLocaleString()} rows`;
                      }
                      if (key === 'rowsUpdated' && typeof value === 'number') {
                        return ` Updated ${value.toLocaleString()} rows`;
                      }
                      if (key === 'schemaChanged' && value === true) {
                        return ' Updated schema';
                      }
                      if (key === 'fieldsAdded' && Array.isArray(value)) {
                        return ` Added fields: ${value.join(', ')}`;
                      }
                      if (key === 'fieldsModified' && Array.isArray(value)) {
                        return ` Modified fields: ${value.join(', ')}`;
                      }
                      return '';
                    }).join(',')}
                  </p>
                  <div className="mt-2 flex space-x-3">
                    <button className={`text-xs ${version.isLatest ? 'text-blue-600 hover:text-blue-700' : 'text-neutral-500 hover:text-neutral-700'}`}>
                      View Manifest
                    </button>
                    <button className={`text-xs ${version.isLatest ? 'text-blue-600 hover:text-blue-700' : 'text-neutral-500 hover:text-neutral-700'}`}>
                      View Schema
                    </button>
                    {!version.isLatest && (
                      <button className={`text-xs ${version.isLatest ? 'text-blue-600 hover:text-blue-700' : 'text-neutral-500 hover:text-neutral-700'}`}>
                        Revert to this version
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* More versions indicator */}
            {!isPreview && versions.length > 5 && !showAllVersions && (
              <div className="relative">
                <div className="absolute -left-12 mt-1 w-8 h-8 rounded-full border-2 border-dashed border-neutral-300 flex items-center justify-center text-neutral-400">
                  <i className="ri-more-line"></i>
                </div>
                <button 
                  className="ml-2 text-sm text-neutral-500 hover:text-primary flex items-center"
                  onClick={() => setShowAllVersions(true)}
                >
                  Show earlier versions
                  <i className="ri-arrow-down-s-line ml-1"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Preview mode "View more" button */}
      {isPreview && versions.length > 3 && (
        <div className="p-3 text-center border-t border-neutral-200">
          <button className="text-sm text-primary hover:text-blue-600">
            View all {versions.length} versions
          </button>
        </div>
      )}
    </div>
  );
}
