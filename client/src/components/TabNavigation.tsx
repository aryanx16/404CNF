import { formatAtom } from '@/atoms/formatAtom';
import React from 'react'; // useMemo is not strictly needed here for filtering
import { useRecoilValue } from 'recoil';

interface TabNavigationProps {
    activeTab: string;
    onChange: (value: string) => void;
}

// Define the full list of possible tabs
const ALL_TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'files', label: 'Files' },
    { id: 'schema', label: 'Schema' },
    { id: 'partitions', label: 'Partitions' },         // Should be hidden for Parquet
    { id: 'properties', label: 'Properties' },
    { id: 'sample-data', label: 'Sample Data' },
    { id: 'schema-history', label: 'Snaps Compare' }, // Should be hidden for Parquet
];

// Define which tab IDs are specific to table formats (and thus hidden for Parquet)
const FORMAT_SPECIFIC_TAB_IDS = ['partitions', 'schema-history'];

export default function TabNavigation({ activeTab, onChange }: TabNavigationProps) {

    // 1. Get the format value using the hook at the top level. This is correct.
    const globalFormat = useRecoilValue(formatAtom);

    // 2. Determine if the format is Parquet. This is derived state, not a hook.
    const isParquet = globalFormat && globalFormat.toLowerCase() === 'parquet';

    // 3. Filter the list of tabs based on the format. This is data manipulation, not hooks.
    const filteredTabs = ALL_TABS.filter(tab => {
        // If the format is Parquet AND this tab is one that should be hidden...
        if (isParquet && FORMAT_SPECIFIC_TAB_IDS.includes(tab.id)) {
            return false; // ...filter it out.
        }
        return true; // Otherwise, keep it.
    });

    // 4. Return the JSX, mapping over the filtered list.
    return (
        <div className="bg-white border-b border-neutral-200 px-4 flex justify-between overflow-x-auto">
            <div className='flex space-x-1'>
                {/* Map over the dynamically filtered list of tabs */}
                {filteredTabs.map((tab) => (
                    <button
                        key={tab.id}
                        data-value={tab.id}
                        // Added whitespace-nowrap to prevent labels from wrapping
                        className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'text-primary border-b-2 border-primary' // Active style
                                : 'text-neutral-600 hover:text-neutral-900' // Inactive style
                        }`}
                        onClick={() => onChange(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            {/* Query button remains unchanged */}
            <button className="ml-4 bg-green-500 cursor-not-allowed hover:bg-green-600 text-white px-3 py-1.5 my-1 rounded-md text-sm font-medium transition-colors flex items-center flex-shrink-0"> {/* Added ml-4, flex-shrink-0 */}
                <i className="ri-play-line mr-1.5"></i>
                Query
            </button>
        </div>
    );
}