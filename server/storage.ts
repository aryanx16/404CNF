import { 
  users, type User, type InsertUser,
  dataSources, type DataSource, type InsertDataSource,
  recentTables, type RecentTable, type InsertRecentTable,
  type TableMetadata
} from "@shared/schema";

// Storage interface for database operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Data source methods
  getDataSources(userId?: number): Promise<DataSource[]>;
  getDataSource(id: number): Promise<DataSource | undefined>;
  createDataSource(source: InsertDataSource): Promise<DataSource>;
  deleteDataSource(id: number): Promise<void>;

  // Recent tables methods
  getRecentTables(userId?: number): Promise<RecentTable[]>;
  createOrUpdateRecentTable(table: InsertRecentTable): Promise<RecentTable>;
  
  // Metadata methods - in a real app, these would query actual data lake storage
  // For this demo, they return hardcoded data
  getTableMetadata(path: string, format?: string): Promise<TableMetadata | undefined>;
  getTableSchema(path: string, format?: string): Promise<TableMetadata | undefined>;
  getTablePartitions(path: string, format?: string): Promise<TableMetadata | undefined>;
  getTableVersions(path: string, format?: string): Promise<TableMetadata | undefined>;
  getTableProperties(path: string, format?: string): Promise<TableMetadata | undefined>;
  getTableSampleData(path: string, format?: string): Promise<TableMetadata | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private dataSources: Map<number, DataSource>;
  private recentTables: Map<number, RecentTable>;
  private currentUserId: number;
  private currentDataSourceId: number;
  private currentRecentTableId: number;

  constructor() {
    this.users = new Map();
    this.dataSources = new Map();
    this.recentTables = new Map();
    this.currentUserId = 1;
    this.currentDataSourceId = 1;
    this.currentRecentTableId = 1;

    // Add some initial data for demo
    this.createUser({ username: "demo", password: "password" });
    
    // Add demo data sources
    this.createDataSource({
      name: "analytics-bucket",
      path: "s3://analytics-bucket/",
      type: "s3",
      userId: 1,
      createdAt: new Date().toISOString()
    });
    
    // this.createDataSource({
    //   name: "data-warehouse",
    //   path: "s3://data-warehouse/",
    //   type: "s3",
    //   userId: 1,
    //   createdAt: new Date().toISOString()
    // });
    
    // this.createDataSource({
    //   name: "ml-datasets",
    //   path: "s3://ml-datasets/",
    //   type: "s3",
    //   userId: 1,
    //   createdAt: new Date().toISOString()
    // });
    
    // Add demo recent tables
    this.createOrUpdateRecentTable({
      name: "customer_profiles",
      path: "s3://analytics-bucket/customer_data/",
      format: "iceberg",
      userId: 1,
      metadata: {},
      lastViewed: new Date().toISOString()
    });
    
    this.createOrUpdateRecentTable({
      name: "transactions",
      path: "s3://analytics-bucket/transactions/",
      format: "delta",
      userId: 1,
      metadata: {},
      lastViewed: new Date().toISOString()
    });
    
    this.createOrUpdateRecentTable({
      name: "orders_incremental",
      path: "s3://data-warehouse/orders/",
      format: "hudi",
      userId: 1,
      metadata: {},
      lastViewed: new Date().toISOString()
    });
    
    this.createOrUpdateRecentTable({
      name: "product_catalog",
      path: "s3://analytics-bucket/products/",
      format: "parquet",
      userId: 1,
      metadata: {},
      lastViewed: new Date().toISOString()
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Data source methods
  async getDataSources(userId?: number): Promise<DataSource[]> {
    const sources = Array.from(this.dataSources.values());
    if (userId) {
      return sources.filter(source => source.userId === userId);
    }
    return sources;
  }

  async getDataSource(id: number): Promise<DataSource | undefined> {
    return this.dataSources.get(id);
  }

  async createDataSource(source: InsertDataSource): Promise<DataSource> {
    const id = this.currentDataSourceId++;
    const createdAt = source.createdAt || new Date().toISOString();
    const dataSource: DataSource = { ...source, id, createdAt };
    this.dataSources.set(id, dataSource);
    return dataSource;
  }

  async deleteDataSource(id: number): Promise<void> {
    this.dataSources.delete(id);
  }

  // Recent tables methods
  async getRecentTables(userId?: number): Promise<RecentTable[]> {
    const tables = Array.from(this.recentTables.values());
    
    if (userId) {
      return tables
        .filter(table => table.userId === userId)
        .sort((a, b) => new Date(b.lastViewed).getTime() - new Date(a.lastViewed).getTime());
    }
    
    return tables.sort((a, b) => new Date(b.lastViewed).getTime() - new Date(a.lastViewed).getTime());
  }

  async createOrUpdateRecentTable(table: InsertRecentTable): Promise<RecentTable> {
    // Check if this table already exists
    const existing = Array.from(this.recentTables.values()).find(
      t => t.path === table.path && t.userId === table.userId
    );
    
    if (existing) {
      // Update existing entry
      const updatedTable: RecentTable = {
        ...existing,
        lastViewed: new Date().toISOString(),
        ...table
      };
      this.recentTables.set(existing.id, updatedTable);
      return updatedTable;
    } else {
      // Create new entry
      const id = this.currentRecentTableId++;
      const lastViewed = table.lastViewed || new Date().toISOString();
      const recentTable: RecentTable = { ...table, id, lastViewed };
      this.recentTables.set(id, recentTable);
      return recentTable;
    }
  }

  // These methods would typically call out to real data lake storage systems
  // For the demo, they're implemented to return sample data from the sampleData.ts file
  async getTableMetadata(path: string, format?: string): Promise<TableMetadata | undefined> {
    // This will be implemented to return demo data from the metadata module
    return (await import('./metadata/sampleData.ts')).getTableMetadata(path, format);
  }

  async getTableSchema(path: string, format?: string): Promise<TableMetadata | undefined> {
    // Return only the schema portion of the metadata
    const metadata = await this.getTableMetadata(path, format);
    return metadata;
  }

  async getTablePartitions(path: string, format?: string): Promise<TableMetadata | undefined> {
    // Return only the partitions portion of the metadata
    const metadata = await this.getTableMetadata(path, format);
    return metadata;
  }

  async getTableVersions(path: string, format?: string): Promise<TableMetadata | undefined> {
    // Return only the versions portion of the metadata
    const metadata = await this.getTableMetadata(path, format);
    return metadata;
  }

  async getTableProperties(path: string, format?: string): Promise<TableMetadata | undefined> {
    // Return only the properties portion of the metadata
    const metadata = await this.getTableMetadata(path, format);
    return metadata;
  }

  async getTableSampleData(path: string, format?: string): Promise<TableMetadata | undefined> {
    // Return only the sample data portion of the metadata
    const metadata = await this.getTableMetadata(path, format);
    return metadata;
  }
}

// Create and export a singleton instance
export const storage = new MemStorage();
