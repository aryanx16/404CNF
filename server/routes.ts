import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getFormatParser, detectFormat } from "./metadata/formatParsers";
import { tableMetadata, tableSchema, tablePartition, tableVersion, tableProperties } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for metadata exploration
  
  // Get all data sources
  app.get("/api/datasources", async (req, res) => {
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const sources = await storage.getDataSources(userId);
    res.json(sources);
  });

  // Create a new data source
  app.post("/api/datasources", async (req, res) => {
    try {
      const source = await storage.createDataSource({
        ...req.body,
        createdAt: new Date().toISOString()
      });
      res.json(source);
    } catch (err) {
      res.status(400).json({ error: "Invalid data source" });
    }
  });

  // Delete a data source
  app.delete("/api/datasources/:id", async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteDataSource(id);
    res.json({ success: true });
  });

  // Get recent tables
  app.get("/api/recent-tables", async (req, res) => {
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const tables = await storage.getRecentTables(userId);
    res.json(tables);
  });

  // Main API endpoint to fetch table metadata
  app.get("/api/metadata", async (req, res) => {
    try {
      const path = req.query.path as string;
      
      if (!path) {
        return res.status(400).json({ error: "Path parameter is required" });
      }
      
      // Determine the format if not specified
      const format = req.query.format as string || await detectFormat(path);
      
      // Get the metadata from the storage service
      const metadata = await storage.getTableMetadata(path, format);
      
      if (!metadata) {
        return res.status(404).json({ error: "Table not found" });
      }
      
      // Update recent tables
      if (req.query.userId) {
        await storage.createOrUpdateRecentTable({
          name: metadata.name,
          path: metadata.location,
          format: metadata.format,
          userId: Number(req.query.userId),
          metadata: {},
          lastViewed: new Date().toISOString()
        });
      }
      
      // Validate the response against the schema
      const validatedMetadata = tableMetadata.parse(metadata);
      res.json(validatedMetadata);
    } catch (err) {
      console.error("Error fetching metadata:", err);
      res.status(500).json({ error: "Failed to fetch table metadata" });
    }
  });

  // Get table schema
  app.get("/api/schema", async (req, res) => {
    try {
      const path = req.query.path as string;
      
      if (!path) {
        return res.status(400).json({ error: "Path parameter is required" });
      }
      
      const format = req.query.format as string || await detectFormat(path);
      const parser = getFormatParser(format);
      const schema = await parser.getTableSchema(path);
      
      res.json(schema);
    } catch (err) {
      console.error("Error fetching schema:", err);
      res.status(500).json({ error: "Failed to fetch table schema" });
    }
  });

  // Get table partitions
  app.get("/api/partitions", async (req, res) => {
    try {
      const path = req.query.path as string;
      
      if (!path) {
        return res.status(400).json({ error: "Path parameter is required" });
      }
      
      const format = req.query.format as string || await detectFormat(path);
      const parser = getFormatParser(format);
      const partitions = await parser.getTablePartitions(path);
      
      res.json(partitions);
    } catch (err) {
      console.error("Error fetching partitions:", err);
      res.status(500).json({ error: "Failed to fetch table partitions" });
    }
  });

  // Get table versions
  app.get("/api/versions", async (req, res) => {
    try {
      const path = req.query.path as string;
      
      if (!path) {
        return res.status(400).json({ error: "Path parameter is required" });
      }
      
      const format = req.query.format as string || await detectFormat(path);
      const parser = getFormatParser(format);
      const versions = await parser.getTableVersions(path);
      
      res.json(versions);
    } catch (err) {
      console.error("Error fetching versions:", err);
      res.status(500).json({ error: "Failed to fetch table versions" });
    }
  });

  // Get table properties
  app.get("/api/properties", async (req, res) => {
    try {
      const path = req.query.path as string;
      
      if (!path) {
        return res.status(400).json({ error: "Path parameter is required" });
      }
      
      const format = req.query.format as string || await detectFormat(path);
      const parser = getFormatParser(format);
      const properties = await parser.getTableProperties(path);
      
      res.json(properties);
    } catch (err) {
      console.error("Error fetching properties:", err);
      res.status(500).json({ error: "Failed to fetch table properties" });
    }
  });

  // Get sample data
  app.get("/api/sample-data", async (req, res) => {
    try {
      const path = req.query.path as string;
      
      if (!path) {
        return res.status(400).json({ error: "Path parameter is required" });
      }
      
      const format = req.query.format as string || await detectFormat(path);
      const parser = getFormatParser(format);
      const sampleData = await parser.getSampleData(path);
      
      res.json(sampleData);
    } catch (err) {
      console.error("Error fetching sample data:", err);
      res.status(500).json({ error: "Failed to fetch sample data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
