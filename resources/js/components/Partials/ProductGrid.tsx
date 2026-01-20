import React from 'react';
import { Package } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    retail_price: number;
    stock: number;
    main_image: string | null;
    initials: string;
    color: string;
}

export default function ProductGrid({ products, onAdd }: { products: Product[], onAdd: (p: Product) => void }) {
    if (products.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Package size={48} className="mb-2 opacity-50" />
                <p>No products found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((product) => (
                <button
                    key={product.id}
                    onClick={() => onAdd(product)}
                    className="group relative flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all text-left overflow-hidden h-40 active:scale-95"
                >
                    {/* Image Area */}
                    <div className="h-24 w-full bg-gray-50 flex items-center justify-center overflow-hidden">
                        {product.main_image ? (
                            <img src={product.main_image} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className={`h-full w-full flex items-center justify-center text-xl font-bold ${product.color}`}>
                                {product.initials}
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="p-2 flex-1 flex flex-col justify-between w-full">
                        <div className="text-xs font-semibold text-gray-700 line-clamp-1 group-hover:text-orange-600">
                            {product.name}
                        </div>
                        <div className="flex items-end justify-between mt-1">
                            <div className="text-sm font-bold text-gray-900">
                                {product.retail_price.toLocaleString()}
                            </div>
                            <div className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {product.stock} left
                            </div>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
