import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { formatDate, timeAgo, formatBytes } from '@/lib/formatUtils'; // Assuming these utils exist
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, ArrowUp, ArrowDown, Minus, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Assuming metadataAtom is correctly imported if using Recoil
// import { useRecoilState } from 'recoil';
// import { metadataAtom } from '@/atoms/metadataAtom'; // Adjust import path as needed

// Helper function to compare two schema definitions (fields array)
// schema1 = older, schema2 = newer
const compareSchemaDefinitions = (schema1, schema2) => {
  if (!schema1?.fields || !schema2?.fields) {
    console.warn("Cannot compare invalid schema definitions:", schema1, schema2);
    return { added: [], removed: [], modified: [] };
  }

  const fields1Map = new Map(schema1.fields.map(f => [f.name, f]));
  const fields2Map = new Map(schema2.fields.map(f => [f.name, f]));

  const added = [];
  const removed = [];
  const modified = [];

  // Find added fields (in schema2 but not in schema1)
  for (const [name, field2] of fields2Map.entries()) {
    if (!fields1Map.has(name)) {
      added.push(field2);
    }
  }

  // Find removed and modified fields (in schema1)
  for (const [name, field1] of fields1Map.entries()) {
    if (!fields2Map.has(name)) {
      removed.push(field1);
    } else {
      // Field exists in both, check for modifications
      const field2 = fields2Map.get(name);
      const diffDetails = {};

      // Compare required status (handles both boolean true/false and potentially undefined)
      const required1 = field1.required === true; // Treat undefined/null as false
      const required2 = field2.required === true;
      if (required1 !== required2) {
        diffDetails.required = { from: required1, to: required2 };
      }

      // Compare type (simple string comparison)
      const type1 = (field1.type || '').toString().trim();
      const type2 = (field2.type || '').toString().trim();
      if (type1 !== type2) {
        diffDetails.type = { from: field1.type, to: field2.type };
      }

      // Compare documentation (optional)
      // const doc1 = field1.doc || '';
      // const doc2 = field2.doc || '';
      // if (doc1 !== doc2) {
      //    diffDetails.doc = { from: doc1, to: doc2 };
      // }

      if (Object.keys(diffDetails).length > 0) {
        modified.push({
          name: name,
          changes: diffDetails,
          type: field2.type // Store the newer type for context
        });
      }
    }
  }

  return { added, removed, modified };
};

// Base URL for backend
const API_BASE_URL = 'http://localhost:5000'; // Adjust if necessary

// Trend Indicator Component
const TrendIndicator = ({ value }) => {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    // Handle null, undefined, NaN, and Infinity explicitly
     if (value === Infinity) return <span className="text-xs font-medium text-green-600 flex items-center"><ArrowUp className="h-3 w-3 mr-0.5" /> Inf%</span>;
     if (value === -Infinity) return <span className="text-xs font-medium text-red-600 flex items-center"><ArrowDown className="h-3 w-3 mr-0.5" /> Inf%</span>;
    return <span className="text-xs text-neutral-500">-</span>;
  }
  const roundedValue = parseFloat(value.toFixed(1)); // Round to 1 decimal place

  if (roundedValue > 0) {
    return (
      <span className="text-xs font-medium text-green-600 flex items-center">
        <ArrowUp className="h-3 w-3 mr-0.5" /> {roundedValue}%
      </span>
    );
  } else if (roundedValue < 0) {
    return (
      <span className="text-xs font-medium text-red-600 flex items-center">
        <ArrowDown className="h-3 w-3 mr-0.5" /> {Math.abs(roundedValue)}%
      </span>
    );
  } else { // roundedValue === 0
    return (
      <span className="text-xs font-medium text-neutral-500 flex items-center">
        <Minus className="h-3 w-3 mr-0.5" /> {roundedValue}%
      </span>
    );
  }
};


// Helper to format stats for summary prompt
const formatStatsForSummary = (results, v1Label, v2Label) => {
  let summaryString = `Comparing ${v1Label} to ${v2Label}:\n`;
  results.forEach(res => {
    const value1Str = res.format(res.value1);
    const value2Str = res.format(res.value2);
    // Ensure diff is formatted using the same function as values for consistency (e.g., bytes vs numbers)
    const diffStr = `${res.diff >= 0 ? '+' : ''}${res.format(res.diff)}`;
    let percentStr = '';
    if (res.percentChange === null || !isFinite(res.percentChange)) {
        percentStr = res.diff !== 0 ? (res.diff > 0 ? '(New/Inf)' : '(Removed/Inf)') : '(No Change)';
    } else {
        percentStr = `(${res.diff >= 0 ? '+' : ''}${res.percentChange.toFixed(1)}%)`;
    }
    summaryString += `- ${res.label}: ${value1Str} -> ${value2Str} (${diffStr}, ${percentStr})\n`;
  });
  return summaryString;
};

// --- Main Component ---
export default function SchemaHistoryViewer({ responseData }) {
  const [activeTab, setActiveTab] = useState('changes'); // Default tab
  const [selectedVersion1, setSelectedVersion1] = useState(null); // Intended Older for comparison
  const [selectedVersion2, setSelectedVersion2] = useState(null); // Intended Newer for comparison

  // State for Schema Comparison API call
  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState(null);

  // State for Stats Comparison calculations derived from responseData
  const [statsComparisonResults, setStatsComparisonResults] = useState([]);
  const [statsOlderLabel, setStatsOlderLabel] = useState('');
  const [statsNewerLabel, setStatsNewerLabel] = useState('');

  // State for AI Summary API call
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // Derived data from props
  const tableType = responseData?.table_type;
  const s3Url = responseData?.location;
  const versions = useMemo(() =>
    (responseData?.version_history?.snapshots_overview || []).slice().reverse(),
    [responseData] // Depend only on the source data prop
  );

  const identifierKey = tableType === 'Iceberg' ? 'sequence-number' : 'snapshot-id';
  const versionIdKey = tableType === 'Iceberg' ? 'sequence-number' : 'snapshot-id';

  // Options for dropdowns
  const versionOptions = useMemo(() => {
    return versions.map(v => ({
      value: v[versionIdKey]?.toString(),
      label: `${tableType === 'Iceberg' ? 'Seq' : 'V'}${v[versionIdKey]} (${formatDate(v['timestamp-ms'])})`,
      timestamp: v['timestamp-ms']
    }));
  }, [versions, versionIdKey, tableType]);

  // --- API Call: Fetch schema comparison ---
  const fetchSchemaComparison = async (v1, v2) => {
    if (!v1 || !v2 || !tableType || !s3Url || v1 === v2) {
        setComparisonData(null); setComparisonError(null); setComparisonLoading(false); return;
    }
    setComparisonLoading(true); setComparisonError(null); setComparisonData(null);
    const endpoint = tableType === 'Iceberg' ? 'Iceberg' : 'Delta';
    const params = tableType === 'Iceberg' ? { s3_url: s3Url, seq1: v1, seq2: v2 } : { s3_url: s3Url, v1: v1, v2: v2 };
    try {
      const response = await axios.get(`${API_BASE_URL}/compare_schema/${endpoint}`, { params });
      setComparisonData(response.data);
    } catch (error) {
      console.error("Error fetching schema comparison:", error);
      const message = error.response?.data?.error || error.message || 'Failed comparison fetch';
      setComparisonError(message);
    } finally {
      setComparisonLoading(false);
    }
  };

  // --- API Call: Fetch AI summary ---
  const fetchSummary = async (comparisonDetailsString, v1Label, v2Label) => {
    if (!comparisonDetailsString || !v1Label || !v2Label) {
        // Reset if input is invalid
        setSummary(''); setSummaryError(null); setIsSummarizing(false);
        return;
    }
    setIsSummarizing(true); setSummaryError(null); setSummary('');
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-summary`, {
        comparison: comparisonDetailsString, v1_label: v1Label, v2_label: v2Label,
      });
      setSummary(response.data?.summary || 'No summary generated.');
    } catch (error) {
      console.error("Error generating summary:", error);
      setSummaryError(error.response?.data?.error || error.message || "Failed to generate summary.");
    } finally {
      setIsSummarizing(false);
    }
  };

   // --- Effect: Set initial dropdown values ---
   useEffect(() => {
     if (versionOptions.length >= 2 && !selectedVersion1 && !selectedVersion2) {
       setSelectedVersion1(versionOptions[1].value); // Default: second newest
       setSelectedVersion2(versionOptions[0].value); // Default: newest
     } else if (versionOptions.length === 1 && !selectedVersion1) {
       setSelectedVersion1(versionOptions[0].value); setSelectedVersion2(null);
     }
     // Run only when options are populated or change identity
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [versionOptions]);

   // --- Effect: Fetch Schema Comparison, Calculate Stats, Fetch Summary on Selection Change ---
   useEffect(() => {
     // Check for valid, different selections
     if (!selectedVersion1 || !selectedVersion2 || selectedVersion1 === selectedVersion2) {
       setComparisonData(null); setComparisonError(null); setComparisonLoading(false);
       setStatsComparisonResults([]); setSummary(''); setSummaryError(null); setIsSummarizing(false);
       setStatsOlderLabel(''); setStatsNewerLabel('');
       return; // Exit if selection is invalid
     }

     // Trigger schema comparison fetch
     fetchSchemaComparison(selectedVersion1, selectedVersion2);

     // Find corresponding version data for stats calculation
     const version1DataRaw = versions.find(v => v[versionIdKey]?.toString() === selectedVersion1);
     const version2DataRaw = versions.find(v => v[versionIdKey]?.toString() === selectedVersion2);

     if (!version1DataRaw || !version2DataRaw) {
       setStatsComparisonResults([]); setSummary(''); setIsSummarizing(false);
       setSummaryError('Could not find data for selected versions to calculate stats.');
       setStatsOlderLabel(''); setStatsNewerLabel('');
       return; // Exit if data not found
     }

     // Determine older/newer based on timestamp
     let olderVersionData, newerVersionData;
     olderVersionData = version1DataRaw; newerVersionData = version2DataRaw;
    //  if (version1DataRaw.timestamp < version2DataRaw.timestamp) {
    //  } else { // Handles equality or v1 being newer
    //      olderVersionData = version2DataRaw; newerVersionData = version1DataRaw;
    //  }

     const summary1 = olderVersionData.summary || {};
     const summary2 = newerVersionData.summary || {};

     // Define safe parsing and calculation functions locally
     const safeParse = (val) => { if(val===null||val===undefined) return 0; const num=parseFloat(val); return isNaN(num)?0:num;};
     const calculateStatChange = (key) => { const v1=safeParse(summary1[key]);const v2=safeParse(summary2[key]);const diff=v2-v1;let pc=null;if(v1!==0){pc=(diff/Math.abs(v1))*100;}else if(diff!==0){pc=Infinity*Math.sign(diff);}else{pc=0;}return{value1:v1,value2:v2,diff,percentChange:pc};};
     const statsToCompare = [{key:'total-records',label:'Total Records',format:(v)=>v.toLocaleString()},{key:'total-data-files',label:'Total Data Files',format:(v)=>v.toLocaleString()},{key:'total-delete-files',label:'Total Delete Files',format:(v)=>v.toLocaleString()},{key:'total-files-size',label:'Total Files Size',format:(v)=>formatBytes(v||0)},{key:'total-position-deletes',label:'Total Position Deletes',format:(v)=>v.toLocaleString()},{key:'total-equality-deletes',label:'Total Equality Deletes',format:(v)=>v.toLocaleString()},];

     // Calculate results
     const results = statsToCompare.map(stat => ({ ...stat, ...calculateStatChange(stat.key) }));

     const olderLabel = `${tableType === 'Iceberg' ? 'Seq' : 'V'}${olderVersionData[versionIdKey]}`;
     const newerLabel = `${tableType === 'Iceberg' ? 'Seq' : 'V'}${newerVersionData[versionIdKey]}`;

     // Update state for rendering
     setStatsComparisonResults(results);
     setStatsOlderLabel(olderLabel);
     setStatsNewerLabel(newerLabel);

     // Format and fetch AI summary
     const summaryString = formatStatsForSummary(results, olderLabel, newerLabel);
     fetchSummary(summaryString, olderLabel, newerLabel);

   // Re-run this entire effect if selections, source data, or identifiers change
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [selectedVersion1, selectedVersion2, versions, versionIdKey, tableType, s3Url]);

  // --- Calculate historical field changes (for "Field Change Log" tab) ---
  const historicalFieldChanges = useMemo(() => {
    const changes = [];
    for (let i = 0; i < versions.length - 1; i++) {
      const previousVersion = versions[i]; // Newer version (due to reverse)
      const currentVersion = versions[i + 1]; // Older version
      const currentSchema = currentVersion?.schema_definition;
      const previousSchema = previousVersion?.schema_definition;
      if (!currentSchema || !previousSchema) { console.warn(`Skipping hist. compare for ${currentVersion[versionIdKey]}`); continue; }

      const diff = compareSchemaDefinitions(previousSchema, currentSchema); // Pass older, newer
      
      diff.added.forEach(field => changes.push({ versionId: previousVersion[versionIdKey], timestamp: previousVersion['timestamp-ms'], field: field.name, type: field.type, required: field.required, changeType: 'add', }));

      diff.removed.forEach(field => changes.push({ versionId: previousVersion[versionIdKey], timestamp: previousVersion['timestamp-ms'], field: field.name, type: field.type, required: field.required, changeType: 'remove', }));

      diff.modified.forEach(mod => changes.push({ versionId: previousVersion[versionIdKey], timestamp: previousVersion['timestamp-ms'], field: mod.name, type: mod.type, required: mod.changes?.required?.to, changeType: 'modify', details: mod.changes }));
    }
    changes.sort((a, b) => b.timestamp - a.timestamp); // Newest change first
    return changes;
  }, [versions, versionIdKey]); // Dependency array

  // --- Render change badge ---
  const renderChangeBadge = (changeType) => {
      switch (changeType) { case 'add': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Added</Badge>; case 'remove': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Removed</Badge>; case 'modify': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Modified</Badge>; default: return null; }
  };

  // --- Render schema comparison results ---
  const renderComparisonState = () => {
       if (comparisonLoading) { return <div className="flex items-center justify-center text-neutral-500 py-10"><Loader2 className="mr-2 h-4 w-4 animate-spin" /><span>Loading comparison...</span></div>; }
       if (comparisonError) { return <div className="flex items-center justify-center text-red-600 py-10 px-4 bg-red-50 border border-red-200 rounded-md"><AlertCircle className="mr-2 h-5 w-5" /><span className="text-sm">Error: {comparisonError}</span></div>; }
       if (!comparisonData) { return <div className="text-center p-4 text-neutral-500">Select two different versions to compare schemas.</div>; }
       const { added = [], removed = [], modified = [] } = comparisonData.schema_comparison || {};
       const v1SchemaLabel = comparisonData?.version1?.label || `${tableType === 'Iceberg' ? 'Seq' : 'V'}${selectedVersion1}`;
       const v2SchemaLabel = comparisonData?.version2?.label || `${tableType === 'Iceberg' ? 'Seq' : 'V'}${selectedVersion2}`;
        return ( <> <div className="text-xs text-neutral-600 mb-3 text-center px-4"> Showing schema differences between <span className="font-semibold">{v1SchemaLabel}</span> and <span className="font-semibold">{v2SchemaLabel}</span>. </div> <div className="flex border rounded-md overflow-hidden"> <div className="flex-1 p-4 bg-red-50 border-r"> <h4 className="text-sm font-medium mb-2">Removed Fields ({removed.length})</h4> {removed.length > 0 ? removed.map((field, idx) => ( <div key={`cremove-${idx}`} className="text-sm mb-1 p-2 bg-white rounded border border-red-200 shadow-sm"><div className="font-medium">{field.name}</div><div className="text-xs text-neutral-600">Type: {field.type}</div></div> )) : <div className="text-xs text-neutral-500 italic">None</div>} </div> <div className="flex-1 p-4 bg-yellow-50 border-r"> <h4 className="text-sm font-medium mb-2">Modified Fields ({modified.length})</h4> {modified.length > 0 ? modified.map((mod, idx) => ( <div key={`cmodify-${idx}`} className="text-sm mb-1 p-2 bg-white rounded border border-yellow-200 shadow-sm"><div className="font-medium">{mod.name}</div> {mod.changes?.type && <div className="text-xs"> Type: <span className="line-through text-red-500">{mod.changes.type.from}</span> → <span className="text-green-500">{mod.changes.type.to}</span> </div>} {mod.changes?.required !== undefined && <div className="text-xs"> Required: <span className={mod.changes.required.from ? "text-red-500" : ""}>{mod.changes.required.from ? 'Yes' : 'No'}</span> → <span className={mod.changes.required.to ? "text-green-500" : ""}>{mod.changes.required.to ? 'Yes' : 'No'}</span> </div>} </div> )) : <div className="text-xs text-neutral-500 italic">None</div>} </div> <div className="flex-1 p-4 bg-green-50"> <h4 className="text-sm font-medium mb-2">Added Fields ({added.length})</h4> {added.length > 0 ? added.map((field, idx) => ( <div key={`cadd-${idx}`} className="text-sm mb-1 p-2 bg-white rounded border border-green-200 shadow-sm"><div className="font-medium">{field.name}</div><div className="text-xs text-neutral-600">Type: {field.type}</div><div className="text-xs text-neutral-600">Required: {field.required ? 'Yes' : 'No'}</div></div> )) : <div className="text-xs text-neutral-500 italic">None</div>} </div> </div> </> );
  };

  // --- Render stats comparison table ---
  const renderStatsComparisonTable = () => {
    if (!selectedVersion1 || !selectedVersion2) { return <div className="text-center p-4 text-neutral-500">Please select two versions...</div>; }
    if (selectedVersion1 === selectedVersion2) { return <div className="text-center p-4 text-orange-600">Please select two different versions...</div>; }
    if (statsComparisonResults.length === 0) { return <div className="text-center p-4 text-neutral-500">Calculating statistics...</div>; }

     return (
         <Card>
            <CardHeader className="pb-2">
                 <CardTitle className="text-base">Statistics Comparison</CardTitle>
                 <div className="text-xs text-neutral-500 pt-1"> Comparing state at <span className="font-semibold">{statsOlderLabel}</span> vs <span className="font-semibold">{statsNewerLabel}</span> </div>
            </CardHeader>
             <CardContent>
                 <Table>
                     <TableHeader><TableRow>
                         <TableHead className="w-[200px]">Metric</TableHead>
                         <TableHead className="text-right">{statsOlderLabel}</TableHead>
                         <TableHead className="text-right">{statsNewerLabel}</TableHead>
                         <TableHead className="text-right w-[120px]">Change</TableHead>
                         <TableHead className="text-right w-[100px]">Trend (%)</TableHead>
                     </TableRow></TableHeader>
                     <TableBody>
                         {statsComparisonResults.map(res => (
                             <TableRow key={res.key}>
                                 <TableCell className="font-medium text-sm">{res.label}</TableCell>
                                 <TableCell className="text-right text-sm font-mono">{res.format(res.value1)}</TableCell>
                                 <TableCell className="text-right text-sm font-mono">{res.format(res.value2)}</TableCell>
                                 <TableCell className={`text-right text-sm font-mono ${res.diff > 0 ? 'text-green-700' : res.diff < 0 ? 'text-red-700' : 'text-neutral-500'}`}> {res.diff > 0 ? '+' : ''}{res.format(res.diff)} </TableCell>
                                 <TableCell className="text-right"> <TrendIndicator value={res.percentChange} /> </TableCell>
                             </TableRow>
                         ))}
                     </TableBody>
                 </Table>
             </CardContent>
         </Card>
     );
   };

  // --- Main Render ---
  if (!responseData) { return <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center"><Loader2 className="mx-auto h-8 w-8 text-neutral-400 animate-spin mb-2" /><h3 className="text-lg font-medium text-neutral-700">Loading History...</h3></div>; }
  if (!versions.length) { return <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center"><div className="text-3xl text-neutral-400 mb-2"><i className="ri-folder-history-line"></i></div><h3 className="text-lg font-medium text-neutral-700">No Version History Found</h3><p className="text-neutral-500 mt-1">Cannot display schema history.</p></div>; }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
      <div className="flex justify-between items-center p-4 border-b border-neutral-200">
        <h2 className="text-base font-medium">Version History & Comparison</h2>
        <div className="text-xs text-neutral-500">{versions.length} versions found</div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4 grid grid-cols-4">
             <TabsTrigger value="changes">Field Change Log</TabsTrigger>
             <TabsTrigger value="versions">All Versions</TabsTrigger>
             <TabsTrigger value="diff">Schema Compare</TabsTrigger>
             <TabsTrigger value="stats">Stats Compare</TabsTrigger>
          </TabsList>

          {/* Field Changes Tab */}
          <TabsContent value="changes">
            {historicalFieldChanges.length > 0 ? ( <div className="border rounded-md overflow-hidden"> <Table> <TableHeader><TableRow> <TableHead className="w-[120px]">Effective At</TableHead> <TableHead>Field</TableHead> <TableHead>Change</TableHead> <TableHead>Details</TableHead> <TableHead className="w-[180px]">Timestamp</TableHead> </TableRow></TableHeader> <TableBody> {historicalFieldChanges.map((change, idx) => ( <TableRow key={`${change.versionId}-${change.field}-${idx}`}> <TableCell className="font-mono text-xs">{tableType === 'Iceberg' ? 'Seq' : 'V'}{change.versionId}</TableCell> <TableCell className="font-medium">{change.field}</TableCell> <TableCell>{renderChangeBadge(change.changeType)}</TableCell> <TableCell> {change.changeType === 'modify' ? ( <span className="text-xs"> {change.details?.type && <>Type: <span className="line-through text-red-500">{change.details.type.from}</span> → <span className="text-green-500">{change.details.type.to}</span><br/></>} {change.details?.required !== undefined && <>Required: <span className={change.details.required.from ? "text-red-500" : ""}>{change.details.required.from ? 'Yes' : 'No'}</span> → <span className={change.details.required.to ? "text-green-500" : ""}>{change.details.required.to ? 'Yes' : 'No'}</span></>} </span> ) : ( <span className="text-xs">Type: {change.type}</span> )} </TableCell> <TableCell><div className="text-xs"> <div>{formatDate(change.timestamp)}</div> <div className="text-neutral-500">{timeAgo(change.timestamp)}</div> </div></TableCell> </TableRow> ))} </TableBody> </Table> </div> ) : ( <div className="text-center p-4 text-neutral-500"> No historical schema changes detected or data unavailable. </div> )}
          </TabsContent>

          {/* All Versions Tab */}
          <TabsContent value="versions">
             <div className="border rounded-md overflow-hidden"> <Table> <TableHeader><TableRow> <TableHead className="w-[120px]">Version ID</TableHead> <TableHead>Operation / Summary</TableHead> <TableHead className="w-[100px]">Fields</TableHead> <TableHead className="w-[180px]">Timestamp</TableHead> </TableRow></TableHeader> <TableBody> {versions.map((version) => ( <TableRow key={version[versionIdKey]}> <TableCell className="font-mono text-xs">{version[versionIdKey]}</TableCell> <TableCell className="text-xs"> {version.summary?.operation ? ( <><span className="font-medium">{version.summary.operation}</span><span className="text-neutral-500 ml-2">(+{version.summary['added-data-files'] || version.summary['added_data_files'] || 0}f, +{version.summary['added-records'] || 0}r)</span></> ) : (version.operation || '—') } </TableCell> <TableCell className="text-xs text-center"> {version.schema_definition?.fields ? version.schema_definition.fields.length : 'N/A'} </TableCell> <TableCell><div className="text-xs"> <div>{formatDate(version['timestamp-ms'])}</div> <div className="text-neutral-500">{timeAgo(version['timestamp-ms'])}</div> </div></TableCell> </TableRow> ))} </TableBody> </Table> </div>
           </TabsContent>

          {/* Schema Compare Tab */}
          <TabsContent value="diff">
             {versions.length >= 1 ? ( <div> <div className="flex items-end space-x-4 mb-4 p-4 border rounded-md bg-neutral-50"> <div className="flex-1"><label className="block text-xs font-medium text-neutral-600 mb-1">Compare (Older)</label><Select value={selectedVersion1||''} onValueChange={setSelectedVersion1}><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{versionOptions.map(opt=>(<SelectItem key={'d1-'+opt.value} value={opt.value} disabled={opt.value===selectedVersion2}>{opt.label}</SelectItem>))}</SelectContent></Select></div> <div className="text-neutral-400 pb-2">vs</div> <div className="flex-1"><label className="block text-xs font-medium text-neutral-600 mb-1">With (Newer)</label><Select value={selectedVersion2||''} onValueChange={setSelectedVersion2}><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{versionOptions.map(opt=>(<SelectItem key={'d2-'+opt.value} value={opt.value} disabled={opt.value===selectedVersion1}>{opt.label}</SelectItem>))}</SelectContent></Select></div> </div> {renderComparisonState()} </div> ) : ( <div className="text-center p-4 text-neutral-500">Need versions for diff.</div> )}
          </TabsContent>

          {/* Stats Compare Tab */}
          <TabsContent value="stats">
             {versions.length >= 1 ? (
               <div className="space-y-6"> {/* Added space between elements */}
                 {/* Dropdown Selectors */}
                  <div className="flex items-end space-x-4 p-4 border rounded-md bg-neutral-50">
                     {/* ... Dropdown JSX ... */}
                     <div className="flex-1"><label className="block text-xs font-medium text-neutral-600 mb-1">Compare Version (Older)</label><Select value={selectedVersion1||''} onValueChange={setSelectedVersion1}><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{versionOptions.map(opt=>(<SelectItem key={'s1-'+opt.value} value={opt.value} disabled={opt.value===selectedVersion2}>{opt.label}</SelectItem>))}</SelectContent></Select></div>
                     <div className="text-neutral-400 pb-2">vs</div>
                     <div className="flex-1"><label className="block text-xs font-medium text-neutral-600 mb-1">With Version (Newer)</label><Select value={selectedVersion2||''} onValueChange={setSelectedVersion2}><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{versionOptions.map(opt=>(<SelectItem key={'s2-'+opt.value} value={opt.value} disabled={opt.value===selectedVersion1}>{opt.label}</SelectItem>))}</SelectContent></Select></div>
                  </div>

                 {/* Render Stats Comparison Table */}
                 {renderStatsComparisonTable()}

                 {/* Summary Section (Moved inside this tab) */}
                 <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-2 flex items-center text-neutral-700">
                       <Sparkles className="w-4 h-4 mr-2 text-primary" /> AI Generated Summary
                    </h3>
                    {isSummarizing && ( <div className="flex items-center text-neutral-500 text-sm p-3 bg-neutral-50 rounded-md border"><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Generating summary...</div> )}
                    {summaryError && !isSummarizing && ( <div className="flex items-center text-red-600 text-sm p-3 bg-red-50 rounded-md border border-red-200"><AlertCircle className="w-4 h-4 mr-2"/> Error: {summaryError}</div> )}
                    {summary && !isSummarizing && !summaryError && ( <div className="text-sm text-neutral-700 p-3 bg-blue-50 rounded-md border border-blue-200 whitespace-pre-wrap"><div dangerouslySetInnerHTML={{ __html: summary.replace('`', '').replace('html', '') }} /></div> )}
                    {!isSummarizing && !summaryError && !summary && selectedVersion1 && selectedVersion2 && selectedVersion1 !== selectedVersion2 && statsComparisonResults.length > 0 && (
                        <div className="text-sm text-neutral-500 italic p-3 text-center">Summary will appear here shortly.</div>
                    )}
                     {!isSummarizing && !summaryError && !summary && (!selectedVersion1 || !selectedVersion2 || selectedVersion1 === selectedVersion2) && (
                         <div className="text-sm text-neutral-500 italic p-3 text-center">Select two different versions to generate a summary.</div>
                     )}
                 </div>

               </div>
             ) : ( <div className="text-center p-4 text-neutral-500">Need versions to compare stats.</div> )}
           </TabsContent>

         </Tabs>
       </div>
     </div>
   );
 }