<?php

namespace App\Http\Controllers;

use App\Models\AdjustmentReason;
use App\Models\StockAdjustment; // Needed for the deletion check
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Log; // Kept Log usage from BrandController pattern

// We don't need PhpSpreadsheet/Storage for this simplified controller

class AdjustmentReasonController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        // base query
        $query = AdjustmentReason::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply Date Range Filter (Using 'created_at' column)
        if ($dateFrom || $dateTo) {
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

            if ($start && !$end) {
                $query->where('created_at', '>=', $start);
            } elseif (!$start && $end) {
                $query->where('created_at', '<=', $end);
            } elseif ($start && $end) {
                 $query->whereBetween('created_at', [$start, $end]);
            }
        }

        // counts for UI
        $totalCount = AdjustmentReason::count();
        $filteredCount = $query->count();

        // Transformation function to structure data for Inertia
        $transform = function (AdjustmentReason $reason) {
            return [
                'id' => $reason->id,
                'name' => $reason->name,
                'slug' => $reason->slug,
                'description' => $reason->description,
                'is_active' => $reason->is_active,
                'created_at' => optional($reason->created_at)->format('d M Y'),
            ];
        };

        if ($perPage === -1) {
            $all = $query->latest()->get()->map($transform);
            $reasons = [
                'data' => $all,
                'total' => $filteredCount,
                'per_page' => $perPage,
                'from' => $all->count() ? 1 : 0,
                'to' => $all->count(),
                'links' => [],
            ];
        } else {
            $paginator = $query->latest()->paginate($perPage)->withQueryString();
            $paginator->getCollection()->transform($transform);
            $reasons = $paginator;
        }

        // IMPORTANT: Use lowercase 'adjustmentreasons/index' as per your convention
        return Inertia::render('adjustment-reason/index', [
            'reasons' => $reasons,
            'filters' => $request->only(['search', 'perPage','dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:adjustment_reasons,name',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Slug generation is handled in the Model's boot method
        // $validated['slug'] = Str::slug($validated['name']);

        AdjustmentReason::create($validated);

        return redirect()
            ->route('adjustmentreasons.index')
            ->with('success', 'Adjustment reason created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, AdjustmentReason $adjustmentreason)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('adjustment_reasons')->ignore($adjustmentreason->id),
            ],
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $adjustmentreason->update($validated);

        return back()->with('success', 'Adjustment reason updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AdjustmentReason $adjustmentreason)
    {
        // CRITICAL CHECK: Prevent deletion if this reason is used in any stock transaction
        if (StockAdjustment::where('adjustment_reason_id', $adjustmentreason->id)->exists()) {
             return back()->with('error', 'Cannot delete: This reason is currently used in existing stock adjustment records.');
        }

        $adjustmentreason->delete();

        return redirect()->back()->with('success', 'Adjustment reason deleted successfully.');
    }

    /**
     * Handle bulk deletion.
     */
    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return back()->with('error', 'No reasons selected.');
        }

        $reasons = AdjustmentReason::whereIn('id', $ids)->get();
        $deletedCount = 0;
        $blockedNames = [];

        DB::beginTransaction();
        try {
            foreach ($reasons as $reason) {
                // Check if reason is linked to any StockAdjustment
                if (StockAdjustment::where('adjustment_reason_id', $reason->id)->exists()) {
                    $blockedNames[] = $reason->name;
                    continue; // Skip and log
                }
                $reason->delete();
                $deletedCount++;
            }
            DB::commit();

            if (!empty($blockedNames)) {
                 $message = "$deletedCount reason(s) deleted successfully. However, the following reasons could not be deleted because they are linked to existing stock adjustments: " . implode(', ', $blockedNames) . ".";
                 return back()->with('warning', $message);
            }

            return back()->with('success', $deletedCount . ' adjustment reason(s) deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk Delete Error (Adjustment Reasons): ' . $e->getMessage());
            return back()->with('error', 'An error occurred during bulk deletion.');
        }
    }

    /**
     * Export a single record to PDF.
     */
    public function exportSinglePdf(AdjustmentReason $adjustmentreason)
    {
        $pdf = Pdf::loadView('adjustmentreasons.reason-single', compact('adjustmentreason'))
            ->setPaper('a4', 'portrait');

        return $pdf->download("adjustment_reason_{$adjustmentreason->id}.pdf");
    }

    /**
     * Export a single record to Excel.
     */
    public function exportSingleExcel(AdjustmentReason $adjustmentreason)
        {
            return Excel::download(
                new class($adjustmentreason) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                    protected $reason;
                    public function __construct($reason) { $this->reason = $reason; }

                    public function collection()
                    {
                        return collect([[
                            'ID' => $this->reason->id,
                            'Name' => $this->reason->name,
                            'Slug' => $this->reason->slug,
                            'Description' => $this->reason->description,
                            'Is Active' => $this->reason->is_active ? 'Yes' : 'No',
                            'Created Date' => optional($this->reason->created_at)->format('d M Y'),
                        ]]);
                    }

                    public function headings(): array
                    {
                        return ['ID', 'Name', 'Slug', 'Description', 'Is Active', 'Created Date'];
                    }
                },
                "adjustment_reason_{$adjustmentreason->id}.xlsx"
            );
        }

    /**
     * Export multiple records to PDF.
     */
    public function bulkExportPDF(Request $request)
        {
            $ids = explode(',', $request->input('ids', ''));
            $reasons = AdjustmentReason::whereIn('id', $ids)->get();

            if ($reasons->isEmpty()) {
                return back()->with('error', 'No adjustment reasons selected for export.');
            }

            $pdf = Pdf::loadView('adjustmentreasons.reason-bulk-pdf', compact('reasons'))
                ->setPaper('a4', 'portrait');

            return $pdf->download('adjustment_reasons_export.pdf');
        }

    /**
     * Export multiple records to Excel.
     */
    public function bulkExportExcel(Request $request)
        {
            $ids = explode(',', $request->input('ids', ''));
            $reasons = AdjustmentReason::whereIn('id', $ids)->get();

            if ($reasons->isEmpty()) {
                return back()->with('error', 'No adjustment reasons selected for export.');
            }

            return Excel::download(
                new class($reasons) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                    protected $reasons;
                    public function __construct($reasons) { $this->reasons = $reasons; }

                    public function collection()
                    {
                        return $this->reasons->map(fn ($reason) => [
                            'ID' => $reason->id,
                            'Name' => $reason->name,
                            'Slug' => $reason->slug,
                            'Description' => $reason->description,
                            'Is Active' => $reason->is_active ? 'Yes' : 'No',
                            'Created Date' => optional($reason->created_at)->format('d M Y'),
                        ]);
                    }

                    public function headings(): array
                    {
                        return ['ID', 'Name', 'Slug', 'Description', 'Is Active', 'Created Date'];
                    }
                },
                'adjustment_reasons_export.xlsx'
            );
        }

    // Removed: downloadTemplate and import (as this is a simple, text-based lookup CRUD)
}
