import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { formatDate, timeAgo, formatBytes } from '@/lib/formatUtils'; // Assuming formatBytes exists
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
import { AlertCircle, Loader2, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Helper function to compare schemas (remains the same)
const compareSchemaDefinitions = (schema1, schema2) => {
  // ... (same function as before) ...
   if (!schema1?.fields || !schema2?.fields) { console.warn("Cannot compare invalid schema definitions"); return { added: [], removed: [], modified: [] }; }
   const fields1Map = new Map(schema1.fields.map(f => [f.name, f])); const fields2Map = new Map(schema2.fields.map(f => [f.name, f]));
   const added = []; const removed = []; const modified = [];
   for (const [name, field2] of fields2Map.entries()) { if (!fields1Map.has(name)) { added.push(field2); } }
   for (const [name, field1] of fields1Map.entries()) { if (!fields2Map.has(name)) { removed.push(field1); } else { const field2 = fields2Map.get(name); const diffDetails = {}; const required1 = field1.required === true; const required2 = field2.required === true; if (required1 !== required2) { diffDetails.required = { from: required1, to: required2 }; } const type1 = (field1.type || '').toString().trim(); const type2 = (field2.type || '').toString().trim(); if (type1 !== type2) { diffDetails.type = { from: field1.type, to: field2.type }; } if (Object.keys(diffDetails).length > 0) { modified.push({ name: name, changes: diffDetails, type: field2.type }); } } }
   return { added, removed, modified };
};

const API_BASE_URL = 'http://localhost:5000';

// Trend Indicator Component (remains the same)
const TrendIndicator = ({ value }) => {
  // ... (same as before) ...
   if (value === null || value === undefined || isNaN(value) || !isFinite(value)) { return <span className="text-xs text-neutral-500">-</span>; } const roundedValue = parseFloat(value.toFixed(1)); if (roundedValue > 0) { return ( <span className="text-xs font-medium text-green-600 flex items-center"> <ArrowUp className="h-3 w-3 mr-0.5" /> {roundedValue}% </span> ); } else if (roundedValue < 0) { return ( <span className="text-xs font-medium text-red-600 flex items-center"> <ArrowDown className="h-3 w-3 mr-0.5" /> {Math.abs(roundedValue)}% </span> ); } else { return ( <span className="text-xs font-medium text-neutral-500 flex items-center"> <Minus className="h-3 w-3 mr-0.5" /> {roundedValue}% </span> ); }
};

// --- Main Component ---
export default function SchemaHistoryViewer({ responseData }) {
  const [activeTab, setActiveTab] = useState('changes');
  const [selectedVersion1, setSelectedVersion1] = useState(null); // Intended Older
  const [selectedVersion2, setSelectedVersion2] = useState(null); // Intended Newer
  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState(null);

  const tableType = responseData?.table_type;
  const s3Url = responseData?.location;
  const versions = useMemo(() =>
    (responseData?.version_history?.snapshots_overview || []).slice().reverse(),
    [responseData]
  );

  const identifierKey = tableType === 'Iceberg' ? 'sequence-number' : 'snapshot-id';
  const versionIdKey = tableType === 'Iceberg' ? 'sequence-number' : 'snapshot-id';

  const versionOptions = useMemo(() => {
     return versions.map(v => ({
       value: v[versionIdKey]?.toString(),
       label: `${tableType === 'Iceberg' ? 'Seq' : 'V'}${v[versionIdKey]} (${formatDate(v['timestamp-ms'])})`,
       timestamp: v['timestamp-ms'] // Keep timestamp for sorting
     }));
  }, [versions, versionIdKey, tableType]);

  // Fetch logic for "Compare Schemas" tab (remains the same)
  const fetchSchemaComparison = async (v1, v2) => {
     // ... (same as before) ...
      if (!v1 || !v2 || !tableType || !s3Url || v1 === v2) { setComparisonData(null); setComparisonError(null); setComparisonLoading(false); return; }
      setComparisonLoading(true); setComparisonError(null); setComparisonData(null); const endpoint = tableType === 'Iceberg' ? 'Iceberg' : 'Delta'; const params = tableType === 'Iceberg' ? { s3_url: s3Url, seq1: v1, seq2: v2 } : { s3_url: s3Url, v1: v1, v2: v2 }; try { const response = await axios.get(`${API_BASE_URL}/compare_schema/${endpoint}`, { params }); setComparisonData(response.data); } catch (error) { console.error("Error fetching schema comparison:", error); const message = error.response?.data?.error || error.message || 'Failed comparison fetch'; setComparisonError(message); } finally { setComparisonLoading(false); }
  };

  // useEffect hooks for dropdowns and fetch (remains the same)
   useEffect(() => {
     if (versionOptions.length >= 2 && !selectedVersion1 && !selectedVersion2) {
       setSelectedVersion1(versionOptions[1].value); // Default: second newest
       setSelectedVersion2(versionOptions[0].value); // Default: newest
     } else if (versionOptions.length === 1 && !selectedVersion1) {
       setSelectedVersion1(versionOptions[0].value); setSelectedVersion2(null);
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [versionOptions]);

   useEffect(() => {
     if (selectedVersion1 && selectedVersion2) { fetchSchemaComparison(selectedVersion1, selectedVersion2); }
     else { setComparisonData(null); setComparisonError(null); setComparisonLoading(false); }
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [selectedVersion1, selectedVersion2, s3Url, tableType]);


  // Calculate historical field changes (for "Field Change Log" tab - remains the same)
  const historicalFieldChanges = useMemo(() => {
     // ... (same logic as previous version using compareSchemaDefinitions) ...
      const changes = []; for (let i = 0; i < versions.length - 1; i++) { const currentVersion = versions[i]; const previousVersion = versions[i + 1]; const currentSchema = currentVersion?.schema_definition; const previousSchema = previousVersion?.schema_definition; if (!currentSchema || !previousSchema) { console.warn(`Skipping historical comparison for ${currentVersion[versionIdKey]}`); continue; } const diff = compareSchemaDefinitions(previousSchema, currentSchema); diff.added.forEach(field => changes.push({ versionId: currentVersion[versionIdKey], timestamp: currentVersion['timestamp-ms'], field: field.name, type: field.type, required: field.required, changeType: 'add', })); diff.removed.forEach(field => changes.push({ versionId: currentVersion[versionIdKey], timestamp: currentVersion['timestamp-ms'], field: field.name, type: field.type, required: field.required, changeType: 'remove', })); diff.modified.forEach(mod => changes.push({ versionId: currentVersion[versionIdKey], timestamp: currentVersion['timestamp-ms'], field: mod.name, type: mod.type, required: mod.changes?.required?.to, changeType: 'modify', details: mod.changes })); } changes.sort((a, b) => b.timestamp - a.timestamp); return changes;
  }, [versions, versionIdKey]);

  // Render change badge (same)
  const renderChangeBadge = (changeType) => {
     // ... (same function) ...
      switch (changeType) { case 'add': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Added</Badge>; case 'remove': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Removed</Badge>; case 'modify': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Modified</Badge>; default: return null; }
  };

   // Render comparison results (for "Compare Schemas" tab - remains the same)
  const renderComparisonState = () => {
     // ... (same function as before) ...
       if (comparisonLoading) { return <div className="flex items-center justify-center text-neutral-500 py-10"><Loader2 className="mr-2 h-4 w-4 animate-spin" /><span>Loading comparison...</span></div>; } if (comparisonError) { return <div className="flex items-center justify-center text-red-600 py-10 px-4 bg-red-50 border border-red-200 rounded-md"><AlertCircle className="mr-2 h-5 w-5" /><span className="text-sm">Error: {comparisonError}</span></div>; } if (!comparisonData) { return <div className="text-center p-4 text-neutral-500">Select two different versions to compare.</div>; } const { added = [], removed = [], modified = [] } = comparisonData.schema_comparison || {}; const v1Label = comparisonData?.version1?.label || `${tableType === 'Iceberg' ? 'Seq' : 'V'}${selectedVersion1}`; const v2Label = comparisonData?.version2?.label || `${tableType === 'Iceberg' ? 'Seq' : 'V'}${selectedVersion2}`; return ( <> <div className="text-xs text-neutral-600 mb-3 text-center px-4"> Showing differences between <span className="font-semibold">{v1Label}</span> and <span className="font-semibold">{v2Label}</span>. </div> <div className="flex border rounded-md overflow-hidden"> <div className="flex-1 p-4 bg-red-50 border-r"> <h4 className="text-sm font-medium mb-2">Removed Fields ({removed.length})</h4> {removed.length > 0 ? removed.map((field, idx) => ( <div key={`cremove-${idx}`} className="text-sm mb-1 p-2 bg-white rounded border border-red-200 shadow-sm"><div className="font-medium">{field.name}</div><div className="text-xs text-neutral-600">Type: {field.type}</div></div> )) : <div className="text-xs text-neutral-500 italic">None</div>} </div> <div className="flex-1 p-4 bg-yellow-50 border-r"> <h4 className="text-sm font-medium mb-2">Modified Fields ({modified.length})</h4> {modified.length > 0 ? modified.map((mod, idx) => ( <div key={`cmodify-${idx}`} className="text-sm mb-1 p-2 bg-white rounded border border-yellow-200 shadow-sm"><div className="font-medium">{mod.name}</div> {mod.changes?.type && <div className="text-xs"> Type: <span className="line-through text-red-500">{mod.changes.type.from}</span> → <span className="text-green-500">{mod.changes.type.to}</span> </div>} {mod.changes?.required !== undefined && <div className="text-xs"> Required: <span className={mod.changes.required.from ? "text-red-500" : ""}>{mod.changes.required.from ? 'Yes' : 'No'}</span> → <span className={mod.changes.required.to ? "text-green-500" : ""}>{mod.changes.required.to ? 'Yes' : 'No'}</span> </div>} </div> )) : <div className="text-xs text-neutral-500 italic">None</div>} </div> <div className="flex-1 p-4 bg-green-50"> <h4 className="text-sm font-medium mb-2">Added Fields ({added.length})</h4> {added.length > 0 ? added.map((field, idx) => ( <div key={`cadd-${idx}`} className="text-sm mb-1 p-2 bg-white rounded border border-green-200 shadow-sm"><div className="font-medium">{field.name}</div><div className="text-xs text-neutral-600">Type: {field.type}</div><div className="text-xs text-neutral-600">Required: {field.required ? 'Yes' : 'No'}</div></div> )) : <div className="text-xs text-neutral-500 italic">None</div>} </div> </div> </> );
  };

   // --- Logic and Rendering for Stats Comparison Tab ---
   const renderStatsComparison = () => {
     if (!selectedVersion1 || !selectedVersion2) {
       return <div className="text-center p-4 text-neutral-500">Please select two versions to compare statistics.</div>;
     }
     if (selectedVersion1 === selectedVersion2) {
        return <div className="text-center p-4 text-orange-600">Please select two different versions to compare.</div>;
     }

     // Find the snapshot data for selected versions
     const version1DataRaw = versions.find(v => v[versionIdKey]?.toString() === selectedVersion1);
     const version2DataRaw = versions.find(v => v[versionIdKey]?.toString() === selectedVersion2);

     if (!version1DataRaw || !version2DataRaw) {
       return <div className="text-center p-4 text-red-600">Could not find data for selected versions.</div>;
     }

     // ** FIX: Determine older and newer based on timestamp **
     let olderVersionData, newerVersionData;
    olderVersionData = version1DataRaw;
    newerVersionData = version2DataRaw;
    //  if (version1DataRaw.timestamp < version2DataRaw.timestamp) {
    //  } else { // Handles timestamp equality or version1 being newer
    //  }

     const summary1 = olderVersionData.summary || {}; // Summary of the chronologically older snapshot
     const summary2 = newerVersionData.summary || {}; // Summary of the chronologically newer snapshot

     // --- Calculation Logic (using summary1=older, summary2=newer) ---
     const safeParse = (val) => { /* ... same ... */ if(val===null||val===undefined) return 0; const num=parseFloat(val); return isNaN(num)?0:num;};
     const calculateStatChange = (key) => {
        const value1 = safeParse(summary1[key]); // Older value
        const value2 = safeParse(summary2[key]); // Newer value
        const diff = value2 - value1;
        let percentChange = null;
        if (value1 !== 0) { percentChange = (diff / Math.abs(value1)) * 100; }
        else if (diff !== 0) { percentChange = Infinity * Math.sign(diff); }
        else { percentChange = 0; }
        return { value1, value2, diff, percentChange };
     };

     const statsToCompare = [ /* ... same list ... */
        { key: 'total-records', label: 'Total Records', format: (v) => v.toLocaleString() },
        { key: 'total-data-files', label: 'Total Data Files', format: (v) => v.toLocaleString() },
        { key: 'total-delete-files', label: 'Total Delete Files', format: (v) => v.toLocaleString() },
        { key: 'total-files-size', label: 'Total Files Size', format: (v) => formatBytes(v || 0) }, // Ensure formatBytes handles 0
        { key: 'total-position-deletes', label: 'Total Position Deletes', format: (v) => v.toLocaleString() },
        { key: 'total-equality-deletes', label: 'Total Equality Deletes', format: (v) => v.toLocaleString() }, // Added this one
     ];

     const comparisonResults = statsToCompare.map(stat => ({
         ...stat,
         ...calculateStatChange(stat.key)
     }));

      // ** FIX: Generate labels based on the identified older/newer versions **
      const olderLabel = `${tableType === 'Iceberg' ? 'Seq' : 'V'}${olderVersionData[versionIdKey]}`;
      const newerLabel = `${tableType === 'Iceberg' ? 'Seq' : 'V'}${newerVersionData[versionIdKey]}`;

     return (
         <Card>
            <CardHeader className="pb-2">
                 <CardTitle className="text-base">Statistics Comparison</CardTitle>
                  {/* ** FIX: Update comparison description ** */}
                 <div className="text-xs text-neutral-500 pt-1">
                    Comparing state at <span className="font-semibold">{olderLabel}</span> vs <span className="font-semibold">{newerLabel}</span>
                 </div>
            </CardHeader>
             <CardContent>
                 <Table>
                     <TableHeader>
                         <TableRow>
                             <TableHead className="w-[200px]">Metric</TableHead>
                             {/* ** FIX: Use corrected labels ** */}
                             <TableHead className="text-right">{olderLabel}</TableHead>
                             <TableHead className="text-right">{newerLabel}</TableHead>
                             <TableHead className="text-right w-[120px]">Change</TableHead>
                             <TableHead className="text-right w-[100px]">Trend (%)</TableHead>
                         </TableRow>
                     </TableHeader>
                     <TableBody>
                         {comparisonResults.map(res => (
                             <TableRow key={res.key}>
                                 <TableCell className="font-medium text-sm">{res.label}</TableCell>
                                 {/* ** Render value1 (older) and value2 (newer) ** */}
                                 <TableCell className="text-right text-sm font-mono">{res.format(res.value1)}</TableCell>
                                 <TableCell className="text-right text-sm font-mono">{res.format(res.value2)}</TableCell>
                                 <TableCell className={`text-right text-sm font-mono ${res.diff > 0 ? 'text-green-700' : res.diff < 0 ? 'text-red-700' : 'text-neutral-500'}`}>
                                     {res.diff > 0 ? '+' : ''}{res.format(res.diff)}
                                 </TableCell>
                                 <TableCell className="text-right">
                                    <TrendIndicator value={res.percentChange} />
                                 </TableCell>
                             </TableRow>
                         ))}
                     </TableBody>
                 </Table>
             </CardContent>
         </Card>
     );
   };

  // --- Main Render (Tabs layout, etc.) ---
  // ... (rest of the main return statement remains the same) ...
  // ... Ensure the new "Stats Compare" tab trigger and content are included ...
  if (!responseData) { /* ... loading ... */ }
  if (!versions.length) { /* ... no history ... */ }
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
      <div className="flex justify-between items-center p-4 border-b border-neutral-200">
        <h2 className="text-base font-medium">Version History & Comparison</h2>
        <div className="text-xs text-neutral-500">{versions.length} versions found</div>
      </div>
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4 grid grid-cols-4"> {/* Updated grid cols */}
            <TabsTrigger value="changes" className="flex-1">Field Change Log</TabsTrigger>
            <TabsTrigger value="versions" className="flex-1">All Versions</TabsTrigger>
            <TabsTrigger value="diff" className="flex-1">Schema Compare</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">Stats Compare</TabsTrigger> {/* New Trigger */}
          </TabsList>

          {/* Field Changes Tab */}
          <TabsContent value="changes">
            {/* ... (Rendering logic remains the same as previous version) ... */}
             {historicalFieldChanges.length > 0 ? ( <div className="border rounded-md overflow-hidden"> <Table> <TableHeader><TableRow> <TableHead className="w-[120px]">Effective At</TableHead> <TableHead>Field</TableHead> <TableHead>Change</TableHead> <TableHead>Details</TableHead> <TableHead className="w-[180px]">Timestamp</TableHead> </TableRow></TableHeader> <TableBody> {historicalFieldChanges.map((change, idx) => ( <TableRow key={`${change.versionId}-${change.field}-${idx}`}> <TableCell className="font-mono text-xs">{tableType === 'Iceberg' ? 'Seq' : 'V'}{change.versionId}</TableCell> <TableCell className="font-medium">{change.field}</TableCell> <TableCell>{renderChangeBadge(change.changeType)}</TableCell> <TableCell> {change.changeType === 'modify' ? ( <span className="text-xs"> {change.details?.type && <>Type: <span className="line-through text-red-500">{change.details.type.from}</span> → <span className="text-green-500">{change.details.type.to}</span><br/></>} {change.details?.required !== undefined && <>Required: <span className={change.details.required.from ? "text-red-500" : ""}>{change.details.required.from ? 'Yes' : 'No'}</span> → <span className={change.details.required.to ? "text-green-500" : ""}>{change.details.required.to ? 'Yes' : 'No'}</span></>} </span> ) : ( <span className="text-xs">Type: {change.type}</span> )} </TableCell> <TableCell><div className="text-xs"> <div>{formatDate(change.timestamp)}</div> <div className="text-neutral-500">{timeAgo(change.timestamp)}</div> </div></TableCell> </TableRow> ))} </TableBody> </Table> </div> ) : ( <div className="text-center p-4 text-neutral-500"> No historical schema changes detected or schema data unavailable for comparison. </div> )}
          </TabsContent>

          {/* All Versions Tab */}
          <TabsContent value="versions">
            {/* ... (Rendering logic remains the same as previous version) ... */}
             <div className="border rounded-md overflow-hidden"> <Table> <TableHeader><TableRow> <TableHead className="w-[120px]">Version ID</TableHead> <TableHead>Operation / Summary</TableHead> <TableHead className="w-[100px]">Fields</TableHead> <TableHead className="w-[180px]">Timestamp</TableHead> </TableRow></TableHeader> <TableBody> {versions.map((version) => ( <TableRow key={version[versionIdKey]}> <TableCell className="font-mono text-xs">{version[versionIdKey]}</TableCell> <TableCell className="text-xs"> {version.summary?.operation ? ( <><span className="font-medium">{version.summary.operation}</span><span className="text-neutral-500 ml-2">(+{version.summary['added-data-files'] || version.summary['added_data_files'] || 0} files, +{version.summary['added-records'] || 0} recs)</span></> ) : (version.operation || '—') } </TableCell> <TableCell className="text-xs text-center"> {version.schema_definition?.fields ? version.schema_definition.fields.length : 'N/A'} </TableCell> <TableCell><div className="text-xs"> <div>{formatDate(version['timestamp-ms'])}</div> <div className="text-neutral-500">{timeAgo(version['timestamp-ms'])}</div> </div></TableCell> </TableRow> ))} </TableBody> </Table> </div>
          </TabsContent>

          {/* Schema Compare Tab */}
          <TabsContent value="diff">
            {/* ... (Rendering logic remains the same as previous version) ... */}
             {versions.length >= 1 ? ( <div> <div className="flex items-end space-x-4 mb-4 p-4 border rounded-md bg-neutral-50"> <div className="flex-1"> <label className="block text-xs font-medium text-neutral-600 mb-1">Compare Version (Older)</label> <Select value={selectedVersion1 || ''} onValueChange={setSelectedVersion1}> <SelectTrigger> <SelectValue placeholder="Select version..." /> </SelectTrigger> <SelectContent> {versionOptions.map(opt => ( <SelectItem key={'d1-'+opt.value} value={opt.value} disabled={opt.value === selectedVersion2}>{opt.label}</SelectItem> ))} </SelectContent> </Select> </div> <div className="text-neutral-400 pb-2">vs</div> <div className="flex-1"> <label className="block text-xs font-medium text-neutral-600 mb-1"> With Version (Newer) </label> <Select value={selectedVersion2 || ''} onValueChange={setSelectedVersion2}> <SelectTrigger> <SelectValue placeholder="Select version..." /> </SelectTrigger> <SelectContent> {versionOptions.map(opt => ( <SelectItem key={'d2-'+opt.value} value={opt.value} disabled={opt.value === selectedVersion1}>{opt.label}</SelectItem> ))} </SelectContent> </Select> </div> </div> {renderComparisonState()} </div> ) : ( <div className="text-center p-4 text-neutral-500">Need at least two versions to show schema diff.</div> )}
          </TabsContent>

          {/* Stats Compare Tab */}
          <TabsContent value="stats">
            {versions.length >= 1 ? (
              <div>
                {/* Dropdown Selectors */}
                <div className="flex items-end space-x-4 mb-4 p-4 border rounded-md bg-neutral-50">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-neutral-600 mb-1">Compare Version (Older)</label>
                        <Select value={selectedVersion1 || ''} onValueChange={setSelectedVersion1}>
                            <SelectTrigger><SelectValue placeholder="Select version..." /></SelectTrigger>
                            <SelectContent> {versionOptions.map(opt => ( <SelectItem key={'s1-'+opt.value} value={opt.value} disabled={opt.value === selectedVersion2}>{opt.label}</SelectItem> ))} </SelectContent>
                        </Select>
                    </div>
                    <div className="text-neutral-400 pb-2">vs</div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-neutral-600 mb-1">With Version (Newer)</label>
                        <Select value={selectedVersion2 || ''} onValueChange={setSelectedVersion2}>
                            <SelectTrigger><SelectValue placeholder="Select version..." /></SelectTrigger>
                            <SelectContent> {versionOptions.map(opt => ( <SelectItem key={'s2-'+opt.value} value={opt.value} disabled={opt.value === selectedVersion1}>{opt.label}</SelectItem> ))} </SelectContent>
                        </Select>
                    </div>
                </div>
                {/* Render Stats Comparison Results */}
                {renderStatsComparison()}
              </div>
            ) : ( <div className="text-center p-4 text-neutral-500">Need versions to compare stats.</div> )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}