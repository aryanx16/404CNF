/**
 * Utility functions for handling and formatting metadata
 */

export type TableFormat = 'iceberg' | 'delta' | 'hudi' | 'parquet';

// Format bytes to human-readable string
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

// Format number with commas for thousands
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format large numbers in a readable way (e.g., 1.2M instead of 1,200,000)
export function formatLargeNumber(num: number): string {
  if (num < 1000) return num.toString();
  
  if (num < 1000000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  
  if (num < 1000000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  
  return (num / 1000000000).toFixed(1) + 'B';
}

// Format a date string in a localized format
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString();
}

// Calculate time ago string (e.g., "3 hours ago")
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? '1 year ago' : `${interval} years ago`;
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? '1 month ago' : `${interval} months ago`;
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : `${interval} days ago`;
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  }
  
  return seconds < 10 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
}

// Get color for a specific table format
export function getFormatColor(format: TableFormat): { bg: string, text: string, border: string } {
  switch (format) {
    case 'iceberg':
      return { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' };
    case 'delta':
      return { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' };
    case 'hudi':
      return { bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500' };
    case 'parquet':
      return { bg: 'bg-gray-500', text: 'text-gray-500', border: 'border-gray-500' };
    default:
      return { bg: 'bg-neutral-500', text: 'text-neutral-500', border: 'border-neutral-500' };
  }
}

// Get icon for a specific table format
export function getFormatIcon(format: TableFormat): string {
  switch (format) {
    case 'iceberg':
      return 'ri-file-list-3-line';
    case 'delta':
      return 'ri-database-2-line';
    case 'hudi':
      return 'ri-git-branch-line';
    case 'parquet':
      return 'ri-file-code-line';
    default:
      return 'ri-file-line';
  }
}

// Get description for a specific table format
export function getFormatDescription(format: TableFormat): string {
  switch (format) {
    case 'iceberg':
      return 'Apache Iceberg is a high-performance format for huge analytic tables with features like schema evolution, partition evolution, and time travel.';
    case 'delta':
      return 'Delta Lake is an open-source storage layer with ACID transactions, scalable metadata handling, and unifies streaming and batch data processing.';
    case 'hudi':
      return 'Apache Hudi brings transactions, record-level updates/deletes, and change streams to data lakes, enabling incremental data pipelines.';
    case 'parquet':
      return 'Apache Parquet is a columnar storage file format optimized for use with big data processing frameworks.';
    default:
      return 'Unknown table format.';
  }
}
