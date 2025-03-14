import React, { useContext } from 'react';
import { UserContext } from '@/App';
import { useDataSources, useRecentTables } from '@/hooks/useTableMetadata';
import { getFormatColor } from '@/lib/formatUtils';

interface SidebarProps {
  onSelectTable: (path: string) => void;
}

export default function Sidebar({ onSelectTable }: SidebarProps) {
  const { userId } = useContext(UserContext);
  
  // Fetch data sources and recent tables
  const { data: dataSources, isLoading: isLoadingDataSources } = useDataSources(userId || undefined);
  const { data: recentTables, isLoading: isLoadingRecentTables } = useRecentTables(userId || undefined);
  
  // Handle bucket click
  const handleBucketClick = (path: string) => {
    onSelectTable(path);
  };
  
  // Handle table click
  const handleTableClick = (path: string) => {
    onSelectTable(path);
  };
  
  return (
    <aside className="bg-white border-r border-neutral-200 w-64 flex-shrink-0 overflow-y-auto hidden md:block">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">Data Sources</h2>
        
        {/* Buckets Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-neutral-700">Buckets</h3>
            <button className="text-primary cursor-not-allowed hover:text-primary-600 text-sm">
              <i className="ri-add-line"></i> Add
            </button>
          </div>
          
          {isLoadingDataSources ? (
            <div className="py-2 text-sm text-neutral-500">Loading...</div>
          ) : (
            <div className="space-y-1">
              {dataSources?.map((source, index) => (
                <div 
                  key={source.id}
                  className={`flex items-center px-2 py-1.5 rounded-md ${
                    index === 0 ? 'bg-blue-50 text-primary' : 'hover:bg-neutral-100 text-neutral-700'
                  } cursor-pointer`}
                  onClick={() => handleBucketClick(source.path)}
                >
                  <i className="ri-folder-line mr-2"></i>
                  <span className="text-sm truncate">{source.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Recent Tables Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-neutral-700">Recent Tables</h3>
            <button className="text-neutral-500 hover:text-neutral-700 text-sm">
              <i className="ri-refresh-line"></i>
            </button>
          </div>
          
          {isLoadingRecentTables ? (
            <div className="py-2 text-sm text-neutral-500">Loading...</div>
          ) : (
            <div className="space-y-1">
              {recentTables?.map((table) => {
                const formatColor = getFormatColor(table.format as any);
                
                return (
                  <div 
                    key={table.id}
                    className="flex items-center px-2 py-1.5 rounded-md hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                    onClick={() => handleTableClick(table.path)}
                  >
                    <div className={`w-3 h-3 ${formatColor.bg} rounded-full mr-2`} title={`${table.format} format`}></div>
                    <span className="text-sm truncate">{table.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
