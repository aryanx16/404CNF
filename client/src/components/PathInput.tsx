import React, { useState, useEffect, useMemo, useRef } from 'react'; // Added useRef
import { Button } from "@/components/ui/button";
import axios from 'axios';
import { useRecoilState } from 'recoil';
import { metadataAtom } from '@/atoms/metadataAtom';
import { Loader2, AlertCircle, ListTree, ChevronsUpDown } from 'lucide-react'; // Added ChevronsUpDown

// Import Collapsible components from shadcn/ui
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Assuming these exist and work
import { formatDate, timeAgo } from '@/lib/formatUtils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EXAMPLE_PATHS = [
  "s3://coep-inspiron-delta-demo/",
  "s3://coep-inspiron-iceberg-demo/",
  "s3://data-lake/sales/",
  "s3://warehouse/"
];

const FORMAT_OPTIONS = ["Iceberg", "Delta", "Hudi", "Unknown"];

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Enhanced Loading Messages
const LOADING_MESSAGES = [
    "Connecting to S3...",
    "Listing contents...",
    "Identifying tables...",
    "Analyzing structure...",
    "Almost done...",
];

export default function PathInput({ onFetch, initialPath = '' }) {
  const [path, setPath] = useState(initialPath);
  const [format, setFormat] = useState(FORMAT_OPTIONS[0]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [, setMetadataState] = useRecoilState(metadataAtom);

  const [discoveredTables, setDiscoveredTables] = useState([]);
  const [isListingTables, setIsListingTables] = useState(false);
  const [listTablesError, setListTablesError] = useState(null);
  const [isTableListOpen, setIsTableListOpen] = useState(false); // State for collapsible

  // State for dynamic loading message
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const loadingIntervalRef = useRef(null); // Ref to hold interval ID

  // --- Metadata Fetch Logic (remains the same) ---
  async function fetchMetadataForTable(tablePath, tableFormat) {
    // ... (same as previous version) ...
    console.log("Fetching metadata for:", tablePath, tableFormat);
    try {
        // Indicate loading in Recoil state immediately
        setMetadataState({ loading: true, error: null, data: null });
        const resp = await axios.get(`${BACKEND_URL}/${tableFormat}`, { params: { s3_url: tablePath } });
        setMetadataState({ loading: false, error: null, data: resp.data });
    } catch (error) {
        console.error("Error fetching table metadata:", error);
        const message = error.response?.data?.error || error.message || `Failed to fetch metadata for ${tableFormat} table.`;
         setMetadataState({ loading: false, error: message, data: null });
    }
  }

   // --- Dynamic Loading Message Effect ---
  // --- Dynamic Loading Message Effect (Stops at last message) ---
  useEffect(() => {
    if (isListingTables) {
      let messageIndex = 0; // Start index at 0
      setLoadingMessage(LOADING_MESSAGES[messageIndex]); // Set initial message immediately

      // Clear any existing interval before setting a new one
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }

      loadingIntervalRef.current = setInterval(() => {
        // Check if the current index is less than the last possible index
        if (messageIndex < LOADING_MESSAGES.length - 1) {
          messageIndex++; // Increment index to move to the next message
          setLoadingMessage(LOADING_MESSAGES[messageIndex]);
        } else {
          // If we are already at the last message, do nothing.
          // The interval will keep running, but the message won't change.
          // It will be cleared when isListingTables becomes false.
        }
      }, 1500); // Interval duration (adjust as needed)

    } else {
      // Clear interval when loading stops
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
      // Optional: Reset message for the next loading cycle if desired
      // setLoadingMessage(LOADING_MESSAGES[0]);
    }

    // Cleanup function to clear interval if component unmounts while loading
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, [isListingTables]); // Effect runs when isListingTables changes

  // --- Fetch List of Tables ---
  const handleListTables = async () => {
    if (!path.trim()) return;

    setIsListingTables(true);
    setListTablesError(null);
    setDiscoveredTables([]);
    setIsTableListOpen(true); // Open collapsible when starting search

    try {
      const rootPath = path.trim().endsWith('/') ? path.trim() : `${path.trim()}/`;
      const response = await axios.get(`${BACKEND_URL}/list_tables`, { params: { s3_root_path: rootPath } });
      setDiscoveredTables(response.data || []);
       if (!response.data || response.data.length === 0) {
           setListTablesError("No tables found in the specified path.");
           // Keep collapsible open to show the error message
       } else {
           // Automatically close on success? Or keep open? Let's keep it open.
       }
    } catch (error) {
      console.error("Error listing tables:", error);
      const message = error.response?.data?.error || error.message || 'Failed to list tables.';
      setListTablesError(message);
      // Keep collapsible open to show the error message
    } finally {
      setIsListingTables(false);
      // Stop the loading message cycle explicitly happens via useEffect cleanup
    }
  };

  // --- Handle Manual Submit / Example Path Click (remains the same) ---
   const handleSubmit = async (e) => {
    e.preventDefault();
    setIsListingTables(true);
    setListTablesError(null);
    setDiscoveredTables([]);
    setIsTableListOpen(true);
    try {
      const trimmedPath = path.trim();
      if (trimmedPath) {
      await onFetch(trimmedPath, format);
      localStorage.setItem("s3path", trimmedPath);
      localStorage.setItem("format", format);
      await fetchMetadataForTable(trimmedPath, format);
    }
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to list tables.';
      setListTablesError(message);
    } finally {
      setIsListingTables(false);
    }
   };

   const handleExampleClick = (examplePath) => {
     setPath(examplePath);
     setShowSuggestions(false);
   };


  // --- Handle Selecting a Discovered Table ---
  const handleTableSelect = async (table) => {
    console.log("Selected table:", table);
    setIsListingTables(true);
    setListTablesError(null);
    setDiscoveredTables([]);
    setIsTableListOpen(true);
    try {
      setPath(table.path);
      const detectedFormat = FORMAT_OPTIONS.includes(table.type) ? table.type : FORMAT_OPTIONS[0];
      setFormat(detectedFormat);
      await onFetch(table.path, detectedFormat);
      localStorage.setItem("s3path", table.path);
      localStorage.setItem("format", detectedFormat);
      await fetchMetadataForTable(table.path, detectedFormat);
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to list tables.';
      setListTablesError(message);
    } finally {
      setIsListingTables(false);
    }
  };

  // Determine the text/state for the Collapsible Trigger
  const getTriggerState = () => {
      if (isListingTables) {
          return { text: loadingMessage, icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />, className: "text-neutral-600" };
      }
      if (listTablesError) {
          return { text: "Error listing tables", icon: <AlertCircle className="mr-2 h-4 w-4 text-red-500" />, className: "text-red-600" };
      }
       if (discoveredTables.length > 0) {
           return { text: `${discoveredTables.length} table(s) found`, icon: <ListTree className="mr-2 h-4 w-4 text-green-600" />, className: "text-green-700 font-medium" };
       }
      // Default state when nothing has been triggered or no results/errors
      return null; // Don't show trigger until "List Tables" is clicked
  };
  const triggerState = getTriggerState();


  return (
    <div className="bg-white border-b border-neutral-200 p-4 space-y-3">
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-2">
        {/* Path Input */}
        <div className="flex-grow relative">
           {/* ... Input field JSX remains the same ... */}
           <div className="flex bg-neutral-50 border border-neutral-300 rounded-md overflow-hidden">
            <div className="bg-neutral-100 px-3 py-2 border-r border-neutral-300 text-neutral-600 text-sm whitespace-nowrap">S3 Path</div>
            <input type="text" className="flex-grow px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" value={path}
              onChange={(e) => { setPath(e.target.value); if (isTableListOpen) setIsTableListOpen(false); if (discoveredTables.length > 0) setDiscoveredTables([]); if (listTablesError) setListTablesError(null); }}
              placeholder="e.g., s3://bucket-name/folder/" onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} />
          </div>
           {showSuggestions && ( <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg"> <div className="p-2 border-b border-neutral-100"><h4 className="text-xs font-medium text-neutral-500 uppercase">Example Root Paths</h4></div> <div className="max-h-40 overflow-y-auto"> {EXAMPLE_PATHS.map((examplePath, index) => ( <button key={index} type="button" className="w-full text-left p-2 text-sm hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none" onClick={() => handleExampleClick(examplePath)}> {examplePath} </button> ))} </div> </div> )}
        </div>

        {/* Action Buttons & Format Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0">
           <Button type="button" onClick={handleListTables} disabled={!path.trim() || isListingTables} variant="outline" className="w-full sm:w-auto"> {isListingTables ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <ListTree className="mr-2 h-4 w-4" /> )} List Tables </Button>
           <div className="flex items-center justify-end"> <label htmlFor="format" className="text-sm font-medium text-neutral-600 mr-2 hidden sm:inline">Format:</label> <select id="format" value={format} onChange={(e) => setFormat(e.target.value)} className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" title="Format used if Fetch Metadata is clicked directly"> {FORMAT_OPTIONS.map((option) => ( <option key={option} value={option}>{option}</option> ))} </select> </div>
           <Button type="submit" disabled={!path.trim() || isListingTables} className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center w-full sm:w-auto"> <i className="ri-search-line mr-2"></i> Fetch Metadata </Button>
         </div>
      </form>

      {/* --- Collapsible Discovered Tables List --- */}
      {(isListingTables || listTablesError || discoveredTables.length > 0) && (
        <Collapsible open={isTableListOpen} onOpenChange={setIsTableListOpen} className="w-full mt-2">
          <CollapsibleTrigger asChild>
            {/* Only render trigger if there's something to show/indicate */}
            {triggerState && (
                <Button variant="outline" className={`w-full justify-between text-sm px-3 py-2 ${triggerState.className}`}>
                    <span className="flex items-center">
                        {triggerState.icon} {triggerState.text}
                    </span>
                    <ChevronsUpDown className="h-4 w-4" />
                </Button>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 CollapsibleContent">
            {/* Content: Error or List */}
             {listTablesError && !isListingTables && ( // Show error only when not loading
               <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3 flex items-center mt-1">
                 <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" /> {listTablesError}
               </div>
             )}
             {!listTablesError && !isListingTables && discoveredTables.length > 0 && (
               <div className="border rounded-md mt-1 max-h-60 overflow-y-auto bg-white shadow-sm">
                  {discoveredTables.map((table, index) => (
                     <button
                       key={index}
                       type="button"
                       className="w-full text-left p-3 text-sm hover:bg-primary/10 focus:bg-primary/10 focus:outline-none border-b last:border-b-0 flex justify-between items-center"
                       onClick={() => handleTableSelect(table)}
                     >
                       <span>
                          <i className="ri-table-line mr-2 text-neutral-400"></i>
                          <span className="font-medium">{table.path.split('/').filter(Boolean).pop() || table.path}</span>
                          <span className="text-xs text-neutral-500 ml-2 hidden sm:inline">({table.path})</span>
                       </span>
                       <Badge variant="secondary" className="text-xs">{table.type || 'Unknown'}</Badge>
                     </button>
                  ))}
               </div>
             )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Help Text */}
      <div className="text-xs text-neutral-500 flex items-center pt-1">
        <i className="ri-information-line mr-1"></i>
        <span>Enter a root S3 path and click 'List Tables', or enter a full table path and click 'Fetch Metadata'.</span>
      </div>

        {/* Add simple CSS for Collapsible animation (optional, requires Tailwind setup) */}
        <style>{`
            .CollapsibleContent {
            overflow: hidden;
            transition: height 300ms ease-out;
            }
            .CollapsibleContent[data-state='open'] {
            animation: slideDown 300ms ease-out;
            }
            .CollapsibleContent[data-state='closed'] {
            animation: slideUp 300ms ease-out;
            }
            @keyframes slideDown { from { height: 0; } to { height: var(--radix-collapsible-content-height); } }
            @keyframes slideUp { from { height: var(--radix-collapsible-content-height); } to { height: 0; } }
      `}</style>
    </div>
  );
}