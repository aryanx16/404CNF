import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { formatDate, timeAgo } from '@/lib/formatUtils';
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
import { AlertCircle, Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

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


export default function SchemaHistoryViewer({ responseData }) {
  const [activeTab, setActiveTab] = useState('changes'); // Default to changes tab
  const [selectedVersion1, setSelectedVersion1] = useState(null);
  const [selectedVersion2, setSelectedVersion2] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState(null);

  const tableType = responseData?.table_type;
  const s3Url = responseData?.location;
  // Reverse history so newest is first (index 0)
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
      timestamp: v['timestamp-ms']
    }));
  }, [versions, versionIdKey, tableType]);

  // --- Fetch logic for "Compare Schemas" tab ---
  const fetchSchemaComparison = async (v1, v2) => {
    // ... (fetch logic remains the same as previous version) ...
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
      const message = error.response?.data?.error || error.message || 'Failed to fetch schema comparison';
      setComparisonError(message);
    } finally {
      setComparisonLoading(false);
    }
  };

  // --- useEffect hooks for managing dropdowns and fetch ---
  useEffect(() => {
    // Set initial dropdown values only if options are available
    if (versionOptions.length >= 2 && !selectedVersion1 && !selectedVersion2) {
      const initialV1 = versionOptions[1].value; // Second newest
      const initialV2 = versionOptions[0].value; // Newest
      setSelectedVersion1(initialV1);
      setSelectedVersion2(initialV2);
      // Fetch is triggered by the next effect
    } else if (versionOptions.length === 1 && !selectedVersion1) {
      setSelectedVersion1(versionOptions[0].value);
      setSelectedVersion2(null);
    }
    // Don't add selectedVersion1/2 here to avoid loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionOptions]); // Depend only on options changing

  useEffect(() => {
    // Trigger fetch only when both are selected and valid
    if (selectedVersion1 && selectedVersion2) {
      fetchSchemaComparison(selectedVersion1, selectedVersion2);
    } else {
      // Clear comparison data if selection is incomplete
      setComparisonData(null);
      setComparisonError(null);
      setComparisonLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVersion1, selectedVersion2, s3Url, tableType]); // Include s3Url/tableType in case they change


  // --- Calculate historical field changes using embedded schemas ---
  const historicalFieldChanges = useMemo(() => {
    const changes = [];
    console.log("Calculating historical changes, versions available:", versions.length);
    // Iterate backwards through history (versions is newest first)
    // Compare versions[i] (newer) with versions[i+1] (older)
    for (let i = 0; i < versions.length - 1; i++) {
      const previousVersion = versions[i]; // Newer
      const currentVersion = versions[i + 1]; // Older

      const currentSchema = currentVersion?.schema_definition;
      const previousSchema = previousVersion?.schema_definition;

      // Log schemas being compared for debugging
      // console.log(`Comparing ${currentVersion[versionIdKey]} vs ${previousVersion[versionIdKey]}`, { currentSchema, previousSchema });

      // Skip if schemas are missing
      if (!currentSchema || !previousSchema) {
         console.warn(`Skipping comparison between version ${currentVersion[versionIdKey]} and ${previousVersion[versionIdKey]} due to missing schema definition.`);
         continue;
      }

      const diff = compareSchemaDefinitions(previousSchema, currentSchema); // older vs newer

      // Add 'added' fields to changes list
      diff.added.forEach(field => {
        changes.push({
          versionId: currentVersion[versionIdKey], // Change occurred in this version
          timestamp: currentVersion['timestamp-ms'],
          field: field.name,
          type: field.type,
          required: field.required,
          changeType: 'add',
        });
      });

      // Add 'removed' fields to changes list
      diff.removed.forEach(field => {
        changes.push({
          versionId: currentVersion[versionIdKey], // Change occurred in this version
          timestamp: currentVersion['timestamp-ms'],
          field: field.name,
          type: field.type, // Type when it was removed
          required: field.required,
          changeType: 'remove',
        });
      });

      // Add 'modified' fields to changes list
      diff.modified.forEach(mod => {
        changes.push({
          versionId: currentVersion[versionIdKey], // Change occurred in this version
          timestamp: currentVersion['timestamp-ms'],
          field: mod.name,
          type: mod.type, // The newer type
          required: mod.changes?.required?.to, // The newer required status
          changeType: 'modify',
          details: mod.changes // Contains { type: { from, to }, required: { from, to } } etc.
        });
      });
    }

    // Sort all collected changes by timestamp descending (newest first)
    changes.sort((a, b) => b.timestamp - a.timestamp);
    console.log("Calculated historical changes:", changes);
    return changes;
  }, [versions, versionIdKey]); // Recalculate if versions array changes


  const renderChangeBadge = (changeType) => {
     // ... (same function) ...
     switch (changeType) {
        case 'add': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Added</Badge>;
        case 'remove': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Removed</Badge>;
        case 'modify': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Modified</Badge>;
        default: return null;
      }
  };

   // Renders the comparison result for the "Compare Schemas" tab
  const renderComparisonState = () => {
    // ... (same as previous version, displays Added/Modified/Removed columns based on comparisonData) ...
    if (comparisonLoading) { return <div className="flex items-center justify-center text-neutral-500 py-10"><Loader2 className="mr-2 h-4 w-4 animate-spin" /><span>Loading comparison...</span></div>; }
    if (comparisonError) { return <div className="flex items-center justify-center text-red-600 py-10 px-4 bg-red-50 border border-red-200 rounded-md"><AlertCircle className="mr-2 h-5 w-5" /><span className="text-sm">Error: {comparisonError}</span></div>; }
    if (!comparisonData) { return <div className="text-center p-4 text-neutral-500">Select two different versions to compare.</div>; }
    const { added = [], removed = [], modified = [] } = comparisonData.schema_comparison || {};
    const v1Label = comparisonData?.version1?.label || `${tableType === 'Iceberg' ? 'Seq' : 'V'}${selectedVersion1}`;
    const v2Label = comparisonData?.version2?.label || `${tableType === 'Iceberg' ? 'Seq' : 'V'}${selectedVersion2}`;

     return (
        <>
        <div className="text-xs text-neutral-600 mb-3 text-center px-4">
            Showing differences between <span className="font-semibold">{v1Label}</span> and <span className="font-semibold">{v2Label}</span>.
        </div>
        <div className="flex border rounded-md overflow-hidden">
          <div className="flex-1 p-4 bg-red-50 border-r">
            <h4 className="text-sm font-medium mb-2">Removed Fields ({removed.length})</h4>
            {removed.length > 0 ? removed.map((field, idx) => ( <div key={`cremove-${idx}`} className="text-sm mb-1 p-2 bg-white rounded border border-red-200 shadow-sm"><div className="font-medium">{field.name}</div><div className="text-xs text-neutral-600">Type: {field.type}</div></div> )) : <div className="text-xs text-neutral-500 italic">None</div>}
          </div>
          <div className="flex-1 p-4 bg-yellow-50 border-r">
            <h4 className="text-sm font-medium mb-2">Modified Fields ({modified.length})</h4>
            {modified.length > 0 ? modified.map((mod, idx) => ( <div key={`cmodify-${idx}`} className="text-sm mb-1 p-2 bg-white rounded border border-yellow-200 shadow-sm"><div className="font-medium">{mod.name}</div> {mod.changes?.type && <div className="text-xs"> Type: <span className="line-through text-red-500">{mod.changes.type.from}</span> → <span className="text-green-500">{mod.changes.type.to}</span> </div>} {mod.changes?.required !== undefined && <div className="text-xs"> Required: <span className={mod.changes.required.from ? "text-red-500" : ""}>{mod.changes.required.from ? 'Yes' : 'No'}</span> → <span className={mod.changes.required.to ? "text-green-500" : ""}>{mod.changes.required.to ? 'Yes' : 'No'}</span> </div>} </div> )) : <div className="text-xs text-neutral-500 italic">None</div>}
          </div>
          <div className="flex-1 p-4 bg-green-50">
            <h4 className="text-sm font-medium mb-2">Added Fields ({added.length})</h4>
            {added.length > 0 ? added.map((field, idx) => ( <div key={`cadd-${idx}`} className="text-sm mb-1 p-2 bg-white rounded border border-green-200 shadow-sm"><div className="font-medium">{field.name}</div><div className="text-xs text-neutral-600">Type: {field.type}</div><div className="text-xs text-neutral-600">Required: {field.required ? 'Yes' : 'No'}</div></div> )) : <div className="text-xs text-neutral-500 italic">None</div>}
          </div>
        </div>
        </>
     );
  };

  // --- Main Render ---
   if (!responseData) { // Handle initial loading of parent data
     return (
         <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 text-neutral-400 animate-spin mb-2" />
            <h3 className="text-lg font-medium text-neutral-700">Loading History...</h3>
          </div>
       );
   }

  if (!versions.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
        <div className="text-3xl text-neutral-400 mb-2"><i className="ri-folder-history-line"></i></div>
        <h3 className="text-lg font-medium text-neutral-700">No Version History Found</h3>
        <p className="text-neutral-500 mt-1">Cannot display schema history as no versions were found in the table metadata.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
      <div className="flex justify-between items-center p-4 border-b border-neutral-200">
        <h2 className="text-base font-medium">Schema History</h2>
        <div className="text-xs text-neutral-500">
          {versions.length} versions found
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4 grid grid-cols-3">
            <TabsTrigger value="changes" className="flex-1">Field Change Log</TabsTrigger>
            <TabsTrigger value="versions" className="flex-1">All Versions List</TabsTrigger>
            <TabsTrigger value="diff" className="flex-1">Compare Schemas</TabsTrigger>
          </TabsList>

          {/* --- Field Changes Tab (Iterative History) --- */}
          <TabsContent value="changes">
             {/* Now uses actual historicalFieldChanges */}
             {historicalFieldChanges.length > 0 ? (
               <div className="border rounded-md overflow-hidden">
                 <Table>
                   <TableHeader><TableRow>
                     <TableHead className="w-[120px]">Effective At</TableHead>
                     <TableHead>Field</TableHead>
                     <TableHead>Change</TableHead>
                     <TableHead>Details</TableHead>
                     <TableHead className="w-[180px]">Timestamp</TableHead>
                   </TableRow></TableHeader>
                   <TableBody>
                     {historicalFieldChanges.map((change, idx) => (
                       <TableRow key={`${change.versionId}-${change.field}-${idx}`}>
                         <TableCell className="font-mono text-xs">{tableType === 'Iceberg' ? 'Seq' : 'V'}{change.versionId}</TableCell>
                         <TableCell className="font-medium">{change.field}</TableCell>
                         <TableCell>{renderChangeBadge(change.changeType)}</TableCell>
                         <TableCell>
                           {change.changeType === 'modify' ? (
                             <span className="text-xs">
                               {change.details?.type && <>Type: <span className="line-through text-red-500">{change.details.type.from}</span> → <span className="text-green-500">{change.details.type.to}</span><br/></>}
                               {change.details?.required !== undefined && <>Required: <span className={change.details.required.from ? "text-red-500" : ""}>{change.details.required.from ? 'Yes' : 'No'}</span> → <span className={change.details.required.to ? "text-green-500" : ""}>{change.details.required.to ? 'Yes' : 'No'}</span></>}
                             </span>
                           ) : (
                             <span className="text-xs">Type: {change.type}</span>
                           )}
                         </TableCell>
                         <TableCell><div className="text-xs">
                           <div>{formatDate(change.timestamp)}</div>
                           <div className="text-neutral-500">{timeAgo(change.timestamp)}</div>
                         </div></TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
             ) : (
               <div className="text-center p-4 text-neutral-500">
                 No historical schema changes detected or schema data unavailable for comparison.
               </div>
             )}
           </TabsContent>


          {/* --- Schema Versions Tab (List) --- */}
          <TabsContent value="versions">
             {/* ... (same as before) ... */}
             <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-[120px]">Version ID</TableHead>
                  <TableHead>Operation / Summary</TableHead>
                  {/* Add schema field count here */}
                  <TableHead className="w-[100px]">Fields</TableHead>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version[versionIdKey]}>
                      <TableCell className="font-mono text-xs">{version[versionIdKey]}</TableCell>
                      <TableCell className="text-xs"> {/* Operation Summary */}
                        {version.summary?.operation ? ( <><span className="font-medium">{version.summary.operation}</span><span className="text-neutral-500 ml-2">(+{version.summary['added-data-files'] || version.summary['added_data_files'] || 0} files, +{version.summary['added-records'] || 0} recs)</span></> ) : (version.operation || '—') }
                      </TableCell>
                      {/* Display field count from embedded schema */}
                      <TableCell className="text-xs text-center">
                        {version.schema_definition?.fields ? version.schema_definition.fields.length : 'N/A'}
                      </TableCell>
                      <TableCell><div className="text-xs"> {/* Timestamp */}
                        <div>{formatDate(version['timestamp-ms'])}</div>
                        <div className="text-neutral-500">{timeAgo(version['timestamp-ms'])}</div>
                      </div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* --- Schema Diff Tab (Comparison) --- */}
          <TabsContent value="diff">
             {/* ... (same as before) ... */}
              {versions.length >= 1 ? (
              <div>
                <div className="flex items-end space-x-4 mb-4 p-4 border rounded-md bg-neutral-50">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-neutral-600 mb-1">Compare Version (Older)</label>
                        <Select value={selectedVersion1 || ''} onValueChange={setSelectedVersion1}>
                           <SelectTrigger> <SelectValue placeholder="Select version..." /> </SelectTrigger>
                           <SelectContent>
                              {versionOptions.map(opt => ( <SelectItem key={'d1-'+opt.value} value={opt.value} disabled={opt.value === selectedVersion2}>{opt.label}</SelectItem> ))}
                           </SelectContent>
                        </Select>
                    </div>
                     <div className="text-neutral-400 pb-2">vs</div>
                    <div className="flex-1">
                       <label className="block text-xs font-medium text-neutral-600 mb-1"> With Version (Newer) </label>
                       <Select value={selectedVersion2 || ''} onValueChange={setSelectedVersion2}>
                           <SelectTrigger> <SelectValue placeholder="Select version..." /> </SelectTrigger>
                           <SelectContent>
                              {versionOptions.map(opt => ( <SelectItem key={'d2-'+opt.value} value={opt.value} disabled={opt.value === selectedVersion1}>{opt.label}</SelectItem> ))}
                           </SelectContent>
                        </Select>
                    </div>
                 </div>
                {renderComparisonState()}
              </div>
            ) : ( <div className="text-center p-4 text-neutral-500">Need at least two versions to show schema diff.</div> )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}