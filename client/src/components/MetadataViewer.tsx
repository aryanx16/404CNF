import React from 'react';
import FilesViewer from './table-viewers/FilesViewer';
import { TableMetadata } from '@shared/schema';
import SchemaViewer from './table-viewers/SchemaViewer';
import SchemaHistoryViewer from './table-viewers/SchemaHistoryViewer';
import PartitionViewer from './table-viewers/PartitionViewer';
import VersionViewer from './table-viewers/VersionViewer';
import PropertiesViewer from './table-viewers/PropertiesViewer';
import SampleDataViewer from './table-viewers/SampleDataViewer';
import OverviewViewer from './table-viewers/OverviewViewer';
import { useRecoilValue } from 'recoil';
import { metadataAtom } from '@/atoms/metadataAtom';

interface MetadataViewerProps {
  metadata: TableMetadata;
  activeTab: string;
  isLoading: boolean;
}

export default function MetadataViewer({ metadata, activeTab, isLoading, onChange }) {
  const response = useRecoilValue(metadataAtom);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Overview tab with summary cards
  if (activeTab === 'overview') {
    return <OverviewViewer metadata={metadata} responseData={response} onChange={onChange} />;
  }

  // Schema tab
  if (activeTab === 'schema') {
    return <SchemaViewer metadata={metadata} />;
  }

  // Schema History tab
  if (activeTab === 'schema-history') {
    return <SchemaHistoryViewer metadata={metadata} />;
  }

  // Partitions tab
  if (activeTab === 'partitions') {
    return <PartitionViewer metadata={metadata} responseData={response?.data} />;
  }

  // Versions tab
  if (activeTab === 'versions') {
    return <VersionViewer metadata={metadata} />;
  }

  // Properties tab
  if (activeTab === 'properties') {
    return <PropertiesViewer metadata={metadata} />;
  }

  // Files tab
  if (activeTab === 'files') {
    return <FilesViewer metadata={metadata} />;
  }

  // Sample Data tab
  if (activeTab === 'sample-data') {
    return <SampleDataViewer metadata={metadata} />;
  }

  return null;
}