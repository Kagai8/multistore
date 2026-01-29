/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react'; // 🟢 Added useMemo
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
// 🟢 Added Arrow icons
import { MoreHorizontal, Eye, X, CheckCircle, Ban, Clock, RotateCw, Check, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { hasPermission } from '@/utilis/authorization';

interface AuthPageProps {
  [key: string]: any;
  auth: {
    permissions: string[];
  };
}

interface TableColumn {
  label: string;
  key: string;
  isImage?: boolean;
  isAction?: boolean;
  className?: string;
  type?: string | 'multi-values' | 'tag-array' | 'boolean' | 'currency' | 'tag-status' | 'date-time';
  defaultHidden?: boolean;
  isMandatory?: boolean;
  conditionalClass?: (row: TableRow) => string;
  component?: React.ComponentType<{ data: TableRow }>;
  sortable?: boolean; // 🟢 NEW: Enable sorting for specific columns
}

interface ActionConfig {
  label: string;
  icon: any;
  route?: string;
  className?: string;
  permission?: string;
  conditionKey?: string;
  conditionValue?: string | number;
  conditionKeys?: string[];
  conditionValues?: (string | number)[];
  condition?: (row: TableRow, currentUserContext: any) => boolean;
  tooltip?: string;
}

interface TableRow {
  [key: string]: any;
  id: number;
}

interface CustomTableProps {
  moduleName: string;
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
  onDateFilterChange?: (from: string | null, to: string | null) => void;
  isModal?: boolean;
  onCustomAction?: (label: string, row: TableRow) => void;
  bulkDeletePermission?: string;
  bulkExportPdfPermission?: string;
  bulkExportExcelPermission?: string;
  importPermission?: string;
  downloadTemplatePermission?: string;
  onSelectionChange?: (ids: number[]) => void;
  // 🟢 NEW: Optional server-side sort handler.
  // If not provided, sorting happens client-side on the current page data.
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
}

const getNestedValue = (obj: any, key: string): any => {
  if (!obj || !key) return null;
  return key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
};

export const ComplexTable: React.FC<CustomTableProps> = ({
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
  onDateFilterChange,
  onCustomAction,
  importPermission,
  downloadTemplatePermission,
  onSelectionChange,
  onSort, // 🟢 NEW
}) => {
  const { auth } = usePage<AuthPageProps>().props;
  const permissions: string[] = auth.permissions || [];
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  // 🟢 NEW: Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    columns.reduce((acc, column) => {
      acc[column.key] = column.isAction || column.isImage || !column.defaultHidden;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggleColumnVisibility = (key: string) => {
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleColumns = columns.filter((column) => columnVisibility[column.key]);

  // 🟢 NEW: Sorting Logic
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';

    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });

    // If parent provided a handler, call it (Server-side sort)
    if (onSort) {
      onSort(key, direction);
    }
  };

  // 🟢 NEW: Processed Data (Handles Client-Side Sorting if onSort is missing)
  const displayData = useMemo(() => {
    // If onSort exists, we assume data passed in prop is already sorted by server
    if (onSort || !sortConfig) return data;

    // Otherwise, sort the current page data locally
    return [...data].sort((a, b) => {
      const valA = getNestedValue(a, sortConfig.key);
      const valB = getNestedValue(b, sortConfig.key);

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig, onSort]);

  const allSelected = displayData.length > 0 && selectedRows.length === displayData.length;

  const toggleSelectAll = () => {
    const newSelection = allSelected ? [] : displayData.map((row) => row.id);
    setSelectedRows(newSelection);
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  };

  const toggleRowSelect = (id: number) => {
    const newSelection = selectedRows.includes(id)
      ? selectedRows.filter((rid) => rid !== id)
      : [...selectedRows, id];

    setSelectedRows(newSelection);
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  };

  const renderActionButtons = (row: TableRow) => {
    const { inventoryConfig } = usePage<any>().props;
    const currentUserContext = inventoryConfig?.userContext || null;

    const permittedActions = actions.filter(action => {
      if (action.permission && !hasPermission(permissions, [action.permission])) {
        return false;
      }

      if (typeof action.condition === 'function') {
        return action.condition(row, currentUserContext);
      }

      if (action.conditionKeys && action.conditionValues) {
        if (action.conditionKeys.length !== action.conditionValues.length) {
          return false;
        }
        return action.conditionKeys.every((key, i) => {
          const rowValue = getNestedValue(row, key);
          return rowValue === action.conditionValues![i];
        });
      }

      if (action.conditionKey && action.conditionValue !== undefined) {
        const rowValue = getNestedValue(row, action.conditionKey);
        return rowValue === action.conditionValue;
      }

      return true;
    });

    const mainActions = permittedActions.filter(a => !['Export PDF', 'Export Excel'].includes(a.label));
    const moreActions = permittedActions.filter(a => ['Export PDF', 'Export Excel'].includes(a.label));

    if (mainActions.length === 0 && moreActions.length === 0) return null;

    return (
      <div className="flex justify-center items-center gap-1">
        {mainActions.map((action, index) => {
          const IconComponent = action.icon as React.ElementType;
          const isDisabled = false;

          const handleClick = action.label === 'View'
            ? () => onView?.(row)
            : action.label === 'Edit'
            ? () => onEdit?.(row)
            : action.label === 'Delete'
            ? () => onDelete?.(row)
            : () => onCustomAction?.(action.label, row);

          return (
            <Button
              key={index}
              size="sm"
              className={action.className}
              title={action.tooltip}
              onClick={handleClick}
              disabled={isDisabled}
            >
              {IconComponent && <IconComponent size={18} />}
            </Button>
          );
        })}
        {moreActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-100">
                <MoreHorizontal size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {moreActions.map((action, index) => {
                const IconComponent = action.icon as React.ElementType;
                const handleClick = action.label === 'Export PDF'
                  ? () => onExportPDF?.(row)
                  : action.label === 'Export Excel'
                  ? () => onExportExcel?.(row)
                  : () => onCustomAction?.(action.label, row);
                return (
                  <DropdownMenuItem key={index} onSelect={handleClick} className="flex items-center gap-2 cursor-pointer">
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
    if (onSelectionChange) onSelectionChange([]);
  };

  const handleBulkExportPDFClick = () => {
    if (selectedRows.length === 0) return;
    if (onBulkExportPDF) onBulkExportPDF(selectedRows);
  };

  const handleBulkExportExcelClick = () => {
    if (selectedRows.length === 0) return;
    if (onBulkExportExcel) onBulkExportExcel(selectedRows);
  };

  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => setDateFrom(e.target.value);
  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => setDateTo(e.target.value);
  const handleApplyDateFilter = () => {
    if (onDateFilterChange) onDateFilterChange(dateFrom || null, dateTo || null);
  };
  const handleResetDateFilter = () => {
    setDateFrom('');
    setDateTo('');
    if (onDateFilterChange) onDateFilterChange(null, null);
  };

  const moduleSlug = moduleName.toLowerCase().replace(/\s+/g, '_');
  const requiredTemplatePerm = downloadTemplatePermission || `${moduleSlug}_download_template`;
  const requiredImportPerm = importPermission || `${moduleSlug}_import`;
  const canDownloadTemplate = onDownloadTemplate && hasPermission(permissions, [requiredTemplatePerm]);
  const canImport = onFileSelected && hasPermission(permissions, [requiredImportPerm]);
  const canBulkExportPdf = !!onBulkExportPDF;
  const canBulkExportExcel = !!onBulkExportExcel;
  const canBulkDelete = !!onBulkDelete;
  const anyBulkActionAvailable = canBulkExportPdf || canBulkExportExcel || canBulkDelete;

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-md">
      <div className="flex justify-between items-center p-3 border-b bg-orange-50">
        <h3 className="text-lg font-semibold text-orange-700">{moduleName}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 border-r pr-2 border-gray-200">
            <input type="date" value={dateFrom} onChange={handleDateFromChange} className="border rounded-md h-9 px-2 text-sm border-gray-300 focus:ring-1 focus:ring-orange-500" />
            <span className="text-gray-600">to</span>
            <input type="date" value={dateTo} onChange={handleDateToChange} className="border rounded-md h-9 px-2 text-sm border-gray-300 focus:ring-1 focus:ring-orange-500" />
            {onDateFilterChange && (
              <>
                <Button size="sm" className="h-9 bg-orange-600 hover:bg-orange-700 text-white" onClick={handleApplyDateFilter} disabled={!dateFrom && !dateTo}>
                  Filter
                </Button>
                {(dateFrom || dateTo) && (
                  <Button size="sm" variant="outline" className="h-9 text-gray-500 hover:bg-gray-100" onClick={handleResetDateFilter}>
                    <X size={16} />
                  </Button>
                )}
              </>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="ml-2 border-gray-300 text-gray-700 hover:bg-gray-100">
                <Eye className="mr-2 h-4 w-4" /> View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuCheckboxItem key={column.key} className="capitalize cursor-pointer" checked={!!columnVisibility[column.key]} onCheckedChange={() => toggleColumnVisibility(column.key)} disabled={column.isAction || column.isImage}>
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {canDownloadTemplate && (
            <Button size="sm" variant="outline" className="border-orange-400 text-orange-700 hover:bg-orange-100" onClick={onDownloadTemplate}>
              Download Template
            </Button>
          )}
          {canImport && (
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => document.getElementById('import-file-input')?.click()}>
              Import Excel/CSV
            </Button>
          )}
          {canImport && (
            <input type="file" id="import-file-input" accept=".xlsx, .csv" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onFileSelected(file);
                e.target.value = '';
              }
            }} />
          )}
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-orange-600 text-white">
              <th className="p-4 border text-center">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 accent-orange-600 cursor-pointer" />
              </th>
              <th className="p-4 border text-center">#</th>
              {visibleColumns.map((column) => (
                // 🟢 UPDATED: Header cell with sorting
                <th
                  key={column.key}
                  className={`p-4 border text-center font-semibold ${column.className || ''} ${column.sortable ? 'cursor-pointer hover:bg-orange-700 transition-colors' : ''}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center justify-center gap-1">
                    {column.label}
                    {column.sortable && (
                        <span className="opacity-80">
                          {sortConfig?.key === column.key ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-50" />
                          )}
                        </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.length > 0 ? ( // 🟢 UPDATED: Use displayData
              displayData.map((row, index) => {
                const isSelected = selectedRows.includes(row.id);
                const rowConditionalClass = visibleColumns.map(col => col.conditionalClass?.(row) || '').join(' ');
                return (
                  <tr key={row.id} className={`transition-colors ${isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'} ${rowConditionalClass}`}>
                    <td className="border px-4 py-2 text-center">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleRowSelect(row.id)} className="h-4 w-4 accent-orange-600 cursor-pointer" />
                    </td>
                    <td className="border px-4 py-2 text-center font-medium text-gray-700">{from + index}</td>
                    {visibleColumns.map((col) => {
                      const cellValue = getNestedValue(row, col.key);
                      return (
                        <td key={col.key} className={`border px-6 py-3 text-center text-gray-700 ${col.className || ''}`}>
                          {col.isImage ? (
                            <div className="flex justify-center">
                              {cellValue ? (
                                <img
                                    src={
                                        typeof cellValue === 'string'
                                        ? (cellValue.startsWith('http') || cellValue.startsWith('/storage/')
                                            ? cellValue
                                            : `/storage/${cellValue.replace(/^storage\//, '')}`)
                                        : ''
                                    }
                                    alt="Image"
                                    className="h-20 w-20 rounded-lg object-contain"
                                />
                              ) : (
                                <span className="text-gray-400 italic">No image provided</span>
                              )}
                            </div>
                          ) : col.isAction ? (
                            renderActionButtons(row)
                          ) : col.component ? (
                            <col.component data={row} />
                          ) : col.type === 'multi-values' && Array.isArray(cellValue) ? (
                            <div className="flex flex-wrap justify-center gap-1">
                              {cellValue.map((item: { label: string; name: string } | string, i: number) => (
                                <Badge key={i} variant="secondary" className="bg-orange-100 text-orange-700">
                                  {typeof item === 'object' ? (item.label || item.name) : item}
                                </Badge>
                              ))}
                            </div>
                          ) : col.type === 'tag-array' && Array.isArray(cellValue) ? (
                            <div className="flex flex-wrap justify-center gap-1">
                              {(cellValue as string[]).map((tag: string, i: number) => (
                                <Badge key={i} variant="secondary" className="bg-orange-600 text-white">{tag}</Badge>
                              ))}
                            </div>
                          ) : col.type === 'currency' ? (
                            <span className="font-mono">KSh {Number(cellValue ?? 0).toFixed(2)}</span>
                          ) : col.type === 'boolean' ? (
                            <div className="flex justify-center">
                              {cellValue ? (
                                <Badge className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1"><CheckCircle size={14} /> Active</Badge>
                              ) : (
                                <Badge className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-1"><Ban size={14} /> Inactive</Badge>
                              )}
                            </div>
                          ) : col.type === 'tag-status' ? (
                            <div className="flex justify-center">
                              {(() => {
                                const status = String(cellValue).toLowerCase();
                                switch (status) {
                                  case 'completed':
                                  case 'posted':
                                  case 'received':
                                  case 'approved':
                                  case 'paid' :
                                    return <Badge className="bg-green-600 hover:bg-green-700 text-white font-medium capitalize flex items-center gap-1"><Check size={14} /> {status}</Badge>;
                                  case 'pending':
                                  case 'draft':
                                    case 'void':
                                    return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium capitalize flex items-center gap-1"><Clock size={14} /> {status}</Badge>;
                                  case 'in_progress':
                                  case 'in-progress':
                                  case 'sent':
                                    case 'partial':
                                    return <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-medium capitalize flex items-center gap-1"><RotateCw size={14} /> {status.replace('_', ' ')}</Badge>;
                                  case 'cancelled':
                                  case 'failed':
                                    case 'denied':
                                    case 'rejected':
                                    case 'unpaid':
                                    return <Badge className="bg-red-600 hover:bg-red-700 text-white font-medium capitalize flex items-center gap-1"><X size={14} /> {status}</Badge>;
                                  default:
                                    return <Badge variant="secondary" className="bg-gray-200 text-gray-700 font-medium capitalize">{status}</Badge>;
                                }
                              })()}
                            </div>
                          ) : col.type === 'date-time' ? (
                            cellValue ? (() => {
                              try {
                                const date = new Date(cellValue);
                                if (isNaN(date.getTime())) return <span className="text-red-500 italic">Invalid Date</span>;
                                return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                              // eslint-disable-next-line @typescript-eslint/no-unused-vars
                              } catch (e) {
                                return <span className="text-red-500 italic">Error</span>;
                              }
                            })() : <span className="text-gray-400 italic">Not provided</span>
                          ) : (
                            (cellValue ?? <span className="text-gray-400 italic">Not provided</span>)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="text-md py-6 text-center font-semibold text-orange-500">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {selectedRows.length > 0 && anyBulkActionAvailable && (
        <div className="p-3 border-t bg-orange-50 text-sm text-orange-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>{selectedRows.length} row(s) selected</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="border-orange-400 text-orange-700">Bulk Actions</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {canBulkExportPdf && <DropdownMenuItem onSelect={handleBulkExportPDFClick} className="cursor-pointer">Export selected (PDF)</DropdownMenuItem>}
                {canBulkExportExcel && <DropdownMenuItem onSelect={handleBulkExportExcelClick} className="cursor-pointer">Export selected (Excel)</DropdownMenuItem>}
                {canBulkDelete && <DropdownMenuItem onSelect={handleBulkDeleteClick} className="cursor-pointer">Delete selected</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div>
            <Button variant="outline" className="border-orange-400 text-orange-700 hover:bg-orange-100" onClick={() => {
                setSelectedRows([]);
                if (onSelectionChange) onSelectionChange([]);
            }}>
                Clear Selection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplexTable;
