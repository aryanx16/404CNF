import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import PathInput from "@/components/PathInput";
import TableSummary from "@/components/TableSummary";
import TabNavigation from "@/components/TabNavigation";
import MetadataViewer from "@/components/MetadataViewer";
import { useTableMetadata } from "@/hooks/useTableMetadata";
import { UserContext } from "@/App";
import { useContext } from "react";
import { useToast } from "@/hooks/use-toast";
import { TableMetadata } from '@shared/schema';

// Define the possible tab values
type TabValue = "overview" | "schema" | "partitions" | "versions" | "properties" | "sample-data";

// Default empty table metadata for initial state
const emptyTableMetadata: TableMetadata = {
  name: "",
  format: "",
  location: "",
  lastModified: "",
  size: 0,
  rowCount: 0,
  fileCount: 0
};

export default function Home() {
  const [path, setPath] = useState<string>("s3://analytics-bucket/customer_data/");
  const [activeTab, setActiveTab] = useState<TabValue>("overview");
  const { userId } = useContext(UserContext);
  const { toast } = useToast();

  // Fetch table metadata with userId for recent table tracking
  const { data: tableMetadata, isLoading, isError, error } = useTableMetadata(
    path ? path : null,
    undefined,
    userId
  );

  // Handle fetch button click
  const handleFetch = (newPath: string) => {
    setPath(newPath);
  };

  // Show error toast if metadata fetch fails
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Error fetching metadata",
        description: error.message || "Failed to load table metadata",
        variant: "destructive"
      });
    }
  }, [isError, error, toast]);

  // Safely typed metadata
  const safeMetadata: TableMetadata = tableMetadata ? (tableMetadata as TableMetadata) : emptyTableMetadata;

  return (
    <div className="h-screen flex flex-col bg-neutral-50 text-neutral-900">
      {/* Header */}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar onSelectTable={(tablePath) => setPath(tablePath)} />

        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Path Input */}
          <PathInput onFetch={handleFetch} initialPath={path} />

          {/* Table Summary */}
          {tableMetadata && (
            <TableSummary 
              metadata={safeMetadata} 
              isLoading={isLoading} 
            />
          )}

          {/* Tab Navigation */}
          <TabNavigation 
            activeTab={activeTab} 
            onChange={(value) => setActiveTab(value as TabValue)} 
          />

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-neutral-50">
            {tableMetadata && (
              <MetadataViewer 
                metadata={safeMetadata} 
                activeTab={activeTab} 
                isLoading={isLoading} 
              />
            )}

            {isLoading && !tableMetadata && (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            )}

            {!isLoading && !tableMetadata && !isError && (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                <div className="text-5xl mb-4">
                  <i className="ri-inbox-line"></i>
                </div>
                <h3 className="text-xl font-medium mb-2">No Table Selected</h3>
                <p>Enter an S3 path and click 'Fetch Metadata' to view table details</p>
              </div>
            )}

            {isError && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-5xl mb-4 text-amber-500">
                  <i className="ri-information-line"></i>
                </div>
                <h3 className="text-xl font-medium mb-2 text-neutral-800">Please Select a Table</h3>
                {error?.message === "Path parameter is required" ? (
                  <div className="text-center max-w-md">
                    <p className="text-neutral-600 mb-4">You need to select a table to view its metadata.</p>
                    <div className="flex flex-col space-y-4 bg-neutral-100 p-4 rounded-lg text-neutral-700 text-sm">
                      <div className="flex items-start">
                        <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">1</span>
                        <p>Select a data source from the sidebar on the left</p>
                      </div>
                      <div className="flex items-start">
                        <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">2</span>
                        <p>Or click on a recently viewed table from the sidebar</p>
                      </div>
                      <div className="flex items-start">
                        <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">3</span>
                        <p>Or enter an S3 path in the input field above and click 'Fetch'</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center max-w-md">
                    <p className="text-red-500 font-medium">{error?.message || "Failed to load table metadata"}</p>
                    <p className="text-neutral-600 mt-2">Please check that the path is correct and try again.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Menu - visible on small screens */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-2 py-1 flex justify-around">
        <button 
          className={`p-2 flex flex-col items-center ${activeTab === "overview" ? "text-primary" : "text-neutral-500"}`}
          onClick={() => setActiveTab("overview")}
        >
          <i className="ri-dashboard-line text-xl"></i>
          <span className="text-xs mt-1">Overview</span>
        </button>
        <button 
          className={`p-2 flex flex-col items-center ${activeTab === "schema" ? "text-primary" : "text-neutral-500"}`}
          onClick={() => setActiveTab("schema")}
        >
          <i className="ri-file-list-line text-xl"></i>
          <span className="text-xs mt-1">Schema</span>
        </button>
        <button 
          className={`p-2 flex flex-col items-center ${activeTab === "partitions" ? "text-primary" : "text-neutral-500"}`}
          onClick={() => setActiveTab("partitions")}
        >
          <i className="ri-table-line text-xl"></i>
          <span className="text-xs mt-1">Partitions</span>
        </button>
        <button 
          className={`p-2 flex flex-col items-center ${activeTab === "versions" ? "text-primary" : "text-neutral-500"}`}
          onClick={() => setActiveTab("versions")}
        >
          <i className="ri-history-line text-xl"></i>
          <span className="text-xs mt-1">Versions</span>
        </button>
        <button 
          className={`p-2 flex flex-col items-center ${
            activeTab === "properties" || activeTab === "sample-data" 
              ? "text-primary" 
              : "text-neutral-500"
          }`}
          onClick={() => {
            // Toggle between properties and sample data
            if (activeTab === "properties") {
              setActiveTab("sample-data");
            } else {
              setActiveTab("properties");
            }
          }}
        >
          <i className="ri-more-line text-xl"></i>
          <span className="text-xs mt-1">More</span>
        </button>
      </div>
    </div>
  );
}
