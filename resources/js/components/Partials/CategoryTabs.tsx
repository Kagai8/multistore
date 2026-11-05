/* eslint-disable @typescript-eslint/no-explicit-any */

export default function CategoryTabs({ categories, selected, onSelect }: any) {
    return (
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b bg-white p-3">
            <button
                onClick={() => onSelect('all')}
                className={`rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
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
                    className={`rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
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
