import React from 'react'

const Pulse = ({ className = '' }: { className?: string }) => (
  // Added default height h-4 if not specified, adjust gray intensity slightly
  <div className={`animate-pulse bg-gray-200/90 dark:bg-gray-700/90 rounded-md ${className || 'h-4 w-full'}`}></div>
);

export default Pulse