import type { TableMetadata, TableSchemaField, TablePartition, TableVersion } from "@shared/schema";

// Helper to create a timestamp a certain number of days ago
const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

// Sample common schema fields across tables
const commonSchemaFields: TableSchemaField[] = [
  { name: "id", type: "string", nullable: false, partitionKey: false, description: "Unique identifier" },
  { name: "created_at", type: "timestamp", nullable: false, partitionKey: false, description: "Creation timestamp" },
  { name: "updated_at", type: "timestamp", nullable: true, partitionKey: false, description: "Last update timestamp" }
];

// Customer profiles schema (Iceberg)
const customerProfilesSchema: TableSchemaField[] = [
  { name: "customer_id", type: "string", nullable: false, partitionKey: false, description: "Unique customer identifier" },
  { name: "name", type: "string", nullable: false, partitionKey: false, description: "Customer full name" },
  { name: "email", type: "string", nullable: true, partitionKey: false, description: "Contact email address" },
  { name: "signup_date", type: "date", nullable: false, partitionKey: true, description: "Date when customer signed up" },
  { name: "region", type: "string", nullable: false, partitionKey: true, description: "Geographic region code" },
  { name: "last_activity", type: "timestamp", nullable: true, partitionKey: false, description: "Time of last customer activity" },
  { name: "total_orders", type: "integer", nullable: false, partitionKey: false, description: "Count of all orders placed" }
];

// Transactions schema (Delta)
const transactionsSchema: TableSchemaField[] = [
  { name: "transaction_id", type: "string", nullable: false, partitionKey: false, description: "Unique transaction ID" },
  { name: "customer_id", type: "string", nullable: false, partitionKey: false, description: "Customer who made the transaction" },
  { name: "amount", type: "decimal", nullable: false, partitionKey: false, description: "Transaction amount" },
  { name: "currency", type: "string", nullable: false, partitionKey: false, description: "Currency code" },
  { name: "transaction_date", type: "date", nullable: false, partitionKey: true, description: "Date of transaction" },
  { name: "transaction_time", type: "timestamp", nullable: false, partitionKey: false, description: "Exact timestamp" },
  { name: "status", type: "string", nullable: false, partitionKey: false, description: "Transaction status" },
  { name: "payment_method", type: "string", nullable: false, partitionKey: false, description: "Method of payment" }
];

// Orders schema (Hudi)
const ordersSchema: TableSchemaField[] = [
  { name: "order_id", type: "string", nullable: false, partitionKey: false, description: "Unique order identifier" },
  { name: "customer_id", type: "string", nullable: false, partitionKey: false, description: "Customer who placed the order" },
  { name: "order_date", type: "date", nullable: false, partitionKey: true, description: "Date when order was placed" },
  { name: "status", type: "string", nullable: false, partitionKey: false, description: "Order status" },
  { name: "total_amount", type: "decimal", nullable: false, partitionKey: false, description: "Total order amount" },
  { name: "items", type: "array<struct>", nullable: false, partitionKey: false, description: "Items in the order" },
  { name: "shipping_address", type: "struct", nullable: false, partitionKey: false, description: "Shipping address details" },
  { name: "region", type: "string", nullable: false, partitionKey: true, description: "Geographic region" }
];

// Products schema (Parquet)
const productsSchema: TableSchemaField[] = [
  { name: "product_id", type: "string", nullable: false, partitionKey: false, description: "Unique product identifier" },
  { name: "name", type: "string", nullable: false, partitionKey: false, description: "Product name" },
  { name: "description", type: "string", nullable: true, partitionKey: false, description: "Product description" },
  { name: "category", type: "string", nullable: false, partitionKey: true, description: "Product category" },
  { name: "price", type: "decimal", nullable: false, partitionKey: false, description: "Current price" },
  { name: "stock_quantity", type: "integer", nullable: false, partitionKey: false, description: "Available inventory" },
  { name: "attributes", type: "map<string,string>", nullable: true, partitionKey: false, description: "Product attributes" }
];

// Sample customer_profiles partitions
const customerProfilesPartitions: TablePartition[] = [
  {
    name: "signup_date",
    value: "2023-08",
    size: 1400000000, // 1.4 GB
    fileCount: 42,
    rowCount: 8300000,
    children: []
  },
  {
    name: "signup_date",
    value: "2023-07",
    size: 3900000000, // 3.9 GB
    fileCount: 35,
    rowCount: 12200000,
    children: [
      {
        name: "region",
        value: "NA",
        size: 1800000000, // 1.8 GB
        fileCount: 12,
        rowCount: 5800000
      },
      {
        name: "region",
        value: "EU",
        size: 1100000000, // 1.1 GB
        fileCount: 9,
        rowCount: 3300000
      },
      {
        name: "region",
        value: "APAC",
        size: 720000000, // 720 MB
        fileCount: 8,
        rowCount: 2100000
      },
      {
        name: "region",
        value: "LATAM",
        size: 310000000, // 310 MB
        fileCount: 6,
        rowCount: 800000
      }
    ]
  },
  {
    name: "signup_date",
    value: "2023-06",
    size: 3600000000, // 3.6 GB
    fileCount: 38,
    rowCount: 11800000,
    children: []
  },
  {
    name: "signup_date",
    value: "2023-05",
    size: 3400000000, // 3.4 GB
    fileCount: 34,
    rowCount: 10900000,
    children: []
  },
  {
    name: "signup_date",
    value: "2023-04",
    size: 3100000000, // 3.1 GB
    fileCount: 31,
    rowCount: 9800000,
    children: []
  },
  {
    name: "signup_date",
    value: "2023-03",
    size: 3300000000, // 3.3 GB
    fileCount: 34,
    rowCount: 10300000,
    children: []
  }
];

// Sample transactions partitions
const transactionsPartitions: TablePartition[] = [
  {
    name: "transaction_date",
    value: "2023-08",
    size: 2100000000, // 2.1 GB
    fileCount: 31,
    rowCount: 15800000,
    children: []
  },
  {
    name: "transaction_date",
    value: "2023-07",
    size: 2300000000, // 2.3 GB
    fileCount: 30,
    rowCount: 16200000,
    children: []
  },
  {
    name: "transaction_date",
    value: "2023-06",
    size: 2200000000, // 2.2 GB
    fileCount: 29,
    rowCount: 15900000,
    children: []
  }
];

// Sample orders partitions
const ordersPartitions: TablePartition[] = [
  {
    name: "order_date",
    value: "2023-08",
    size: 1200000000, // 1.2 GB
    fileCount: 24,
    rowCount: 5200000,
    children: [
      {
        name: "region",
        value: "NA",
        size: 480000000, // 480 MB
        fileCount: 8,
        rowCount: 2100000
      },
      {
        name: "region",
        value: "EU",
        size: 390000000, // 390 MB
        fileCount: 7,
        rowCount: 1700000
      },
      {
        name: "region",
        value: "APAC",
        size: 230000000, // 230 MB
        fileCount: 6,
        rowCount: 980000
      },
      {
        name: "region",
        value: "LATAM",
        size: 120000000, // 120 MB
        fileCount: 3,
        rowCount: 420000
      }
    ]
  },
  {
    name: "order_date",
    value: "2023-07",
    size: 1300000000, // 1.3 GB
    fileCount: 26,
    rowCount: 5800000,
    children: []
  },
  {
    name: "order_date",
    value: "2023-06",
    size: 1230000000, // 1.25 GB
    fileCount: 25,
    rowCount: 5600000,
    children: []
  }
];

// Sample products partitions
const productsPartitions: TablePartition[] = [
  {
    name: "category",
    value: "electronics",
    size: 320000000, // 320 MB
    fileCount: 8,
    rowCount: 180000,
    children: []
  },
  {
    name: "category",
    value: "clothing",
    size: 280000000, // 280 MB
    fileCount: 7,
    rowCount: 330000,
    children: []
  },
  {
    name: "category",
    value: "home",
    size: 210000000, // 210 MB
    fileCount: 5,
    rowCount: 240000,
    children: []
  },
  {
    name: "category",
    value: "books",
    size: 190000000, // 190 MB
    fileCount: 4,
    rowCount: 420000,
    children: []
  }
];

// Sample customer_profiles versions
const customerProfilesVersions: TableVersion[] = [
  {
    id: "24",
    timestamp: daysAgo(0),
    operation: "append",
    changes: { rowsAdded: 1200000, schemaChanged: true },
    isLatest: true
  },
  {
    id: "23",
    timestamp: daysAgo(5),
    operation: "delete",
    changes: { rowsDeleted: 52000 }
  },
  {
    id: "22",
    timestamp: daysAgo(7),
    operation: "schema",
    changes: { fieldsAdded: ["last_activity"] }
  },
  {
    id: "21",
    timestamp: daysAgo(12),
    operation: "append",
    changes: { rowsAdded: 1300000 }
  }
];

// Sample transactions versions
const transactionsVersions: TableVersion[] = [
  {
    id: "18",
    timestamp: daysAgo(1),
    operation: "append",
    changes: { rowsAdded: 900000 },
    isLatest: true
  },
  {
    id: "17",
    timestamp: daysAgo(3),
    operation: "vacuum",
    changes: { filesMerged: 12 }
  },
  {
    id: "16",
    timestamp: daysAgo(8),
    operation: "append",
    changes: { rowsAdded: 830000 }
  }
];

// Sample orders versions
const ordersVersions: TableVersion[] = [
  {
    id: "32",
    timestamp: daysAgo(0),
    operation: "upsert",
    changes: { rowsUpdated: 420000, rowsInserted: 380000 },
    isLatest: true
  },
  {
    id: "31",
    timestamp: daysAgo(4),
    operation: "upsert",
    changes: { rowsUpdated: 380000, rowsInserted: 330000 }
  },
  {
    id: "30",
    timestamp: daysAgo(9),
    operation: "schema",
    changes: { fieldsModified: ["shipping_address"] }
  }
];

// Sample products versions
const productsVersions: TableVersion[] = [
  {
    id: "12",
    timestamp: daysAgo(2),
    operation: "append",
    changes: { rowsAdded: 13000 },
    isLatest: true
  },
  {
    id: "11",
    timestamp: daysAgo(7),
    operation: "delete",
    changes: { rowsDeleted: 2000 }
  },
  {
    id: "10",
    timestamp: daysAgo(14),
    operation: "append",
    changes: { rowsAdded: 18000 }
  }
];

// Sample data for each table
const customerProfilesSampleData = [
  { 
    customer_id: "C1001", 
    name: "John Smith", 
    email: "john.smith@example.com", 
    signup_date: "2023-07-15", 
    region: "NA", 
    last_activity: "2023-08-14T14:32:16Z", 
    total_orders: 12 
  },
  { 
    customer_id: "C1002", 
    name: "Emma Johnson", 
    email: "emma.j@example.com", 
    signup_date: "2023-07-17", 
    region: "EU", 
    last_activity: "2023-08-13T08:45:21Z", 
    total_orders: 8 
  },
  { 
    customer_id: "C1003", 
    name: "Liu Wei", 
    email: "liu.wei@example.com", 
    signup_date: "2023-07-18", 
    region: "APAC", 
    last_activity: "2023-08-15T02:12:33Z", 
    total_orders: 5 
  }
];

const transactionsSampleData = [
  { 
    transaction_id: "T20001", 
    customer_id: "C1001", 
    amount: 125.99, 
    currency: "USD", 
    transaction_date: "2023-08-15", 
    transaction_time: "2023-08-15T14:22:31Z", 
    status: "completed", 
    payment_method: "credit_card" 
  },
  { 
    transaction_id: "T20002", 
    customer_id: "C1002", 
    amount: 89.50, 
    currency: "EUR", 
    transaction_date: "2023-08-14", 
    transaction_time: "2023-08-14T09:18:02Z", 
    status: "completed", 
    payment_method: "paypal" 
  },
  { 
    transaction_id: "T20003", 
    customer_id: "C1003", 
    amount: 250.00, 
    currency: "CNY", 
    transaction_date: "2023-08-15", 
    transaction_time: "2023-08-15T03:41:15Z", 
    status: "pending", 
    payment_method: "bank_transfer" 
  }
];

const ordersSampleData = [
  { 
    order_id: "O30001", 
    customer_id: "C1001", 
    order_date: "2023-08-15", 
    status: "shipped", 
    total_amount: 125.99,
    items: [
      { product_id: "P1", quantity: 2, price: 45.99 },
      { product_id: "P2", quantity: 1, price: 34.01 }
    ],
    shipping_address: {
      street: "123 Main St",
      city: "New York",
      zip: "10001",
      country: "USA"
    },
    region: "NA"
  },
  { 
    order_id: "O30002", 
    customer_id: "C1002", 
    order_date: "2023-08-14", 
    status: "delivered", 
    total_amount: 89.50,
    items: [
      { product_id: "P3", quantity: 1, price: 89.50 }
    ],
    shipping_address: {
      street: "15 Rue de Rivoli",
      city: "Paris",
      zip: "75001",
      country: "France"
    },
    region: "EU"
  }
];

const productsSampleData = [
  { 
    product_id: "P1", 
    name: "Wireless Headphones", 
    description: "Premium noise-cancelling wireless headphones", 
    category: "electronics", 
    price: 45.99, 
    stock_quantity: 120,
    attributes: {
      color: "black",
      brand: "SoundMaster",
      bluetooth_version: "5.2"
    }
  },
  { 
    product_id: "P2", 
    name: "USB-C Cable", 
    description: "Fast charging USB-C to USB-C cable, 2m length", 
    category: "electronics", 
    price: 34.01, 
    stock_quantity: 350,
    attributes: {
      color: "white",
      brand: "TechPlus",
      length: "2m"
    }
  },
  { 
    product_id: "P3", 
    name: "Cotton T-Shirt", 
    description: "100% organic cotton t-shirt", 
    category: "clothing", 
    price: 89.50, 
    stock_quantity: 89,
    attributes: {
      color: "blue",
      size: "M",
      material: "cotton"
    }
  }
];

// Create the table metadata objects
const tableMetadataMap: Record<string, TableMetadata> = {
  "s3://analytics-bucket/customer_data/": {
    name: "customer_profiles",
    format: "iceberg",
    location: "s3://analytics-bucket/customer_data/",
    lastModified: daysAgo(0),
    size: 4200000000, // 4.2 GB
    rowCount: 42700000,
    fileCount: 68,
    currentVersion: "24",
    schema: {
      fields: customerProfilesSchema,
      formatVersion: "2",
      lastModified: daysAgo(0)
    },
    partitions: customerProfilesPartitions,
    versions: customerProfilesVersions,
    properties: {
      format: "iceberg",
      formatVersion: "2",
      location: "s3://analytics-bucket/customer_data/",
      manifestFiles: [
        { path: "metadata/00123-4a5b-9c8d-5e7f.avro", size: 2100000 },
        { path: "metadata/00124-8e2f-7a6b-1c9d.avro", size: 1800000 },
        { path: "metadata/00125-3f5e-9d2c-7b1a.avro", size: 1900000 },
        { path: "metadata/00126-2d1e-8c7b-6a5f.avro", size: 2300000 }
      ],
      snapshotInfo: {
        id: "52896723015",
        manifestList: "s3://analytics-bucket/customer_data/metadata/snap-52896723015.avro",
        createdAt: daysAgo(0),
        totalDataFiles: 68,
        addedDataFiles: 5,
        removedDataFiles: 0,
        operation: "append"
      },
      formatConfig: {
        "format-version": 2,
        "table-uuid": "fb072c92-a02b-11e9-ae9c-1a2b3c4d5e6f",
        "location": "s3://analytics-bucket/customer_data/",
        "last-sequence-number": 24,
        "snapshot-log": [
          {"sequence-number": 24, "timestamp-ms": new Date(daysAgo(0)).getTime()},
          {"sequence-number": 23, "timestamp-ms": new Date(daysAgo(5)).getTime()},
          {"sequence-number": 22, "timestamp-ms": new Date(daysAgo(7)).getTime()}
        ]
      },
      metrics: {
        totalManifestFiles: 24,
        metadataSize: 48000000, // 48 MB
        avgRecordsPerFile: 628000,
        avgRecordSize: 98
      }
    },
    sampleData: customerProfilesSampleData
  },
  "s3://analytics-bucket/transactions/": {
    name: "transactions",
    format: "delta",
    location: "s3://analytics-bucket/transactions/",
    lastModified: daysAgo(1),
    size: 6600000000, // 6.6 GB
    rowCount: 47900000,
    fileCount: 90,
    currentVersion: "18",
    schema: {
      fields: transactionsSchema,
      formatVersion: "3",
      lastModified: daysAgo(1)
    },
    partitions: transactionsPartitions,
    versions: transactionsVersions,
    properties: {
      format: "delta",
      formatVersion: "3",
      location: "s3://analytics-bucket/transactions/",
      manifestFiles: [
        { path: "_delta_log/00000000000000000018.json", size: 1300000 },
        { path: "_delta_log/00000000000000000017.json", size: 1400000 },
        { path: "_delta_log/00000000000000000016.json", size: 1600000 }
      ],
      snapshotInfo: {
        version: "18",
        timestampMs: new Date(daysAgo(1)).getTime(),
        operation: "WRITE",
        operationParameters: { mode: "Append" },
        numFiles: 90,
        numAddedFiles: 3,
        numRemovedFiles: 0
      },
      formatConfig: {
        "delta.minReaderVersion": 1,
        "delta.minWriterVersion": 2,
        "delta.columnMapping.mode": "name",
        "delta.checkpointInterval": 10,
        "delta.autoOptimize.autoCompact": "true",
        "delta.dataSkippingNumIndexedCols": 3
      },
      metrics: {
        numTransactions: 18,
        numFiles: 90,
        sizeInBytes: 6600000000,
        numRecords: 47900000,
        numMetadataBytes: 33000000
      }
    },
    sampleData: transactionsSampleData
  },
  "s3://data-warehouse/orders/": {
    name: "orders_incremental",
    format: "hudi",
    location: "s3://data-warehouse/orders/",
    lastModified: daysAgo(0),
    size: 3730000000, // 3.75 GB
    rowCount: 16600000,
    fileCount: 75,
    currentVersion: "32",
    schema: {
      fields: ordersSchema,
      formatVersion: "0.12.1",
      lastModified: daysAgo(0)
    },
    partitions: ordersPartitions,
    versions: ordersVersions,
    properties: {
      format: "hudi",
      formatVersion: "0.12.1",
      location: "s3://data-warehouse/orders/",
      manifestFiles: [
        { path: ".hoodie/32.commit", size: 1200000 },
        { path: ".hoodie/31.commit", size: 1100000 },
        { path: ".hoodie/30.commit", size: 1300000 }
      ],
      snapshotInfo: {
        commitTime: daysAgo(0).split('T')[0].replace(/-/g, ''),
        commitType: "UPSERT",
        totalBytesWritten: 130000000,
        totalRecordsWritten: 800000,
        totalUpdateRecordsWritten: 420000,
        totalInsertRecordsWritten: 380000
      },
      formatConfig: {
        "hoodie.table.name": "orders_incremental",
        "hoodie.table.type": "MERGE_ON_READ",
        "hoodie.table.version": "0.12.1",
        "hoodie.archivelog.folder": "archived",
        "hoodie.datasource.write.recordkey.field": "order_id",
        "hoodie.datasource.write.partitionpath.field": "order_date,region",
        "hoodie.compaction.payload.class": "org.apache.hudi.common.model.HoodieAvroPayload"
      },
      metrics: {
        commitsSinceLastCleaning: 5,
        numActiveBaseFiles: 62,
        numActiveRollbackFiles: 0,
        numActiveLogFiles: 13,
        totalRollbacks: 2,
        totalCompactions: 8,
        totalCommits: 32
      }
    },
    sampleData: ordersSampleData
  },
  "s3://analytics-bucket/products/": {
    name: "product_catalog",
    format: "parquet",
    location: "s3://analytics-bucket/products/",
    lastModified: daysAgo(2),
    size: 1000000000, // 1 GB
    rowCount: 1190000,
    fileCount: 24,
    schema: {
      fields: productsSchema,
      lastModified: daysAgo(2)
    },
    partitions: productsPartitions,
    versions: productsVersions,
    properties: {
      format: "parquet",
      location: "s3://analytics-bucket/products/",
      manifestFiles: [
        { path: "products_catalog_manifest.json", size: 1300000 }
      ],
      formatConfig: {
        "parquet.version": "2.4.0",
        "parquet.compression": "snappy",
        "parquet.row.group.size": 134217728,
        "parquet.page.size": 1048576,
        "parquet.dictionary.page.size": 1048576,
        "parquet.enable.dictionary": "true"
      },
      metrics: {
        numFiles: 24,
        sizeInBytes: 1000000000,
        numRecords: 1190000,
        avgRowSize: 840
      }
    },
    sampleData: productsSampleData
  }
};

// Default table if requested path is not found
const defaultPath = "s3://analytics-bucket/customer_data/";

// Function to get table metadata
export const getTableMetadata = (path: string, format?: string): TableMetadata => {
  // For demo purposes, just return the predefined metadata for the path
  // In a real implementation, this would parse actual files from the object store
  
  const metadata = tableMetadataMap[path];
  
  if (metadata) {
    // If format is specified and doesn't match, return default
    if (format && metadata.format !== format) {
      return tableMetadataMap[defaultPath];
    }
    return metadata;
  }
  
  // Return default table if path not found
  return tableMetadataMap[defaultPath];
};
