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
    // { id: 'versions', label: 'Versions' },
    { id: 'partitions', label: 'Partitions' },
    { id: 'properties', label: 'Properties' },
    { id: 'sample-data', label: 'Sample Data' },
    { id: 'schema-history', label: 'Snaps Compare' },
  ];
  
  return (
    <div className="bg-white border-b border-neutral-200 px-4 flex justify-between overflow-x-auto">
      <div className='flex space-x-1'>
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
      <button className="bg-green-500 cursor-not-allowed hover:bg-green-600 text-white px-3 py-1.5 my-1 rounded-md text-sm font-medium transition-colors flex items-center">
        <i className="ri-play-line mr-1.5"></i>
        Query
      </button>
    </div>
  );
}
