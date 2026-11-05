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
            // 🟢 Expanded Tabs for Financials
            // Must stay in sync with mode-registry.ts, which drives the UI tab strip.
            'tab' => 'nullable|string|in:valuation,movement,adjustments,profit_loss,performance,tax_summary,payments,debt_aging,refunds_voids',

            // Pagination & Basics
            'perPage' => 'nullable|integer|in:-1,5,10,25,50,100',
            'page' => 'nullable|integer',
            'search' => 'nullable|string|max:255',

            // 🟢 Store & Product remain core
            'store_id' => 'nullable|string',
            'product_id' => 'nullable|exists:products,id',
            'brand_id' => 'nullable|exists:brands,id',
            'category_id' => 'nullable|exists:categories,id',

            // People & Entities
            'user_id' => 'nullable|exists:users,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'customer_id' => 'nullable|exists:customers,id', // 🆕 New for Finance

            // 🟢 Financial Specifics
            'payment_method' => 'nullable|string', // cash, mpesa, bank, etc.
            'price_category' => 'nullable|string|in:retail,wholesale,special,manual', // 🆕 Track specific price usage
            'status' => 'nullable|string', // paid, partial, unpaid

            // References & Adjustments
            'reference' => 'nullable|string|max:255',
            'adjustment_reason_id' => 'nullable|exists:adjustment_reasons,id',

            // Ranges (Prices / Stock)
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|gte:min_price',
            'stock_min' => 'nullable|integer|min:0',
            'stock_max' => 'nullable|integer|gte:stock_min',

            // 🟢 Global Date Filters
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',

            // Sorting
            'sort' => 'nullable|string',
            'direction' => 'nullable|in:asc,desc',
        ];
    }

    protected function prepareForValidation()
    {
        // Ensuring defaults for a smooth UI experience
        $this->merge([
            'tab' => $this->tab ?? 'valuation',
            'perPage' => $this->perPage ?? 10,
            'store_id' => ($this->store_id === '' || $this->store_id === null) ? 'all' : $this->store_id,
        ]);
    }
}
