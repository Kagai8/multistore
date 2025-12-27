/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, Ban } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { hasPermission } from '@/utilis/authorization';

// NEW INTERFACE: Auth Props to access permissions
interface AuthPageProps {
    [key: string]: any;
    auth: {
        permissions: string[];
    };
}

// --- Interface Definitions ---
interface TableColumn {
  label: string;
  key: string;
  isImage?: boolean;
  isAction?: boolean;
  className?: string;
  type?: 'text' | 'currency' | 'boolean' | 'multi-values' | 'date';
}

interface ActionConfig {
  label: string;
  icon: any;
  route?: string;
  className?: string;
  permission?: string;
}

interface TableRow {
  [key: string]: any;
  id: number; // Ensure ID exists for selection
}

interface CustomTableProps {
  moduleName?: string;
  columns: TableColumn[];
  actions?: ActionConfig[];
  data: TableRow[];
  from?: number;
  onView?: (row: TableRow) => void;
  onEdit?: (row: TableRow) => void;
  onDelete?: (row: TableRow) => void;
  onExportPDF?: (row: TableRow) => void;
  onExportExcel?: (row: TableRow) => void;
  onBulkDelete?: (ids: number[]) => void;
  onBulkExportPDF?: (ids: number[]) => void;
  onBulkExportExcel?: (ids: number[]) => void;
  onDownloadTemplate?: () => void;
  onFileSelected?: (file: File) => void;

  // 🟢 NEW: Explicit permissions to override auto-generation
  importPermission?: string;
  downloadTemplatePermission?: string;

  onDateFilterChange?: (from: string | null, to: string | null) => void;
  isModal?: boolean;
  CustomRenderer?: React.ComponentType<{ item: TableRow; column: TableColumn }>;
}


export const CustomTable: React.FC<CustomTableProps> = ({
  moduleName,
  columns,
  actions = [],
  data,
  from = 1,
  onView,
  onEdit,
  onDelete,
  onExportPDF,
  onExportExcel,
  onBulkDelete,
  onBulkExportPDF,
  onBulkExportExcel,
  onDownloadTemplate,
  onFileSelected,
  // 🟢 NEW: Destructure the overrides
  importPermission,
  downloadTemplatePermission,
  onDateFilterChange,
  CustomRenderer,
}) => {
    const { auth } = usePage<AuthPageProps>().props;
    const permissions: string[] = auth.permissions || [];

    // Create a safe, lowercase module slug.
    const moduleSlug = (moduleName?.toLowerCase() || 'unknown').replace(/\s+/g, '-');

  // Bulk selection state
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const allSelected = data.length > 0 && selectedRows.length === data.length;

  const toggleSelectAll = () => {
    setSelectedRows(allSelected ? [] : data.map((row) => row.id));
  };

  const toggleRowSelect = (id: number) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    );
  };

  const renderActionButtons = (row: TableRow) => {
    const permittedActions = actions.filter(action =>
        !action.permission ||
        hasPermission(permissions, [action.permission])
    );

    const mainActions = permittedActions.filter(
      (a) => !['Export PDF', 'Export Excel'].includes(a.label)
    );
    const moreActions = permittedActions.filter((a) =>
      ['Export PDF', 'Export Excel'].includes(a.label)
    );

    if (mainActions.length === 0 && moreActions.length === 0) {
        return null;
    }

    return (
        <div className="flex justify-center items-center gap-1">
            {mainActions.map((action, index) => {
            const IconComponent = action.icon as React.ElementType;

            const handleClick =
                action.label === 'View'
                ? () => onView?.(row)
                : action.label === 'Edit'
                ? () => onEdit?.(row)
                : action.label === 'Delete'
                ? () => onDelete?.(row)
                : undefined;

            return (
                <Button
                key={index}
                size="sm"
                className={action.className}
                onClick={handleClick}
                >
                {IconComponent && <IconComponent size={18} />}
                </Button>
            );
            })}

            {moreActions.length > 0 && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-100"
                >
                    <MoreHorizontal size={18} />
                </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                {moreActions.map((action, index) => {
                    const IconComponent = action.icon as React.ElementType;
                    const handleClick =
                    action.label === 'Export PDF'
                        ? () => onExportPDF?.(row)
                        : action.label === 'Export Excel'
                        ? () => onExportExcel?.(row)
                        : undefined;

                    return (
                    <DropdownMenuItem
                        key={index}
                        onClick={handleClick}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        {IconComponent && <IconComponent size={16} />}
                        {action.label}
                    </DropdownMenuItem>
                    );
                })}
                </DropdownMenuContent>
            </DropdownMenu>
            )}
        </div>
        );
    };

    const handleBulkDeleteClick = () => {
        if (selectedRows.length === 0) return;
        if (onBulkDelete) onBulkDelete(selectedRows);
        setSelectedRows([]);
    };

    const handleBulkExportPDFClick = () => {
        if (selectedRows.length === 0) return;
        if (onBulkExportPDF) onBulkExportPDF(selectedRows);
    };

    const handleBulkExportExcelClick = () => {
        if (selectedRows.length === 0) return;
        if (onBulkExportExcel) onBulkExportExcel(selectedRows);
    };

    // Date filter state
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateFrom(e.target.value);
    };

    const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateTo(e.target.value);
    };

    const handleApplyDateFilter = () => {
        if (onDateFilterChange) {
        onDateFilterChange(
            dateFrom || null,
            dateTo || null
        );
        }
    };

    const handleResetDateFilter = () => {
        setDateFrom('');
        setDateTo('');
        if (onDateFilterChange) {
        onDateFilterChange(null, null);
        }
    };

    // 🟢 UPDATED: Determine visibility using explicit props first, then auto-generation
    // Note: We check if `downloadTemplatePermission` is passed. If yes, use it. If not, construct default string.
    const requiredTemplatePerm = downloadTemplatePermission || `${moduleSlug}_download_template`;
    const requiredImportPerm = importPermission || `${moduleSlug}_import`;

    const canDownloadTemplate = onDownloadTemplate && hasPermission(permissions, [requiredTemplatePerm]);
    const canImport = onFileSelected && hasPermission(permissions, [requiredImportPerm]);

  return (
            <div className="rounded-lg border border-gray-200 bg-white shadow-md">
                {/* Top actions bar */}
                <div className="flex justify-between items-center p-3 border-b bg-orange-50">
                    <h3 className="text-lg font-semibold text-orange-700">{moduleName || 'Data Table'}</h3>

                    <div className="flex flex-wrap items-center gap-2">
                            {/* Date filter controls */}
                            <div className="flex flex-wrap items-center gap-1 border-r pr-2 border-gray-200">
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={handleDateFromChange}
                                    className="border rounded-md h-9 px-2 text-sm border-gray-300 focus:ring-1 focus:ring-orange-500"
                                />
                                <span className="text-gray-600">to</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={handleDateToChange}
                                    className="border rounded-md h-9 px-2 text-sm border-gray-300 focus:ring-1 focus:ring-orange-500"
                                />

                                {onDateFilterChange && (
                                <>
                                <Button
                                    size="sm"
                                    className="h-9 bg-orange-600 hover:bg-orange-700 text-white"
                                    onClick={handleApplyDateFilter}
                                    disabled={!dateFrom && !dateTo}
                                >
                                    Filter
                                </Button>
                                {(dateFrom || dateTo) && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-9 text-gray-500 hover:bg-gray-100"
                                        onClick={handleResetDateFilter}
                                    >
                                        <LucideIcons.X size={16} />
                                    </Button>
                                )}
                                </>
                    )}
                </div>
  {/* Download Template */}
  {canDownloadTemplate && (
    <Button
      size="sm"
      variant="outline"
      className="border-orange-400 text-orange-700 hover:bg-orange-100"
      onClick={onDownloadTemplate}
    >
      Download Template
    </Button>
  )}
    {/* Import Excel/CSV */}
    {canImport && (
      <Button
        size="sm"
        className="bg-orange-600 hover:bg-orange-700 text-white"
        onClick={() => document.getElementById('import-file-input')?.click()}
      >
        Import Excel/CSV
      </Button>
    )}

    {canImport && (
      <input
        type="file"
        id="import-file-input"
        accept=".xlsx, .csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onFileSelected(file);
            e.target.value = ''; // reset input
          }
        }}
      />
    )}
  </div>
</div>
<div className="w-full overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-orange-600 text-white">
            <th className="p-4 border text-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 accent-orange-600 cursor-pointer"
              />
            </th>
            <th className="p-4 border text-center">#</th>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`p-4 border text-center font-semibold ${column.className || ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length > 0 ? (
            data.map((row, index) => {
              const isSelected = selectedRows.includes(row.id);
              return (
                <tr
                  key={row.id}
                  className={`transition-colors ${
                    isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="border px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRowSelect(row.id)}
                      className="h-4 w-4 accent-orange-600 cursor-pointer"
                    />
                  </td>
                  <td className="border px-4 py-2 text-center font-medium text-gray-700">
                    {from + index}
                  </td>

                  {columns.map((col) => {

                    if (col.isAction) {
                        return (
                            <td
                                key={col.key}
                                className={`border px-4 py-2 text-center text-gray-700 ${col.className || ''}`}
                            >
                                {renderActionButtons(row)}
                            </td>
                        );
                    }

                    if (CustomRenderer) {
                         return (
                             <td
                                 key={col.key}
                                 className={`border px-4 py-2 text-center text-gray-700 ${col.className || ''}`}
                             >
                                 <CustomRenderer item={row} column={col} />
                             </td>
                         );
                     }

                    return (
                        <td
                            key={col.key}
                            className={`border px-4 py-2 text-center text-gray-700 ${col.className || ''}`}
                        >
                          {col.isImage ? (
                            <div className="flex justify-center">
                              {row[col.key] ? (
                                <img
                                  src={row[col.key]}
                                  alt="Logo"
                                  className="h-20 w-20 rounded-lg object-contain"
                                />
                              ) : (
                                <span className="text-gray-400 italic">
                                  No logo provided
                                </span>
                              )}
                            </div>
                          ) : col.type === 'multi-values' && Array.isArray(row[col.key]) ? (
                            <div className="flex flex-wrap justify-center gap-1">
                              {row[col.key].map((permission: any, i: number) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="bg-orange-100 text-orange-700"
                                >
                                  {permission.label || permission.name}
                                </Badge>
                              ))}
                            </div>
                          ) : col.type === 'currency' ? (
                            <span className="font-mono">
                                KSH {(row[col.key] ?? 0.00).toFixed(2)}
                            </span>
                          ) : col.type === 'boolean' ? (
                            <div className="flex justify-center">
                                {row[col.key] ? (
                                    <Badge className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1">
                                        <CheckCircle size={14} /> Active
                                    </Badge>
                                ) : (
                                    <Badge className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-1">
                                        <Ban size={14} /> Inactive
                                    </Badge>
                                )}
                            </div>
                          ) :
                          (
                            (row[col.key] ?? (
                              <span className="text-gray-400 italic">—</span>
                            ))
                          )}
                        </td>
                    );
                  })}
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={columns.length + 2}
                className="text-md py-6 text-center font-semibold text-orange-500"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      {selectedRows.length > 0 && (
        <div className="p-3 border-t bg-orange-50 text-sm text-orange-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>{selectedRows.length} row(s) selected</span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="border-orange-400 text-orange-700">
                  Bulk Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {onBulkExportPDF && (
                    <DropdownMenuItem onClick={handleBulkExportPDFClick}>
                        Export selected (PDF)
                    </DropdownMenuItem>
                )}
                {onBulkExportExcel && (
                    <DropdownMenuItem onClick={handleBulkExportExcelClick}>
                        Export selected (Excel)
                    </DropdownMenuItem>
                )}
                {onBulkDelete && (
                    <DropdownMenuItem onClick={handleBulkDeleteClick}>
                        Delete selected
                    </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <Button
              variant="outline"
              className="border-orange-400 text-orange-700 hover:bg-orange-100"
              onClick={() => setSelectedRows([])}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTable;
