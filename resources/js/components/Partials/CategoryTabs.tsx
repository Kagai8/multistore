/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

export default function CategoryTabs({ categories, selected, onSelect }: any) {
    return (
        <div className="flex items-center gap-2 p-3 border-b bg-white overflow-x-auto no-scrollbar">
            <button
                onClick={() => onSelect('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selected === 'all'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
                ALL ITEMS
            </button>

            {categories.map((cat: any) => (
                <button
                    key={cat.id}
                    onClick={() => onSelect(cat.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        selected === cat.id
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {cat.name.toUpperCase()}
                </button>
            ))}
        </div>
    );
}
