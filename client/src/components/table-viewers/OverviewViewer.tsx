import React from 'react'

import TableFormatCard from '../summary-cards/TableFormatCard';
import RowCountCard from '../summary-cards/RowCountCard';
import StorageSizeCard from '../summary-cards/StorageSizeCard';
import VersionCard from '../summary-cards/VersionCard';
import SchemaViewer from './SchemaViewer';
import VersionViewer from './VersionViewer';
import PartitionViewer from './PartitionViewer';
import PropertiesViewer from './PropertiesViewer';
import VersionHistoryChart from './VersionHistoryChart';
import StorageDistributionChart from './StorageDistributionChart';

const OverviewViewer = ({ metadata, responseData, onChange }) => {
  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <TableFormatCard metadata={metadata} data={responseData?.data}/>
        <RowCountCard metadata={metadata} data={responseData?.data} />
        <StorageSizeCard metadata={metadata} data={responseData?.data} />
        <VersionCard metadata={metadata} data={responseData?.data}/>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <StorageDistributionChart responseData={responseData?.data} />

        <VersionHistoryChart responseData={responseData?.data} />
      </div>

      {/* Schema Section */}
      <SchemaViewer metadata={metadata} isPreview={true} onChange={onChange} />

      {/* Schema History Preview (if versions exist) */}
      {metadata.versions && metadata.versions.length > 0 && (
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-medium">Schema History</h2>
              <a 
                className="text-sm text-primary flex items-center" 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  const tabNav = document.querySelector('button[data-value="schema-history"]');
                  if (tabNav) (tabNav as HTMLButtonElement).click();
                }}
              >
                <i className="ri-history-line mr-1"></i>
                View Full History
              </a>
            </div>

            <div className="text-sm text-neutral-600">
              <p>This table has {metadata.versions.length} recorded schema changes.</p>
              <p className="mt-1">Last updated: {metadata.versions[0]?.timestamp 
                ? new Date(metadata.versions[0].timestamp).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })
                : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Version History Preview */}
      <VersionViewer metadata={metadata} isPreview={true} responseData={responseData?.data} />

      {/* Partition Layout Preview */}
      <PartitionViewer metadata={metadata} isPreview={true} responseData={responseData?.data} />

      {/* Format Properties Preview */}
      <PropertiesViewer metadata={metadata} isPreview={true} responseData={responseData?.data} />
    </>
  )
}

export default OverviewViewer