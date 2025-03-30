import React from 'react';
import { useRecoilValue } from 'recoil'; // Import Recoil hook
import { formatAtom } from '@/atoms/formatAtom'; // Import Recoil atom

// Import Child Components
import TableFormatCard from '../summary-cards/TableFormatCard';
import RowCountCard from '../summary-cards/RowCountCard';
import StorageSizeCard from '../summary-cards/StorageSizeCard';
import VersionCard from '../summary-cards/VersionCard'; // Will be hidden for Parquet
import SchemaViewer from './SchemaViewer';
import VersionViewer from './VersionViewer';         // Will be hidden for Parquet
import PartitionViewer from './PartitionViewer';       // Will be hidden for Parquet
import PropertiesViewer from './PropertiesViewer';     // Keep this? Assume yes for now.
import VersionHistoryChart from './VersionHistoryChart'; // Will be hidden for Parquet
import StorageDistributionChart from './StorageDistributionChart'; // Will be hidden for Parquet (also hides itself)

// Define prop types for clarity (adjust types as needed based on actual data structure)
interface Metadata {
    // Define structure of metadata prop
    versions?: Array<{ timestamp?: number | string; /* other version props */ }>;
    // ... other metadata properties
}

interface ResponsePayload {
    // Define structure of the actual data within responseData
    table_type?: string;
    // ... other data properties
}

interface ResponseDataWrapper {
    data: ResponsePayload | null;
    // Potentially other Axios response properties like status, headers etc. if needed
}

interface OverviewViewerProps {
    metadata: Metadata;
    responseData: ResponseDataWrapper | null; // Assuming responseData is the Axios wrapper
    onChange: (change: any) => void; // Adjust 'any' type
}

const OverviewViewer: React.FC<OverviewViewerProps> = ({ metadata, responseData, onChange }) => {
    // Get format from Recoil
    const globalFormat = useRecoilValue(formatAtom);
    // Determine if format is Parquet (case-insensitive)
    const isParquet = globalFormat && globalFormat.toLowerCase() === 'parquet';

    // Extract the actual data payload, handle potential null/undefined
    const dataPayload = responseData?.data;

    // --- Early exit or loading/error state could be handled here or in parent ---
    // if (!dataPayload) {
    //     return <div className="p-4 text-neutral-500">Loading overview or data unavailable...</div>;
    // }

    return (
        <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {/* These cards are generally applicable */}
                <TableFormatCard metadata={metadata} data={dataPayload}/>
                <RowCountCard metadata={metadata} data={dataPayload} />
                <StorageSizeCard metadata={metadata} data={dataPayload} />

                {/* Hide VersionCard if format is Parquet */}
                <VersionCard metadata={metadata} data={dataPayload}/>
            </div>

            {/* Analytics Charts - Hide the whole grid if Parquet, as both charts inside will be hidden */}
            {!isParquet && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* StorageDistributionChart already hides itself, but wrapping grid is cleaner */}
                    <StorageDistributionChart responseData={dataPayload} />
                    <VersionHistoryChart responseData={dataPayload} />
                 </div>
            )}


            {/* Schema Section - Usually always relevant */}
            <SchemaViewer metadata={metadata} isPreview={true} onChange={onChange} />


            {/* Schema History Preview - Hide if Parquet */}
            {/* Also retain original check for versions data */}
            {!isParquet && metadata.versions && metadata.versions.length > 0 && (
                <div className="mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-base font-medium">Schema History</h2>
                            <a
                                className="text-sm text-primary flex items-center cursor-pointer hover:underline" // Added cursor/hover
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    // Consider a more React-friendly way to switch tabs if possible (e.g., state)
                                    const tabNav = document.querySelector('button[data-value="schema-history"]');
                                    if (tabNav instanceof HTMLButtonElement) tabNav.click();
                                }}
                                title="Switch to Full Schema History Tab" // Added title
                            >
                                <i className="ri-history-line mr-1"></i>
                                View Full History
                            </a>
                        </div>

                        <div className="text-sm text-neutral-600">
                            <p>This table has {metadata.versions.length} recorded schema change(s).</p>
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

            {/* Version History Preview - Hide if Parquet */}
            {!isParquet && (
                <VersionViewer metadata={metadata} isPreview={true} responseData={dataPayload} />
            )}

            {/* Partition Layout Preview - Hide if Parquet */}
            {!isParquet && (
                <PartitionViewer metadata={metadata} isPreview={true} responseData={dataPayload} />
            )}

            {/* Format Properties Preview - Keep this visible? Depends on whether properties are useful for Parquet */}
             <PropertiesViewer metadata={metadata} isPreview={true} responseData={dataPayload} />

            {/* Optional: Informational message for Parquet */}
            {isParquet && (
                 <div className="p-4 mb-6 text-sm text-neutral-600 bg-blue-50 rounded border border-blue-200">
                    <i className="ri-information-line mr-2 align-middle"></i>
                    Features like detailed Storage Distribution, Version History, Schema History, and Partition Layout are specific to table formats (Iceberg, Delta) and are not applicable to standard Parquet files.
                </div>
            )}
        </>
    )
}

export default OverviewViewer;