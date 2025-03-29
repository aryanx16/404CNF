// src/components/overview/OverviewViewerSkeleton.tsx
// (Assuming location relative to OverviewViewer)

import React from 'react';

/** Renders a pulsing placeholder element */
const Pulse = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200/90 dark:bg-gray-700/90 rounded-md ${className || 'h-4 w-full'}`}></div>
);

export function OverviewViewerSkeleton() {
    return (
        <>
            {/* Skeleton Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {/* Mimic 4 cards, as VersionCard might show */}
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <Pulse className="h-4 w-2/5" /> {/* Card Title */}
                            <Pulse className="h-5 w-5 rounded-full" /> {/* Icon Placeholder */}
                        </div>
                        <Pulse className="h-7 w-1/3" />   {/* Main Value */}
                        <Pulse className="h-3 w-4/5" />   {/* Subtitle/Description */}
                    </div>
                ))}
            </div>

            {/* Skeleton Analytics Charts */}
            {/* Show 2 chart placeholders, as they might appear */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Skeleton Chart Card 1 */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                    <Pulse className="h-5 w-3/5 mb-1" /> {/* Chart Title */}
                    <Pulse className="h-4 w-4/5 mb-4" /> {/* Chart Subtitle */}
                    <div className="flex-grow h-[200px]"> {/* Chart Area */}
                        <Pulse className="h-full w-full" />
                    </div>
                </div>
                 {/* Skeleton Chart Card 2 */}
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                    <Pulse className="h-5 w-3/5 mb-1" /> {/* Chart Title */}
                    <Pulse className="h-4 w-4/5 mb-4" /> {/* Chart Subtitle */}
                    <div className="flex-grow h-[200px]"> {/* Chart Area */}
                        <Pulse className="h-full w-full" />
                    </div>
                </div>
            </div>


            {/* Skeleton SchemaViewer Section */}
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <Pulse className="h-6 w-32" /> {/* Title: "Schema" */}
                    <Pulse className="h-8 w-24" /> {/* Button/Link: "View Full Schema" */}
                </div>
                 {/* Table Placeholder */}
                <div className="space-y-3">
                    {/* Header Row */}
                     <div className="flex space-x-4">
                         <Pulse className="h-4 w-1/4" />
                         <Pulse className="h-4 w-1/4" />
                         <Pulse className="h-4 w-1/2" />
                     </div>
                     {/* Data Rows (e.g., 5 rows) */}
                     {[...Array(5)].map((_, i) => (
                         <div key={i} className="flex space-x-4">
                            <Pulse className="h-4 w-1/4" />
                            <Pulse className="h-4 w-1/4" />
                            <Pulse className="h-4 w-1/2" />
                         </div>
                     ))}
                </div>
            </div>


            {/* Skeleton Schema History Preview */}
             <div className="mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-2.5">
                    <div className="flex justify-between items-center mb-1">
                        <Pulse className="h-5 w-32" /> {/* Title: "Schema History" */}
                        <Pulse className="h-5 w-28" /> {/* Link: "View Full History" */}
                    </div>
                    <Pulse className="h-4 w-3/4" /> {/* Text line 1 */}
                    <Pulse className="h-4 w-1/2" /> {/* Text line 2 */}
                </div>
            </div>

            {/* Skeleton VersionViewer Preview */}
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                    <Pulse className="h-5 w-36" /> {/* Title: "Latest Version" */}
                    <Pulse className="h-5 w-24" /> {/* Link: "View History" */}
                </div>
                 {/* Content Placeholder */}
                <div className="space-y-2">
                    <Pulse className="h-4 w-1/3" />
                    <Pulse className="h-4 w-1/2" />
                    <Pulse className="h-4 w-3/4" />
                </div>
            </div>


            {/* Skeleton PartitionViewer Preview */}
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                     <Pulse className="h-5 w-40" /> {/* Title: "Partition Layout" */}
                     <Pulse className="h-5 w-24" /> {/* Link: "View Details" */}
                 </div>
                 {/* Content Placeholder */}
                 <div className="space-y-2">
                    <Pulse className="h-4 w-4/5" />
                    <Pulse className="h-4 w-2/3" />
                 </div>
            </div>


            {/* Skeleton PropertiesViewer Preview */}
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                 {/* Header */}
                 <div className="flex justify-between items-center mb-3">
                     <Pulse className="h-5 w-44" /> {/* Title: "Format Properties" */}
                     <Pulse className="h-5 w-24" /> {/* Link: "View All" */}
                 </div>
                 {/* Key-Value Placeholder */}
                 <div className="space-y-2.5">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex space-x-4">
                           <Pulse className="h-4 w-1/3" /> {/* Key */}
                           <Pulse className="h-4 w-2/3" /> {/* Value */}
                        </div>
                    ))}
                 </div>
            </div>

            {/* No placeholder needed for the conditional Parquet info message */}
        </>
    );
}

export default OverviewViewerSkeleton; // Optional default export