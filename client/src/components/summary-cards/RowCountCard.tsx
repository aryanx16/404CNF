import React from 'react';
import { formatLargeNumber } from '@/lib/formatUtils';
interface RowCountCardProps {
  data: any; 
}


export default function RowCountCard({ data }: RowCountCardProps) {
  const currentRows = data?.key_metrics?.approx_live_records;

  if (currentRows === undefined || currentRows === null) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-neutral-500">Row Count</h3>
            <p className="mt-1 text-lg font-semibold">Unknown</p>
          </div>
          <div className="text-green-500">
            <i className="ri-database-2-line text-2xl"></i>
          </div>
        </div>
        <div className="mt-2 text-sm text-neutral-600">
          <p>No row count information available</p>
        </div>
      </div>
    );
  }
  
  // Calculate change from the previous snapshot
  let changeInfo = null;
  const history = data?.version_history?.snapshots_overview;

  if (history && history.length >= 2) {
    const previousSnapshot = history[history.length - 2]; 
    
    const previousTotalRecordsStr = previousSnapshot?.summary?.['total-records']; 

    if (previousTotalRecordsStr !== undefined && previousTotalRecordsStr !== null) {
      const previousRows = parseInt(previousTotalRecordsStr, 10);

      if (!isNaN(previousRows)) {
        const rowDifference = currentRows - previousRows;
        
        const percentChange = previousRows > 0 ? (rowDifference / previousRows) * 100 : (rowDifference > 0 ? Infinity : 0); // Show Infinity if starting from 0

        if (rowDifference !== 0) {
            const sign = rowDifference > 0 ? '+' : ''; // Decrease will have implicit '-' from the number
            const icon = rowDifference > 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line';
            const color = rowDifference > 0 ? 'text-green-500' : 'text-red-500'; // Green for increase, Red for decrease
            
            const percentString = isFinite(percentChange) ? `(${sign}${percentChange.toFixed(1)}%)` : '(new)';

            changeInfo = (
            <span className={`inline-flex items-center ${color}`}>
                <i className={`${icon} mr-1`}></i>
                {/* Show the absolute number change and percentage */}
                {sign}{formatLargeNumber(rowDifference)} {percentString} from last snapshot
            </span>
            );
        } else {
            // No change
             changeInfo = <p>No change from last snapshot</p>;
        }
      }
    }
  }
  
  // Default message if change couldn't be calculated (e.g., only one snapshot)
  if (!changeInfo) {
      changeInfo = <p>Total live records in table</p>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-neutral-500">Row Count</h3>
          {/* Display the current live record count */}
          <p className="mt-1 text-lg font-semibold">{formatLargeNumber(currentRows)}</p> 
        </div>
        <div className="text-green-500"> {/* Icon color can be dynamic if needed */}
          <i className="ri-database-2-line text-2xl"></i>
        </div>
      </div>
      <div className="mt-2 text-sm text-neutral-600">
        {/* Display the calculated change info or the default message */}
        {changeInfo}
      </div>
    </div>
  );
}