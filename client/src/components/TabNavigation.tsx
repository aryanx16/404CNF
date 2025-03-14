import React from 'react';

interface TabNavigationProps {
  activeTab: string;
  onChange: (value: string) => void;
}

export default function TabNavigation({ activeTab, onChange }: TabNavigationProps) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'files', label: 'Files' },
    { id: 'schema', label: 'Schema' },
    { id: 'schema-history', label: 'Schema History' },
    { id: 'partitions', label: 'Partitions' },
    { id: 'properties', label: 'Properties' },
    { id: 'sample-data', label: 'Sample Data' }
  ];
  
  return (
    <div className="bg-white border-b border-neutral-200 px-4 flex space-x-1 overflow-x-auto">
      {tabs.map((tab) => (
        <button 
          key={tab.id}
          data-value={tab.id}
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === tab.id 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
