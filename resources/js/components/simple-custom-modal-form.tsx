/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from './input-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from './ui/checkbox';
import { usePage } from '@inertiajs/react';
import { hasPermission } from '@/utilis/authorization';

// 🟢 NEW: Define the type-safe structure for the shared Inertia props
interface AuthPageProps {
  [key: string]: any;
  auth: {
    permissions: string[];
  };
}
// --- END TYPES ---

interface AddButtonProps {
  id: string;
  label: string;
  className?: string;
  icon?: any;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive';
  permission?: string;
}

// Simplified FieldProps: We keep colSpan but it defaults to 1
interface FieldProps {
  id: string;
  key: string;
  name: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'email'
    | 'password'
    | 'textarea'
    | 'file'
    | 'single-select'
    | 'multi-select'
    | 'checkbox'
    | 'switch'
    | 'hidden'
    | 'grouped-checkboxes';
  placeholder?: string;
  autocomplete?: string;
  tabIndex?: number;
  autoFocus?: boolean;
  rows?: number;
  accept?: string;
  className?: string;
  optionsSource?: string;
  colSpan?: number;
  // 🟢 Hardcoded options
  options?: Array<{ id: string; name: string }>;
}

interface ButtonProps {
  key: string;
  type?: 'button' | 'submit' | 'reset';
  label: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive';
  className?: string;
}

interface ExtraData {
  [module: string]: Array<{ id: number; name: string }>;
}

interface SimpleModalFormProps {
  title: string;
  description?: string;
  fields: FieldProps[];
  buttons: ButtonProps[];
  data: Record<string, any>;
  setData: (name: string, value: any) => void;
  processing?: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  errors?: Record<string, any>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'view' | 'edit';
  mainImagePreview?: string | null;
  extraData?: ExtraData;
  addButton?: AddButtonProps;
}

// ✅ SAME SAFETY: normalize stored image paths into a loadable URL
// Accepts:
// - "products/main/x.jpg"
// - "storage/products/main/x.jpg"
// - "/storage/products/main/x.jpg"
// - "http(s)://..."
// - "blob:..."
const toStorageUrl = (src?: string | null) => {
  if (!src) return '';
  if (src.startsWith('blob:') || src.startsWith('http') || src.startsWith('/storage/')) return src;
  return `/storage/${src.replace(/^storage\//, '').replace(/^\/+/, '')}`;
};

// Helper to get the Tailwind class for columns (fixed at 2 max for simple modal)
const getGridClass = (columns: number) => {
  switch (columns) {
    case 3:
      return 'grid-cols-1 sm:grid-cols-3';
    case 2:
      return 'grid-cols-1 sm:grid-cols-2';
    default:
      return 'grid-cols-1';
  }
};

export const SimpleModalForm: React.FC<SimpleModalFormProps> = ({
  addButton,
  title,
  description,
  fields,
  buttons,
  data,
  setData,
  processing = false,
  handleSubmit,
  errors = {},
  open,
  onOpenChange,
  mode = 'create',
  mainImagePreview,
  extraData,
}) => {
  const { auth } = usePage<AuthPageProps>().props;
  const permissions: string[] = auth.permissions || [];

  const requiredPermission = addButton?.permission;
  const canAdd = addButton && (!requiredPermission || hasPermission(permissions, [requiredPermission]));

  // Memoize Select Options based on extraData
  const optionsMap = useMemo(() => {
    const map: Record<string, { label: string; value: string; key: string }[]> = {};
    if (extraData) {
      Object.keys(extraData).forEach((key) => {
        map[key] = (extraData[key] ?? []).map((item) => ({
          label: item.name,
          value: String(item.id),
          key: String(item.id),
        }));
      });
    }
    return map;
  }, [extraData]);

  // Handle single file change (for main_image)
  const handleSingleFileChange = (field: FieldProps, e: React.ChangeEvent<HTMLInputElement>) => {
    setData(field.name, e.target.files ? e.target.files[0] : null);
  };

  const renderField = (field: FieldProps) => {
    const hidePassword = field.type === 'password' && mode !== 'create';
    if (hidePassword) return null;
    if (field.type === 'hidden') return null;

    const isDisabled = processing || mode === 'view';

    const colClass = field.colSpan ? `sm:col-span-${field.colSpan}` : 'sm:col-span-1';

    const optionsToRender =
      field.options && field.options.length > 0
        ? field.options.map((o) => ({ value: o.id, key: o.id, label: o.name }))
        : optionsMap[field.optionsSource as string] ?? [];

    return (
      <div key={field.key} className={`grid gap-2 ${colClass}`}>
        <Label htmlFor={field.id}>{field.label}</Label>

        {field.type === 'textarea' ? (
          <Textarea
            id={field.id}
            name={field.name}
            placeholder={field.placeholder}
            rows={field.rows}
            autoComplete={field.autocomplete}
            tabIndex={field.tabIndex}
            onChange={(e) => setData(field.name, e.target.value)}
            value={data[field.name] || ''}
            disabled={isDisabled}
          />
        ) : field.type === 'checkbox' || field.type === 'switch' ? (
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id={field.id}
              name={field.name}
              checked={!!data[field.name]}
              onCheckedChange={(checked) => setData(field.name, checked)}
              disabled={isDisabled}
            />
            <Label htmlFor={field.id} className="text-sm font-normal text-gray-500">
              {field.label}
            </Label>
          </div>
        ) : field.type === 'single-select' ? (
          <Select
            disabled={isDisabled}
            value={String(data[field.name]) || ''}
            onValueChange={(v) => setData(field.name, String(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {optionsToRender.map((option) => (
                <SelectItem value={option.value} key={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === 'file' ? (
          <div className="space-y-2">
            {(mainImagePreview || data[field.name] instanceof File) && (
              <div className="flex flex-col gap-2">
                <img
                  // ✅ SAFETY HERE (existing image)
                  src={
                    data[field.name] instanceof File
                      ? URL.createObjectURL(data[field.name])
                      : toStorageUrl(mainImagePreview)
                  }
                  alt={field.label}
                  className="h-32 w-32 rounded object-contain border p-1"
                />
                <p className="text-xs text-gray-500">Current / New Image</p>
              </div>
            )}

            {mode !== 'view' && (
              <Input
                id={field.id}
                name={field.name}
                type="file"
                accept={field.accept}
                tabIndex={field.tabIndex}
                onChange={(e) => handleSingleFileChange(field, e as React.ChangeEvent<HTMLInputElement>)}
                disabled={processing}
              />
            )}
          </div>
        ) : field.type === 'grouped-checkboxes' ? (
          <div className="space-y-2">
            {extraData &&
              Object.entries(extraData).map(([module, perms]) => (
                <div key={module} className="mb-4 border-b pb-5">
                  <h4 className="capitalize text-sm font-bold text-gray-700">{module}</h4>

                  <div className="ms-4 mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {(perms as any[]).map((permission) => (
                      <label key={permission.name} className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          name={field.name}
                          disabled={isDisabled}
                          value={permission.name}
                          checked={data.permissions?.includes(permission.name)}
                          onChange={(e) => {
                            const value = permission.name;
                            const current = data.permissions || [];

                            if (e.target.checked) {
                              setData('permissions', [...current, value]);
                            } else {
                              setData('permissions', current.filter((p: string) => p !== value));
                            }
                          }}
                        />
                        <span>{permission.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <Input
            id={field.id}
            name={field.name}
            type={field.type as any}
            placeholder={field.placeholder}
            autoComplete={field.autocomplete}
            tabIndex={field.tabIndex}
            autoFocus={field.autoFocus}
            onChange={(e) => setData(field.name, e.target.value)}
            value={data[field.name] || ''}
            disabled={isDisabled}
          />
        )}

        <InputError message={errors?.[field.name]} />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      {canAdd && addButton && (
        <DialogTrigger asChild>
          <Button type={addButton.type as any} className={addButton.className} variant={addButton.variant as any}>
            {addButton.icon && React.createElement(addButton.icon, { className: 'me-2' })}
            {addButton.label}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mb-2">
          <div className={`grid gap-4 ${getGridClass(2)}`}>{(fields ?? []).map(renderField)}</div>

          <DialogFooter className="bg-white dark:bg-gray-900 border-t pt-4">
            {buttons.map((btn) => {
              if (btn.key === 'cancel') {
                return (
                  <DialogClose asChild key={btn.key}>
                    <Button type={btn.type as any} variant={btn.variant as any} className={btn.className} disabled={processing}>
                      {btn.label}
                    </Button>
                  </DialogClose>
                );
              }
              if (mode !== 'view') {
                return (
                  <Button
                    key={btn.key}
                    type={btn.type as any}
                    variant={btn.variant as any}
                    className={btn.className}
                    disabled={processing}
                  >
                    {btn.label}
                  </Button>
                );
              }
              return null;
            })}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleModalForm;
