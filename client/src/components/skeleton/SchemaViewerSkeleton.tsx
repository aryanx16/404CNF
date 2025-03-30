// ../skeleton/SchemaViewerSkeleton.tsx
import React from 'react';

/**
 * Props for the SchemaViewerSkeleton component.
 */
interface SchemaViewerSkeletonProps {
  /**
   * If true, renders a compact preview version of the skeleton
   * (fewer rows, includes footer placeholder).
   * @default false
   */
  isPreview?: boolean;
}

/**
 * A skeleton loader component designed to mimic the layout of the SchemaViewer component.
 * It provides a visual placeholder while schema data is loading.
 * Includes pulsing animation via Tailwind CSS (`animate-pulse`).
 */
export const SchemaViewerSkeleton: React.FC<SchemaViewerSkeletonProps> = ({ isPreview = false }) => {
  // Determine the number of skeleton rows to display based on preview mode
  const skeletonRowCount = isPreview ? 3 : 8;

  return (
    // Outer container mimics SchemaViewer's container, adds pulse animation
    // aria-hidden="true" improves accessibility by hiding purely visual elements from screen readers
    <div
      className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 animate-pulse"
      aria-hidden="true" // Hide decorative skeleton from assistive technologies
    >
      {/* --- Header Skeleton --- */}
      <div className="flex justify-between items-center p-4 border-b border-neutral-200">
        {/* Placeholder for "Schema Overview" title */}
        <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
        {/* Placeholders for header buttons */}
        <div className="flex space-x-2">
          <div className="h-4 bg-neutral-200 rounded w-24"></div> {/* Approx width for "View Schema History" */}
          <div className="h-4 bg-neutral-200 rounded w-20"></div> {/* Approx width for "JSON Schema" */}
        </div>
      </div>

      {/* --- Table Skeleton --- */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          {/* Table Head Skeleton */}
          <thead className="bg-neutral-50">
            <tr>
              {/* Placeholders for table headers */}
              <th className="px-4 py-3 w-2/5">
                <div className="h-3 bg-neutral-300 rounded"></div>
              </th>
              <th className="px-4 py-3 w-2/5">
                <div className="h-3 bg-neutral-300 rounded"></div>
              </th>
              <th className="px-4 py-3 w-1/5">
                <div className="h-3 bg-neutral-300 rounded"></div>
              </th>
            </tr>
          </thead>
          {/* Table Body Skeleton */}
          <tbody className="bg-white divide-y divide-neutral-200">
            {/* Generate skeleton rows */}
            {Array.from({ length: skeletonRowCount }).map((_, index) => (
              <tr key={`skeleton-row-${index}`}>
                {/* Field Name placeholder */}
                <td className="px-4 py-3">
                  <div className="h-4 bg-neutral-200 rounded"></div>
                </td>
                {/* Type placeholder */}
                <td className="px-4 py-3">
                  <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                </td>
                {/* Required placeholder */}
                <td className="px-4 py-3">
                  <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Footer Skeleton (Conditional) --- */}
      {/* Only shown in preview mode */}
      {isPreview && (
        <div className="p-3 text-center border-t border-neutral-200">
          {/* Placeholder for the "View all fields" button */}
          <div className="h-4 bg-neutral-200 rounded w-1/3 mx-auto"></div>
        </div>
      )}
    </div>
  );
};

// Assigning a display name for better debugging in React DevTools
SchemaViewerSkeleton.displayName = 'SchemaViewerSkeleton';

// If you prefer a default export:
// export default SchemaViewerSkeleton;