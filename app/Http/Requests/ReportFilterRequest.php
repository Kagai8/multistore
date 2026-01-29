<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReportFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Master IDs
            'brand_id'      => 'nullable|exists:brands,id',
            'category_id'   => 'nullable|exists:categories,id',
            'store_id'      => 'nullable|exists:stores,id',
            'user_id'       => 'nullable|exists:users,id',
            'supplier_id'   => 'nullable|exists:suppliers,id',
            'product_id'  => 'nullable',

            // BI Numerical Ranges
            'min_price'     => 'nullable|numeric|min:0',
            'max_price'     => 'nullable|numeric|gte:min_price',
            'stock_min'     => 'nullable|integer|min:0',
            'stock_max'     => 'nullable|integer|gte:stock_min',

            // Logic & Search
            'search'        => 'nullable|string|max:255',
            'tab'           => 'nullable|string|in:valuation,movement,adjustments',
            'perPage'       => 'nullable|integer|in:-1,5,10,25,50,100',

            // Sorting
            'sort'          => 'nullable|string',
            'direction'     => 'nullable|in:asc,desc',
        ];
    }

    protected function prepareForValidation()
    {
        $this->merge([
            'tab' => $this->tab ?? 'valuation',
            'perPage' => $this->perPage ?? 10,
        ]);
    }
}
