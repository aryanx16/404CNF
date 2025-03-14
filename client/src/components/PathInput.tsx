import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

interface PathInputProps {
  onFetch: (path: string) => void;
  initialPath?: string;
}

const EXAMPLE_PATHS = [
  "s3://analytics-bucket/customer_data/",
  "s3://data-lake/sales/transactions/",
  "s3://warehouse/product_catalog/"
];

export default function PathInput({ onFetch, initialPath = '' }: PathInputProps) {
  const [path, setPath] = useState(initialPath);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (path.trim()) {
      onFetch(path.trim());
    }
  };

  const handleExampleClick = (examplePath: string) => {
    setPath(examplePath);
    setShowSuggestions(false);
    onFetch(examplePath);
  };
  
  return (
    <div className="bg-white border-b border-neutral-200 p-4">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex-grow relative">
            <div className="flex bg-neutral-50 border border-neutral-300 rounded-md overflow-hidden">
              <div className="bg-neutral-100 px-3 py-2 border-r border-neutral-300 text-neutral-600 text-sm whitespace-nowrap">
                S3 Path
              </div>
              <input 
                type="text" 
                className="flex-grow px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={path} 
                onChange={(e) => setPath(e.target.value)}
                placeholder="e.g., s3://bucket-name/table-path/"
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
            </div>
            
            {showSuggestions && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg">
                <div className="p-2 border-b border-neutral-100">
                  <h4 className="text-xs font-medium text-neutral-500 uppercase">Example Paths</h4>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {EXAMPLE_PATHS.map((examplePath, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left p-2 text-sm hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none"
                      onClick={() => handleExampleClick(examplePath)}
                    >
                      {examplePath}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <Button 
              type="submit" 
              disabled={!path.trim()}
              className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <i className="ri-search-line mr-2"></i>
              Fetch Metadata
            </Button>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="bg-white cursor-not-allowed border border-neutral-300 hover:bg-neutral-50 px-4 py-2 rounded-md text-sm font-medium text-neutral-700 transition-colors flex items-center"
              >
                <i className="ri-filter-line mr-1"></i>
                Filter
                <i className="ri-arrow-down-s-line ml-1"></i>
              </Button>
              {/* Dropdown menu would be here */}
            </div>
          </div>
        </div>
        
        <div className="text-xs text-neutral-500 flex items-center">
          <i className="ri-information-line mr-1"></i>
          <span>Enter a complete S3 path to view table metadata, or select a data source from the sidebar.</span>
        </div>
      </form>
    </div>
  );
}
