import React from 'react';

interface PropertiesViewerSkeletonProps {
  isPreview?: boolean;
}

export default function PropertiesViewerSkeleton({ isPreview = false }: PropertiesViewerSkeletonProps) {

  // --- Skeleton for Preview Mode ---
  if (isPreview) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 animate-pulse overflow-hidden">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center p-4 border-b border-neutral-200">
          <div className="h-5 bg-neutral-300 rounded w-2/5"></div> {/* Slightly darker title */}
          <div className="h-5 bg-neutral-200 rounded w-1/4"></div> {/* Lighter button */}
        </div>
        {/* Content Skeleton */}
        <div className="p-4">
          <div className="bg-neutral-100 p-3 rounded-md border border-neutral-200"> {/* Softer container */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5"> {/* Increased gap slightly */}
              {/* Key-Value Pair Skeletons (Refined look) */}
              <div className="h-4 bg-neutral-300 rounded w-1/3"></div> {/* Key */}
              <div className="h-4 bg-neutral-200 rounded w-3/4"></div> {/* Value */}
              <div className="h-4 bg-neutral-300 rounded w-1/4"></div> {/* Key */}
              <div className="h-4 bg-neutral-200 rounded w-1/2"></div> {/* Value */}
              <div className="h-4 bg-neutral-300 rounded w-1/3"></div> {/* Key */}
              <div className="h-4 bg-neutral-200 rounded w-5/6"></div> {/* Value */}
              <div className="h-4 bg-neutral-300 rounded w-1/4"></div> {/* Key */}
              <div className="h-4 bg-neutral-200 rounded w-2/4"></div> {/* Value */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Skeleton for Full Mode ---
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6 animate-pulse overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center p-4 border-b border-neutral-200">
        <div className="h-5 bg-neutral-300 rounded w-2/5"></div> {/* Title placeholder */}
        <div className="h-5 bg-neutral-200 rounded w-1/4"></div> {/* Button placeholder */}
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Increased gap */}
        {/* Left Column Skeleton */}
        <div className="space-y-6"> {/* Add vertical spacing */}
          {/* Manifest/Log Files Skeleton */}
          <div>
            <div className="h-4 bg-neutral-300 rounded w-1/3 mb-2.5"></div> {/* Section Title */}
            <div className="border border-neutral-200 rounded-md overflow-hidden">
               <div className="bg-neutral-100 p-2.5 border-b border-neutral-200 flex justify-between items-center"> {/* Slightly more padding */}
                  <div className="h-3.5 bg-neutral-300 rounded w-1/4"></div> {/* List Header */}
                  <div className="h-3.5 bg-neutral-300 rounded w-1/6"></div> {/* List Header */}
               </div>
               <div className="p-2.5 space-y-2.5"> {/* Simulating list items with more spacing */}
                   <div className="flex justify-between items-center">
                       <div className="h-4 bg-neutral-200 rounded w-4/5"></div>
                       <div className="h-4 bg-neutral-200 rounded w-1/6"></div>
                   </div>
                   <div className="flex justify-between items-center">
                       <div className="h-4 bg-neutral-200 rounded w-3/5"></div>
                       <div className="h-4 bg-neutral-200 rounded w-1/6"></div>
                   </div>
                    <div className="flex justify-between items-center">
                       <div className="h-4 bg-neutral-200 rounded w-4/5"></div>
                       <div className="h-4 bg-neutral-200 rounded w-1/6"></div>
                   </div>
               </div>
            </div>
          </div>

          {/* Format Configuration Skeleton */}
           <div>
            <div className="h-4 bg-neutral-300 rounded w-1/2 mb-2.5"></div> {/* Section Title */}
            <div className="bg-neutral-100 p-3 rounded-md border border-neutral-200">
               <div className="space-y-2"> {/* Placeholder for pre/code block */}
                  <div className="h-3.5 bg-neutral-200 rounded w-full"></div>
                  <div className="h-3.5 bg-neutral-200 rounded w-5/6"></div>
                  <div className="h-3.5 bg-neutral-200 rounded w-full"></div>
                  <div className="h-3.5 bg-neutral-200 rounded w-4/6"></div>
                  <div className="h-3.5 bg-neutral-200 rounded w-5/6"></div>
               </div>
            </div>
           </div>

          {/* Format Description Skeleton */}
           <div>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md"> {/* Keep blue hint */}
              <div className="h-4 bg-blue-200 rounded w-1/3 mb-2"></div> {/* Title */}
              <div className="space-y-1.5">
                  <div className="h-3.5 bg-blue-100 rounded w-full"></div> {/* Lighter blue for text */}
                  <div className="h-3.5 bg-blue-100 rounded w-5/6"></div>
              </div>
            </div>
           </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="space-y-6"> {/* Add vertical spacing */}
          {/* Snapshot Details Skeleton */}
           <div>
            <div className="h-4 bg-neutral-300 rounded w-1/3 mb-2.5"></div> {/* Section Title */}
            <div className="bg-neutral-100 p-3 rounded-md border border-neutral-200">
               <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {/* Multiple Key-Value Skeletons */}
                  {Array.from({ length: 8 }).map((_, i) => (
                      <React.Fragment key={i}>
                          <div className="h-4 bg-neutral-300 rounded w-2/5"></div> {/* Key */}
                          <div className="h-4 bg-neutral-200 rounded w-4/5"></div> {/* Value */}
                      </React.Fragment>
                  ))}
               </div>
            </div>
           </div>

          {/* Key Metrics Skeleton */}
           <div>
            <div className="h-4 bg-neutral-300 rounded w-1/4 mb-2.5"></div> {/* Section Title */}
             <div className="grid grid-cols-2 gap-4"> {/* Keep gap-4 for metric boxes */}
                  {/* Multiple Metric Box Skeletons */}
                  {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-neutral-100 p-3 rounded-md border border-neutral-200 flex flex-col justify-between h-20"> {/* Fixed height */}
                          <div className="h-3.5 bg-neutral-300 rounded w-3/5"></div> {/* Label */}
                          <div className="h-6 bg-neutral-200 rounded w-4/6 self-end"></div> {/* Value, aligned bottom-ish */}
                      </div>
                   ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}