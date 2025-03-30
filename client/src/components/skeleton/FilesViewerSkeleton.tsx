// src/components/table-viewers/FilesViewerSkeleton.tsx
import React from 'react';

/** Renders a pulsing placeholder element */
const Pulse = ({ className = '' }: { className?: string }) => (
    // Added default height h-4 if not specified, adjust gray intensity slightly
    <div className={`animate-pulse bg-gray-200/90 dark:bg-gray-700/90 rounded-md ${className || 'h-4 w-full'}`}></div>
);

export function FilesViewerSkeleton() {
    return (
        <div className="p-4 space-y-6">
            {/* Skeleton Header - Keep as is, looks reasonable */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
                <Pulse className="h-8 w-36" /> {/* Title */}
                <div className="flex items-center space-x-2">
                    <Pulse className="h-9 w-44" /> {/* Search Input */}
                    <Pulse className="h-9 w-28" /> {/* Sort Select */}
                </div>
            </div>

            {/* Skeleton Key Metrics - Refined heights/widths */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-2.5"> {/* Increased space slightly */}
                        <Pulse className="h-4 w-3/5" /> {/* Metric Title (Slightly shorter height) */}
                        <Pulse className="h-7 w-1/3" /> {/* Metric Value (Taller height) */}
                        <Pulse className="h-3 w-4/5" /> {/* Metric Subtitle (Shorter height) */}
                    </div>
                ))}
            </div>

            {/* Skeleton File Overview Section - More detailed charts */}
             <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <Pulse className="h-6 w-48 mb-4" /> {/* Section Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Skeleton Pie Chart Card - Added legend pulses */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                        <Pulse className="h-5 w-3/5 mb-1" /> {/* Chart Title */}
                        <Pulse className="h-4 w-4/5 mb-4" /> {/* Chart Subtitle */}
                        <div className="flex-grow flex justify-center items-center h-[210px]"> {/* Adjusted height slightly for legend */}
                             <Pulse className="h-44 w-44 rounded-full" /> {/* Pie Chart Placeholder */}
                        </div>
                        {/* Legend Placeholder */}
                        <div className="flex justify-center items-center space-x-4 pt-3 h-[30px]">
                             <Pulse className="h-3 w-16" />
                             <Pulse className="h-3 w-16" />
                        </div>
                    </div>

                     {/* Skeleton Line Chart Card - Added axis placeholders */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                        <Pulse className="h-5 w-3/5 mb-1" /> {/* Chart Title */}
                        <Pulse className="h-4 w-4/5 mb-4" /> {/* Chart Subtitle */}
                        {/* Chart Area with Axes */}
                        <div className="flex-grow flex h-[240px] space-x-2">
                             {/* Y-Axis Placeholder */}
                             <div className="flex flex-col justify-between items-center w-10 py-2">
                                 <Pulse className="h-3 w-full" />
                                 <Pulse className="h-3 w-full" />
                                 <Pulse className="h-3 w-full" />
                                 <Pulse className="h-3 w-full" />
                             </div>
                             {/* Chart Content Area + X-Axis */}
                             <div className="flex-grow flex flex-col">
                                 {/* Main chart content area pulse */}
                                <div className="flex-grow">
                                     <Pulse className="h-full w-full"/>
                                </div>
                                 {/* X-Axis Placeholder */}
                                 <div className="flex justify-between items-center h-10 px-2 pt-1">
                                     <Pulse className="h-3 w-1/5" />
                                     <Pulse className="h-3 w-1/5" />
                                     <Pulse className="h-3 w-1/5" />
                                     <Pulse className="h-3 w-1/5" />
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Skeleton File Metrics Summary - Refined structure */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <Pulse className="h-6 w-52 mb-1" /> {/* Summary Title */}
                <Pulse className="h-4 w-4/5 mb-4" /> {/* Summary Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 pt-4"> {/* Increased gap-y */}
                    {/* Column 1 */}
                    <div className="space-y-5"> {/* Increased space */}
                         <div className="space-y-1.5"> {/* Metric Block 1 */}
                            <Pulse className="h-4 w-1/2" /> {/* Label */}
                            <Pulse className="h-5 w-1/3" /> {/* Value */}
                            <Pulse className="h-3 w-2/3" /> {/* Sub-label/note */}
                        </div>
                         <div className="space-y-1.5"> {/* Metric Block 2 */}
                            <Pulse className="h-4 w-1/2" /> {/* Label */}
                            <Pulse className="h-5 w-1/3" /> {/* Value */}
                            <Pulse className="h-3 w-2/3" /> {/* Sub-label/note */}
                        </div>
                    </div>
                     {/* Column 2 */}
                     <div className="space-y-5"> {/* Increased space */}
                         <div className="space-y-1.5"> {/* Metric Block 3 */}
                            <Pulse className="h-4 w-1/2" /> {/* Label */}
                            <Pulse className="h-5 w-1/3" /> {/* Value */}
                            <Pulse className="h-3 w-2/3" /> {/* Sub-label/note */}
                        </div>
                         <div className="space-y-1.5"> {/* Metric Block 4 */}
                            <Pulse className="h-4 w-1/2" /> {/* Label */}
                            <Pulse className="h-5 w-1/3" /> {/* Value */}
                            {/* Maybe no sub-label here? <Pulse className="h-3 w-2/3" /> */}
                        </div>
                    </div>
                </div>
                 <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Pulse className="h-3.5 w-full" /> {/* Note - slightly taller */}
                 </div>
            </div>

        </div>
    );
}