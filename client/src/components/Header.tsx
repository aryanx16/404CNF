import React from 'react';

export default function Header() {
  return (
    <header className="bg-white border-b border-neutral-200 px-4 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center">
        <h1 className="text-primary font-bold text-2xl mr-2">Lakelens</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button className="px-3 cursor-not-allowed py-1 border border-neutral-300 rounded hover:bg-neutral-100">
          Settings
        </button>
        <button className="px-3 cursor-not-allowed py-1 border border-neutral-300 rounded hover:bg-neutral-100">
          Help
        </button>
        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
          <span className="text-sm font-medium">JD</span>
        </div>
      </div>
    </header>
  );
}
