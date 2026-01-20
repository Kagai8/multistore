<?php

namespace App\Http\Controllers;

use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class CompanySettingController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));

        $query = CompanySetting::query();

        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
        }

        // 🟢 STATS
        $stats = [
            'total_profiles' => CompanySetting::count(),
            'has_default' => CompanySetting::where('is_default', true)->exists(),
            'last_updated' => CompanySetting::latest('updated_at')->value('updated_at')?->format('d M Y') ?? '-',
        ];

        $totalCount = CompanySetting::count();
        $filteredCount = $query->count();

        $settings = $query->latest()->paginate($perPage)->withQueryString()->through(fn($item) => [
            'id' => $item->id,
            'name' => $item->name,
            'phone' => $item->phone ?? '-',
            'email' => $item->email ?? '-',
            'address' => $item->address,
            'city' => $item->city,
            'tax_pin' => $item->tax_pin,
            'is_default' => $item->is_default,
            'logo_url' => $item->logo_url,
            'receipt_footer' => $item->receipt_footer,
            'slogan' => $item->slogan,
            'website' => $item->website,
        ]);

        return Inertia::render('company-settings/index', [
            'settings' => $settings,
            'filters' => $request->only(['search', 'perPage']),
            'stats' => $stats,
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'tax_pin' => 'nullable|string',
            'receipt_footer' => 'nullable|string',
            'logo' => 'nullable|image|max:2048', // 2MB Max
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('company_logos', 'public');
            $validated['logo_path'] = $path;
        }

        // If it's the first setting, make it default automatically
        if (CompanySetting::count() === 0) {
            $validated['is_default'] = true;
        }

        CompanySetting::create($validated);

        return redirect()->back()->with('success', 'Company profile created successfully.');
    }

    public function update(Request $request, CompanySetting $companySetting)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'tax_pin' => 'nullable|string',
            'receipt_footer' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($companySetting->logo_path) {
                Storage::disk('public')->delete($companySetting->logo_path);
            }
            $path = $request->file('logo')->store('company_logos', 'public');
            $validated['logo_path'] = $path;
        }

        $companySetting->update($validated);

        return redirect()->back()->with('success', 'Company profile updated.');
    }

    public function setDefault(CompanySetting $companySetting)
    {
        // Unset other defaults
        CompanySetting::where('id', '!=', $companySetting->id)->update(['is_default' => false]);

        $companySetting->update(['is_default' => true]);

        return redirect()->back()->with('success', "{$companySetting->name} is now the default profile.");
    }

    public function destroy(CompanySetting $companySetting)
    {
        if ($companySetting->is_default) {
            return redirect()->back()->with('error', 'Cannot delete the default profile.');
        }

        if ($companySetting->logo_path) {
            Storage::disk('public')->delete($companySetting->logo_path);
        }

        $companySetting->delete();
        return redirect()->back()->with('success', 'Profile deleted.');
    }
}
