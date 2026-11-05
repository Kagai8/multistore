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

export default function ProductGrid({
    products,
    onAdd,
}: {
    products: Product[];
    onAdd: (p: Product) => void;
}) {
    if (products.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
                <Package size={48} className="mb-2 opacity-50" />
                <p>No products found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
                <button
                    key={product.id}
                    onClick={() => onAdd(product)}
                    className="group relative flex h-40 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:border-orange-200 hover:shadow-md active:scale-95"
                >
                    {/* Image Area */}
                    <div className="flex h-24 w-full items-center justify-center overflow-hidden bg-gray-50">
                        {product.main_image ? (
                            <img
                                src={product.main_image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div
                                className={`flex h-full w-full items-center justify-center text-xl font-bold ${product.color}`}
                            >
                                {product.initials}
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="flex w-full flex-1 flex-col justify-between p-2">
                        <div className="line-clamp-1 text-xs font-semibold text-gray-700 group-hover:text-orange-600">
                            {product.name}
                        </div>
                        <div className="mt-1 flex items-end justify-between">
                            <div className="text-sm font-bold text-gray-900">
                                {product.retail_price.toLocaleString()}
                            </div>
                            <div
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                            >
                                {product.stock} left
                            </div>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
