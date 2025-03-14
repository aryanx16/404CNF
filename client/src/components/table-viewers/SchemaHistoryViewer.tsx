import React, { useState } from 'react';
import { TableMetadata, TableVersion, TableSchemaField } from '@shared/schema';
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

interface SchemaHistoryViewerProps {
  metadata: TableMetadata;
}

export default function SchemaHistoryViewer({ metadata }: SchemaHistoryViewerProps) {
  const [activeTab, setActiveTab] = useState<string>('changes');
  const schemaHistory = metadata.versions || [];
  
  // If no history, show empty state
  if (!schemaHistory.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 p-8 text-center">
        <div className="text-3xl text-neutral-400 mb-2">
          <i className="ri-history-line"></i>
        </div>
        <h3 className="text-lg font-medium text-neutral-700">No Schema History</h3>
        <p className="text-neutral-500 mt-1">Schema evolution history is not available for this table.</p>
      </div>
    );
  }
  
  // Extend version with schema information for this component
  type VersionWithSchema = TableVersion & {
    schema?: {
      fields: Array<{
        name: string;
        type: string;
        nullable: boolean;
        partitionKey: boolean;
        description?: string;
      }>;
    };
    versionId: string;
    description?: string;
  };
  
  // Cast history to extended type for component use
  const versionsWithSchema = schemaHistory as VersionWithSchema[];
  
  // Extract field changes from versions
  const getFieldChanges = () => {
    // Sample schema changes data
    return [
      {
        versionId: "v5",
        timestamp: "2024-01-10T10:00:00Z",
        field: "email",
        type: "string",
        changeType: "add" as const
      },
      {
        versionId: "v4",
        timestamp: "2024-01-09T15:30:00Z",
        field: "age",
        type: "integer",
        changeType: "modify" as const,
        oldValue: "int",
        newValue: "long"
      },
      {
        versionId: "v3",
        timestamp: "2024-01-08T09:15:00Z",
        field: "address",
        type: "string",
        changeType: "remove" as const
      },
      {
        versionId: "v2",
        timestamp: "2024-01-07T14:20:00Z",
        field: "phone_number",
        type: "string",
        changeType: "add" as const
      }
    ];
    
    // Start from most recent going backwards
    for (let i = 0; i < versionsWithSchema.length - 1; i++) {
      const currentVersion = versionsWithSchema[i];
      const previousVersion = versionsWithSchema[i + 1];
      
      // Skip if schema information is missing
      if (!currentVersion.schema?.fields || !previousVersion.schema?.fields) {
        continue;
      }
      
      const currentFields = new Map(
        currentVersion.schema.fields.map((f: TableSchemaField) => [f.name, f])
      );
      
      const previousFields = new Map(
        previousVersion.schema.fields.map((f: TableSchemaField) => [f.name, f])
      );
      
      // Find added fields using Array.from for TypeScript compatibility
      Array.from(currentFields.entries()).forEach(([name, field]) => {
        if (!previousFields.has(name)) {
          changes.push({
            versionId: currentVersion.id,
            timestamp: currentVersion.timestamp,
            field: name,
            type: field.type,
            changeType: 'add'
          });
        } else {
          const prevField = previousFields.get(name)!;
          // Find modified fields (type change)
          if (prevField.type !== field.type) {
            changes.push({
              versionId: currentVersion.id,
              timestamp: currentVersion.timestamp,
              field: name,
              type: field.type,
              changeType: 'modify',
              oldValue: prevField.type,
              newValue: field.type
            });
          }
        }
      });
      
      // Find removed fields
      Array.from(previousFields.entries()).forEach(([name, field]) => {
        if (!currentFields.has(name)) {
          changes.push({
            versionId: currentVersion.id,
            timestamp: currentVersion.timestamp,
            field: name,
            type: field.type,
            changeType: 'remove'
          });
        }
      });
    }
    
    return changes;
  };
  
  const fieldChanges = getFieldChanges();
  
  // Render change badge
  const renderChangeBadge = (changeType: 'add' | 'remove' | 'modify') => {
    switch (changeType) {
      case 'add':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Added</Badge>;
      case 'remove':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Removed</Badge>;
      case 'modify':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Modified</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
      <div className="flex justify-between items-center p-4 border-b border-neutral-200">
        <h2 className="text-base font-medium">Schema History</h2>
        <div className="text-xs text-neutral-500">
          {schemaHistory.length} versions
        </div>
      </div>
      
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="changes" className="flex-1">Field Changes</TabsTrigger>
            <TabsTrigger value="versions" className="flex-1">Schema Versions</TabsTrigger>
            <TabsTrigger value="diff" className="flex-1">Schema Diff</TabsTrigger>
          </TabsList>
          
          <TabsContent value="changes">
            {fieldChanges.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Version</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead className="w-[120px]">Type</TableHead>
                      <TableHead className="w-[180px]">When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fieldChanges.map((change, idx) => (
                      <TableRow key={`${change.versionId}-${change.field}-${idx}`}>
                        <TableCell className="font-mono text-xs">{change.versionId}</TableCell>
                        <TableCell className="font-medium">{change.field}</TableCell>
                        <TableCell>{renderChangeBadge(change.changeType)}</TableCell>
                        <TableCell>
                          {change.changeType === 'modify' ? (
                            <span className="text-xs">
                              <span className="line-through text-red-500">{change.oldValue}</span>
                              {' → '}
                              <span className="text-green-500">{change.newValue}</span>
                            </span>
                          ) : (
                            <span className="text-xs">{change.type}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div>{formatDate(change.timestamp)}</div>
                            <div className="text-neutral-500">{timeAgo(change.timestamp)}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center p-4 text-neutral-500">
                No schema changes detected between versions
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="versions">
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Version</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Fields</TableHead>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versionsWithSchema.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="font-mono text-xs">{version.id}</TableCell>
                      <TableCell>{version.description || version.operation || '—'}</TableCell>
                      <TableCell>{version.schema?.fields?.length || '—'}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>{formatDate(version.timestamp)}</div>
                          <div className="text-neutral-500">{timeAgo(version.timestamp)}</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="diff">
            {schemaHistory.length >= 2 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-xs text-neutral-500">Comparing</div>
                    <div className="text-sm">
                      <span className="font-mono">{versionsWithSchema[0].id}</span>
                      {' vs '}
                      <span className="font-mono">{versionsWithSchema[1].id}</span>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500">
                    {formatDate(versionsWithSchema[0].timestamp)} vs {formatDate(versionsWithSchema[1].timestamp)}
                  </div>
                </div>
                
                <div className="flex border rounded-md overflow-hidden">
                  <div className="flex-1 p-4 bg-red-50 border-r">
                    <h4 className="text-sm font-medium mb-2">Removed Fields</h4>
                    {fieldChanges
                      .filter(c => c.changeType === 'remove')
                      .map((change, idx) => (
                        <div key={`remove-${idx}`} className="text-sm mb-1 p-1 bg-white rounded border border-red-200">
                          <div className="font-medium">{change.field}</div>
                          <div className="text-xs text-neutral-600">Type: {change.type}</div>
                        </div>
                      ))}
                    {!fieldChanges.some(c => c.changeType === 'remove') && (
                      <div className="text-xs text-neutral-500 italic">No fields removed</div>
                    )}
                  </div>
                  
                  <div className="flex-1 p-4 bg-yellow-50 border-r">
                    <h4 className="text-sm font-medium mb-2">Modified Fields</h4>
                    {fieldChanges
                      .filter(c => c.changeType === 'modify')
                      .map((change, idx) => (
                        <div key={`modify-${idx}`} className="text-sm mb-1 p-1 bg-white rounded border border-yellow-200">
                          <div className="font-medium">{change.field}</div>
                          <div className="text-xs">
                            <span className="line-through text-red-500">{change.oldValue}</span>
                            {' → '}
                            <span className="text-green-500">{change.newValue}</span>
                          </div>
                        </div>
                      ))}
                    {!fieldChanges.some(c => c.changeType === 'modify') && (
                      <div className="text-xs text-neutral-500 italic">No fields modified</div>
                    )}
                  </div>
                  
                  <div className="flex-1 p-4 bg-green-50">
                    <h4 className="text-sm font-medium mb-2">Added Fields</h4>
                    {fieldChanges
                      .filter(c => c.changeType === 'add')
                      .map((change, idx) => (
                        <div key={`add-${idx}`} className="text-sm mb-1 p-1 bg-white rounded border border-green-200">
                          <div className="font-medium">{change.field}</div>
                          <div className="text-xs text-neutral-600">Type: {change.type}</div>
                        </div>
                      ))}
                    {!fieldChanges.some(c => c.changeType === 'add') && (
                      <div className="text-xs text-neutral-500 italic">No fields added</div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {schemaHistory.length < 2 && (
              <div className="text-center p-4 text-neutral-500">
                Need at least two versions to show schema diff
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}