import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from "@/components/ui/button";
import axios, { AxiosResponse } from 'axios'; // Import AxiosResponse if needed for formatAtom type
import { useRecoilState } from 'recoil';
import { metadataAtom } from '@/atoms/metadataAtom';
import { Loader2, AlertCircle, ListTree, ChevronsUpDown } from 'lucide-react';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Assuming these exist and work
import { formatDate, timeAgo } from '@/lib/formatUtils';
import { Badge } from '@/components/ui/badge';
// Removed unused Select imports if you are using native select
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatAtom } from '@/atoms/formatAtom'; // Make sure this atom's type is string | null

const EXAMPLE_PATHS = [
    "s3://coep-inspiron-delta-demo/",
    "s3://coep-inspiron-iceberg-demo/",
    "s3://data-lake/sales/",
    "s3://warehouse/"
];

// Make sure formatAtom's type definition allows string
// Example definition in formatAtom.ts:
// export const formatAtom = atom<string | null>({
//   key: 'formatAtom',
//   default: null, // Or maybe FORMAT_OPTIONS[0] if you want a default string?
// });
const FORMAT_OPTIONS = ["Iceberg", "Delta", "Parquet", "Hudi", "Unknown"];

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const LOADING_MESSAGES = [
    "Connecting to S3...",
    "Listing contents...",
    "Identifying tables...",
    "Analyzing structure...",
    "Almost done...",
];

// Ensure formatAtom is defined correctly (e.g., atom<string | null>)
export default function PathInput({ onFetch, initialPath = '' }) {
    const [path, setPath] = useState(initialPath);
    // Local state for the select dropdown / current operation format
    const [format, setFormat] = useState<string>(FORMAT_OPTIONS[0]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [, setMetadataState] = useRecoilState(metadataAtom);
    // Use Recoil state for format - name it clearly if different from local state
    const [globalFormat, setGlobalFormat] = useRecoilState(formatAtom);

    const [discoveredTables, setDiscoveredTables] = useState<{ path: string; type: string }[]>([]); // Add type definition
    const [isListingTables, setIsListingTables] = useState(false);
    const [listTablesError, setListTablesError] = useState<string | null>(null); // Type the error state
    const [isTableListOpen, setIsTableListOpen] = useState(false);

    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
    const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null); // Type the ref

    // --- Metadata Fetch Logic ---
    async function fetchMetadataForTable(tablePath: string, tableFormat: string) {
        console.log("Fetching metadata for:", tablePath, `Format: ${tableFormat}`);
        try {
            setMetadataState({ loading: true, error: null, data: null });
            // Make sure the backend endpoint matches the format correctly (lowercase?)
            const endpointFormat = localStorage.getItem('format') // e.g., 'iceberg', 'delta'
            const resp = await axios.get(`${BACKEND_URL}/${endpointFormat}`, { params: { s3_url: tablePath } });
            setMetadataState({ loading: false, error: null, data: resp.data });
             // *** Update global format state AFTER successful fetch for this table ***
             setGlobalFormat(tableFormat);
             localStorage.setItem("format", tableFormat); // Also update localStorage here
        } catch (error: any) { // Type the error
            console.error("Error fetching table metadata:", error);
            const message = error.response?.data?.error || error.message || `Failed to fetch metadata for ${tableFormat} table.`;
            setMetadataState({ loading: false, error: message, data: null });
             // Optionally clear global format on error?
             // setGlobalFormat(null);
             // localStorage.removeItem("format");
        }
    }

     // --- Effect for Logging Global Format Changes (for debugging) ---
     useEffect(() => {
        // This effect runs whenever globalFormat changes *after* a render
        console.log("Global format state updated:", globalFormat);
     }, [globalFormat]);


    // --- Dynamic Loading Message Effect (Stops at last message) ---
    useEffect(() => {
        if (isListingTables) {
            let messageIndex = 0;
            setLoadingMessage(LOADING_MESSAGES[messageIndex]);

            if (loadingIntervalRef.current) {
                clearInterval(loadingIntervalRef.current);
            }

            loadingIntervalRef.current = setInterval(() => {
                if (messageIndex < LOADING_MESSAGES.length - 1) {
                    messageIndex++;
                    setLoadingMessage(LOADING_MESSAGES[messageIndex]);
                } else {
                    // Stop interval explicitly when last message is reached
                    // if (loadingIntervalRef.current) {
                    //    clearInterval(loadingIntervalRef.current);
                    //    loadingIntervalRef.current = null;
                    // }
                    // Or just let it repeat the last message until isListingTables is false
                }
            }, 1500);

        } else {
            if (loadingIntervalRef.current) {
                clearInterval(loadingIntervalRef.current);
                loadingIntervalRef.current = null;
            }
            // Reset to first message for next time
            setLoadingMessage(LOADING_MESSAGES[0]);
        }

        return () => {
            if (loadingIntervalRef.current) {
                clearInterval(loadingIntervalRef.current);
            }
        };
    }, [isListingTables]);

    // --- Fetch List of Tables ---
    const handleListTables = async () => {
        if (!path.trim()) return;

        setIsListingTables(true);
        setListTablesError(null);
        setDiscoveredTables([]);
        setIsTableListOpen(true);

        try {
            const rootPath = path.trim().endsWith('/') ? path.trim() : `${path.trim()}/`;
            const response = await axios.get<{ path: string; type: string }[]>(`${BACKEND_URL}/list_tables`, { params: { s3_root_path: rootPath } }); // Type the response data
            const tables = response.data || [];
            setDiscoveredTables(tables);
            if (tables.length === 0) {
                setListTablesError("No tables found in the specified path.");
            }
        } catch (error: any) { // Type the error
            console.error("Error listing tables:", error);
            const message = error.response?.data?.error || error.message || 'Failed to list tables.';
            setListTablesError(message);
        } finally {
            setIsListingTables(false);
        }
    };

    // --- Handle Manual Submit / Example Path Click ---
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => { // Type the event
        e.preventDefault();
        const trimmedPath = path.trim();
        if (!trimmedPath) return;

        // Set loading state specifically for metadata fetch maybe? Or reuse isListingTables
        setIsListingTables(true); // Reuse for simplicity for now
        setListTablesError(null);
        // Don't clear discovered tables here if you want them to persist
        // setDiscoveredTables([]);
        // Keep the table list open or closed based on preference
        // setIsTableListOpen(true);

        try {
            // Call the parent's onFetch if provided (purpose unclear from context, but calling it)
            if (typeof onFetch === 'function') {
               await onFetch(trimmedPath, format); // Use the LOCAL format state from the dropdown
            }
            localStorage.setItem("s3path", trimmedPath);
             // **Update Recoil state and localStorage just before fetching**
             // **Using the format selected in the dropdown (local 'format' state)**
             setGlobalFormat(format); // <-- Update Recoil State
             localStorage.setItem("format", format); // <-- Update localStorage

             // The console.log was here, logging the *old* state due to async nature.
             // Rely on the useEffect hook above to see the updated globalFormat.

            // Now fetch metadata using the selected path and format
            await fetchMetadataForTable(trimmedPath, format);

        } catch (error: any) { // Type the error
            // Error handling within fetchMetadataForTable handles metadata state
             console.error("Error during manual submit:", error);
             // We might want a more general error display if onFetch fails, handle here if needed
             const message = error.response?.data?.error || error.message || 'An error occurred during submission.';
             // Set a general error if needed, or rely on fetchMetadataForTable's error handling
             // setListTablesError(message); // Or a different error state variable
        } finally {
            setIsListingTables(false); // Stop loading indicator
        }
    };

    const handleExampleClick = (examplePath: string) => {
        setPath(examplePath);
        setShowSuggestions(false);
        // Clear previous results when selecting an example
        setDiscoveredTables([]);
        setListTablesError(null);
        setIsTableListOpen(false);
        setMetadataState({ loading: false, error: null, data: null }); // Clear metadata too
        setGlobalFormat(null); // Clear global format
        localStorage.removeItem("format");
    };


    // --- Handle Selecting a Discovered Table ---
    const handleTableSelect = async (table: { path: string; type: string }) => {
        console.log("Selected table:", table);
        setIsListingTables(true); // Indicate loading
        setListTablesError(null);
        setIsTableListOpen(false);
        // Keep the table list visible while loading the selected table
        // setDiscoveredTables([]); // Don't clear the list
        // setIsTableListOpen(true); // Keep open

        try {
            // Determine format, default to first option if type isn't in our known list
            const detectedFormat = FORMAT_OPTIONS.includes(table.type) ? table.type : FORMAT_OPTIONS[0];

            setPath(table.path); // Update input field path
            setFormat(detectedFormat); // Update local dropdown state to match detected format

             // **Update Recoil state and localStorage with the DETECTED format**
             setGlobalFormat(detectedFormat); // <-- FIX: Update Recoil State
             localStorage.setItem("format", detectedFormat); // <-- Update localStorage

            // Call parent onFetch if needed
            if (typeof onFetch === 'function') {
                await onFetch(table.path, detectedFormat);
            }

            // Fetch metadata for the selected table and its detected format
            await fetchMetadataForTable(table.path, detectedFormat);

            // Optionally close the collapsible after successful selection/fetch
            // setIsTableListOpen(false);

        } catch (error: any) { // Type the error
            // Error handling is inside fetchMetadataForTable
             console.error("Error during table selection:", error);
             // Maybe set listTablesError here too if fetchMetadataForTable fails
              const message = error.response?.data?.error || error.message || 'Failed to process selected table.';
              setListTablesError(message);
        } finally {
            setIsListingTables(false); // Stop loading indicator
        }
    };

    // --- Trigger State Logic --- (Using local state for display)
    const getTriggerState = () => {
        if (isListingTables) { // Use the specific loading state
            return { text: loadingMessage, icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />, className: "text-neutral-600" };
        }
        if (listTablesError) {
            return { text: "Error listing tables", icon: <AlertCircle className="mr-2 h-4 w-4 text-red-500" />, className: "text-red-600" };
        }
        if (discoveredTables.length > 0) {
            return { text: `${discoveredTables.length} table(s) found`, icon: <ListTree className="mr-2 h-4 w-4 text-green-600" />, className: "text-green-700 font-medium" };
        }
         if (!isListingTables && discoveredTables.length === 0 && !listTablesError /* && searchAttempted? */) {
             // Handle case where search finished with no results (and no error)
             // Need a way to know if 'List Tables' was actually clicked vs initial state
             // Let's assume if listTablesError is null and discoveredTables is empty AFTER loading, it means none found.
             // We handle the "No tables found" message inside the collapsible content now.
             return null; // Don't show trigger until clicked or if error/results exist
         }
        return null; // Default: Don't show trigger initially
    };
    const triggerState = getTriggerState();

    // --- Render ---
    return (
        <div className="bg-white border-b border-neutral-200 p-4 space-y-3">
            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-2">
                {/* Path Input */}
                <div className="flex-grow relative">
                    <div className="flex bg-neutral-50 border border-neutral-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                        <div className="bg-neutral-100 px-3 py-2 border-r border-neutral-300 text-neutral-600 text-sm whitespace-nowrap flex-shrink-0">S3 Path</div>
                        <input
                            type="text"
                            className="flex-grow px-3 py-2 text-sm focus:outline-none w-full min-w-0" // Added w-full min-w-0
                            value={path}
                            onChange={(e) => {
                                setPath(e.target.value);
                                // Reset results if user types in the input manually
                                if (isTableListOpen) setIsTableListOpen(false);
                                if (discoveredTables.length > 0) setDiscoveredTables([]);
                                if (listTablesError) setListTablesError(null);
                            }}
                            placeholder="e.g., s3://bucket-name/folder/"
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click on suggestions
                         />
                    </div>
                    {showSuggestions && path.length < 5 && ( // Show examples only if input is short or empty?
                        <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg">
                            <div className="p-2 border-b border-neutral-100"><h4 className="text-xs font-medium text-neutral-500 uppercase">Example Root Paths</h4></div>
                            <div className="max-h-40 overflow-y-auto">
                                {EXAMPLE_PATHS.map((examplePath, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className="w-full text-left p-2 text-sm hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none"
                                        onClick={() => handleExampleClick(examplePath)}
                                        title={`Use ${examplePath}`}
                                    >
                                        {examplePath}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons & Format Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0">
                    {/* List Tables Button */}
                    <Button
                        type="button"
                        onClick={handleListTables}
                        disabled={!path.trim() || isListingTables} // Disable if no path or already listing
                        variant="outline"
                        className="w-full sm:w-auto"
                        title="List tables found under the S3 Path"
                    >
                        {isListingTables && !listTablesError ? ( // Show loader only if loading and no error yet
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ListTree className="mr-2 h-4 w-4" />
                        )}
                        List Tables
                    </Button>

                    {/* Format Selector (using native select for simplicity) */}
                    <div className="flex items-center justify-end">
                        <label htmlFor="format" className="text-sm font-medium text-neutral-600 mr-2 hidden sm:inline">Format:</label>
                        <select
                            id="format"
                            value={format} // Controlled by local state 'format'
                            onChange={(e) => setFormat(e.target.value)} // Update local state 'format'
                            className="px-3 py-[9px] border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" // Added bg-white for consistency
                            title="Format used if 'Fetch Metadata' is clicked directly (without listing tables)"
                            disabled={isListingTables} // Disable while loading
                        >
                            {FORMAT_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    {/* Fetch Metadata Button */}
                    <Button
                        type="submit" // Triggers the form's onSubmit (handleSubmit)
                        disabled={!path.trim() || isListingTables} // Disable if no path or loading
                        className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center w-full sm:w-auto"
                        title="Fetch metadata directly for the specified S3 Path and selected Format"
                    >
                        <i className="ri-search-line mr-2"></i> {/* Assuming Remix Icon is set up */}
                        Fetch Metadata
                    </Button>
                </div>
            </form>

            {/* --- Collapsible Discovered Tables List --- */}
            {/* Render Collapsible wrapper if trigger has content OR if there are tables/errors */}
             {(triggerState || (!isListingTables && (listTablesError || discoveredTables.length > 0))) && (
                <Collapsible open={isTableListOpen} onOpenChange={setIsTableListOpen} className="w-full mt-2">
                    {/* Only render trigger if state requires it */}
                    {triggerState && (
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" className={`w-full justify-between text-sm px-3 py-2 ${triggerState.className}`}>
                                <span className="flex items-center">
                                    {triggerState.icon} {triggerState.text}
                                </span>
                                <ChevronsUpDown className="h-4 w-4 opacity-50" /> {/* Added opacity */}
                            </Button>
                        </CollapsibleTrigger>
                    )}
                    <CollapsibleContent className="mt-1 CollapsibleContent">
                        {/* Content: Error */}
                        {listTablesError && !isListingTables && ( // Show error only when not loading
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3 flex items-center mt-1">
                                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" /> {listTablesError}
                            </div>
                        )}
                        {/* Content: No Tables Found Message */}
                         {!listTablesError && !isListingTables && discoveredTables.length === 0 && listTablesError === null && /* Check if search was attempted? How? */ (
                            // This condition is tricky. Only show "No tables found" *after* a search.
                            // Maybe check if handleListTables was called and finished without errors/results.
                            // For simplicity, let's rely on the explicit error message set in handleListTables for "No tables found".
                            // If listTablesError is "No tables found...", the block above will render it.
                             <></> // Render nothing here if relying on explicit error message
                         )}
                        {/* Content: List of Tables */}
                        {!listTablesError && !isListingTables && discoveredTables.length > 0 && (
                            <div className="border rounded-md mt-1 max-h-60 overflow-y-auto bg-white shadow-sm">
                                {discoveredTables.map((table, index) => (
                                    <button
                                        key={`${table.path}-${index}`} // Use path and index for key
                                        type="button"
                                        className="w-full text-left p-3 text-sm hover:bg-primary/10 focus:bg-primary/10 focus:outline-none border-b last:border-b-0 flex justify-between items-center transition-colors duration-150"
                                        onClick={() => handleTableSelect(table)}
                                        title={`Select table: ${table.path}`}
                                    >
                                        <span className="flex-grow min-w-0 mr-2"> {/* Allow shrinking/wrapping */}
                                            <i className="ri-table-line mr-2 text-neutral-400 align-middle"></i>
                                            <span className="font-medium align-middle">{table.path.split('/').filter(Boolean).pop() || table.path}</span>
                                            <span className="text-xs text-neutral-500 ml-2 hidden sm:inline align-middle truncate">({table.path})</span>
                                        </span>
                                        <Badge variant="secondary" className="text-xs flex-shrink-0">{table.type || 'Unknown'}</Badge>
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

            {/* Simple CSS for Collapsible animation */}
            <style>{`
                .CollapsibleContent {
                    overflow: hidden;
                }
                .CollapsibleContent[data-state='open'] {
                    animation: slideDown 300ms ease-out;
                }
                .CollapsibleContent[data-state='closed'] {
                    animation: slideUp 300ms ease-out;
                }
                @keyframes slideDown { from { height: 0; opacity: 0; } to { height: var(--radix-collapsible-content-height); opacity: 1; } }
                @keyframes slideUp { from { height: var(--radix-collapsible-content-height); opacity: 1; } to { height: 0; opacity: 0; } }
            `}</style>
        </div>
    );
}