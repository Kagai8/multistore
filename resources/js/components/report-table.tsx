/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
    Eye, ArrowUpDown, FileText, Download, Settings2
} from 'lucide-react';

interface TableColumn {
  label: string;
  key: string;
  className?: string;
  type?: 'multi-values' | 'tag-array' | 'currency' | 'tag-status' | 'date-time' | 'number';
  defaultHidden?: boolean;
  sortable?: boolean;
  isTotalable?: boolean;
  isAction?: boolean; // 🟢 New: Flag for the action column
}

interface TableAction {
  label: string;
  icon: any;
  className?: string;
  permission?: string;
  condition?: (row: any) => boolean;
}

interface ReportTableProps {
  moduleName: string;
  columns: TableColumn[];
  actions?: TableAction[]; // 🟢 New: Direct support for config actions
  data: any[];
  from?: number;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onCustomAction?: (label: string, row: any) => void;
}

const getNestedValue = (obj: any, key: string): any => {
  if (!obj || !key) return null;
  return key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
};

export const ReportTable: React.FC<ReportTableProps> = ({
  moduleName,
  columns,
  actions = [],
  data = [],
  from = 1,
  onSort,
  onExportPDF,
  onExportExcel,
  onCustomAction
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => {
      acc[col.key] = !col.defaultHidden;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const visibleColumns = columns.filter((col) => columnVisibility[col.key]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
    if (onSort) onSort(key, direction);
  };

  // Aggregation Logic for BI Footers
  const totals = useMemo(() => {
    const results: Record<string, number> = {};
    columns.forEach(col => {
      if (col.isTotalable) {
        results[col.key] = data.reduce((acc, row) => {
          const val = parseFloat(getNestedValue(row, col.key));
          return acc + (isNaN(val) ? 0 : val);
        }, 0);
      }
    });
    return results;
  }, [data, columns]);

  return (
    <div className="w-full flex flex-col">
      {/* Table Toolbar */}
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <div className="flex items-center gap-2">
           <div className="p-2 bg-orange-100 rounded-lg">
             <FileText className="text-orange-600" size={18} />
           </div>
           <span className="font-bold text-orange-700">{moduleName}</span>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="mr-2 h-4 w-4" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {columns.map(col => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={columnVisibility[col.key]}
                  onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, [col.key]: !!checked }))}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={onExportExcel} className="text-green-700">
            <Download className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={onExportPDF} className="text-red-700">
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-orange-50 text-orange-600 uppercase text-[11px] font-bold tracking-wider">
            <tr>
              <th className="p-4 border-b border-r w-12 text-center">#</th>
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`p-4 border-b border-r last:border-r-0 ${col.sortable ? 'cursor-pointer hover:bg-orange-100' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && <ArrowUpDown size={12} className="text-orange-400" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-orange-200">
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-orange-50/80 transition-colors group">
                  <td className="p-4 text-center text-orange-400 border-r">{from + idx}</td>
                  {visibleColumns.map((col) => {
                    const value = getNestedValue(row, col.key);

                    // 🟢 Handle Action Column Rendering
                    if (col.isAction) {
                        return (
                          <td key={col.key} className="p-4 border-r last:border-r-0 text-center">
                            <div className="flex items-center justify-center gap-1">
                                {actions.map((action, aIdx) => {
                                    const Icon = action.icon;
                                    const isVisible = action.condition ? action.condition(row) : true;
                                    if (!isVisible) return null;

                                    return (
                                        <button
                                            key={aIdx}
                                            onClick={() => onCustomAction?.(action.label, row)}
                                            className={action.className || "p-1.5 hover:bg-orange-200 rounded text-orange-600"}
                                            title={action.label}
                                        >
                                            <Icon size={16} />
                                        </button>
                                    );
                                })}
                            </div>
                          </td>
                        );
                    }

                    return (
                      <td key={col.key} className={`${col.className || 'p-4 border-r last:border-r-0'}`}>
                        {col.type === 'currency' ? (
                          <span className="font-mono">
                            KSh {Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        ) : col.type === 'date-time' ? (
                          <span className="text-orange-500 whitespace-nowrap">
                            {value ? new Date(value).toLocaleDateString('en-GB') : '—'}
                          </span>
                        ) : value ?? '—'}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-20 text-center text-orange-400 italic bg-orange-50/30">
                  No data points available for the selected filters.
                </td>
              </tr>
            )}
          </tbody>

          {/* Aggregates Footer */}
          {data.length > 0 && (
            <tfoot className="bg-orange-100/80 font-bold border-t-2 border-orange-200">
              <tr>
                <td className="p-4 text-right text-orange-500 uppercase text-[10px]" colSpan={1}>Totals</td>
                {visibleColumns.map((col) => (
                  <td key={col.key} className={`p-4 border-r last:border-r-0 ${col.className?.includes('text-right') ? 'text-right' : 'text-center'}`}>
                    {col.isTotalable ? (
                      col.type === 'currency'
                        ? `KSh ${totals[col.key].toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : totals[col.key].toLocaleString()
                    ) : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default ReportTable;
