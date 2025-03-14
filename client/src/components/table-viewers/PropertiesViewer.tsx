import React from 'react';
import { TableMetadata } from '@shared/schema';
import { formatBytes, getFormatDescription } from '@/lib/formatUtils';

interface PropertiesViewerProps {
  metadata: TableMetadata;
  isPreview?: boolean;
}

export default function PropertiesViewer({ metadata, isPreview = false }: PropertiesViewerProps) {
  // Check if we have properties data
  if (!metadata.properties) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
        <div className="text-3xl text-neutral-400 mb-2">
          <i className="ri-file-settings-line"></i>
        </div>
        <h3 className="text-lg font-medium text-neutral-700">No Properties Available</h3>
        <p className="text-neutral-500 mt-1">Format-specific properties could not be found for this table.</p>
      </div>
    );
  }
  
  const { format, formatVersion, location, manifestFiles, snapshotInfo, formatConfig, metrics } = metadata.properties;
  
  // For preview mode, show a simplified view
  if (isPreview) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
        <div className="flex justify-between items-center p-4 border-b border-neutral-200">
          <h2 className="text-base font-medium">{format.charAt(0).toUpperCase() + format.slice(1)} Format Properties</h2>
          <button className="text-sm text-neutral-600 flex items-center hover:text-primary">
            <i className="ri-information-line mr-1"></i>
            About {format.charAt(0).toUpperCase() + format.slice(1)} Format
          </button>
        </div>
        
        <div className="p-4">
          <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Format:</div>
              <div>{format.charAt(0).toUpperCase() + format.slice(1)}</div>
              
              {formatVersion && (
                <>
                  <div className="font-medium">Version:</div>
                  <div>{formatVersion}</div>
                </>
              )}
              
              <div className="font-medium">Location:</div>
              <div className="truncate">{location}</div>
              
              {metrics && (
                <>
                  <div className="font-medium">Metadata Size:</div>
                  <div>{metrics.metadataSize ? formatBytes(metrics.metadataSize) : 'Unknown'}</div>
                </>
              )}
            </div>
          </div>
          
          {!isPreview && (
            <p className="mt-3 text-sm text-neutral-500">
              {getFormatDescription(format as any)}
            </p>
          )}
        </div>
      </div>
    );
  }
  
  // Full properties viewer
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
      <div className="flex justify-between items-center p-4 border-b border-neutral-200">
        <h2 className="text-base font-medium">{format.charAt(0).toUpperCase() + format.slice(1)} Format Properties</h2>
        <button className="text-sm text-neutral-600 flex items-center hover:text-primary">
          <i className="ri-information-line mr-1"></i>
          About {format.charAt(0).toUpperCase() + format.slice(1)} Format
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div>
          {/* Manifest Files section */}
          {manifestFiles && manifestFiles.length > 0 && (
            <>
              <h3 className="text-sm font-medium mb-2">Manifest Files</h3>
              <div className="border border-neutral-200 rounded-md overflow-hidden mb-4">
                <div className="bg-neutral-50 p-2 border-b border-neutral-200 flex justify-between items-center">
                  <span className="text-xs font-medium">File Path</span>
                  <span className="text-xs font-medium">Size</span>
                </div>
                <div className="max-h-40 overflow-y-auto text-sm">
                  {manifestFiles.map((file, index) => (
                    <div key={index} className="p-2 border-b border-neutral-100 flex justify-between">
                      <span className="truncate w-4/5">{file.path}</span>
                      <span className="text-neutral-500">{formatBytes(file.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Format Configuration section */}
          <h3 className="text-sm font-medium mb-2">Format Configuration</h3>
          <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200">
            <pre className="text-xs overflow-x-auto">
              {formatConfig ? JSON.stringify(formatConfig, null, 2) : 'No configuration available'}
            </pre>
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Snapshot Information section */}
          {snapshotInfo && Object.keys(snapshotInfo).length > 0 && (
            <>
              <h3 className="text-sm font-medium mb-2">Snapshot Information</h3>
              <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(snapshotInfo).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <div className="font-medium">{key.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase())}:</div>
                      <div className={typeof value === 'string' && value.length > 20 ? 'truncate' : ''}>
                        {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Metadata Metrics section */}
          {metrics && Object.keys(metrics).length > 0 && (
            <>
              <h3 className="text-sm font-medium mb-2">Metadata Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(metrics).map(([key, value]) => (
                  <div key={key} className="bg-neutral-50 p-3 rounded-md border border-neutral-200 flex flex-col">
                    <span className="text-xs text-neutral-500">
                      {key.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase())}
                    </span>
                    <span className="text-lg font-medium mt-1">
                      {typeof value === 'number' && key.toLowerCase().includes('size') 
                        ? formatBytes(value)
                        : value.toString()}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* Format Description */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
            <h3 className="text-sm font-medium mb-1 text-blue-700">About {format.charAt(0).toUpperCase() + format.slice(1)} Format</h3>
            <p className="text-sm text-blue-600">
              {getFormatDescription(format as any)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
