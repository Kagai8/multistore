/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import { usePage } from '@inertiajs/react';
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
// 🟢 NEW: Import the custom component
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from './ui/checkbox';
import TagInput from './ui/tag-input';
import { hasPermission } from '@/utilis/authorization';

// --- TYPES ---

interface FieldProps {
  id: string;
  key: string;
  name: string;
  label: string;
  // 🟢 NEW: Added 'searchable-select' to the type union
  type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'file' | 'multi-file' | 'single-select' | 'searchable-select' | 'multi-select' | 'checkbox' | 'tag-input' | 'hidden' | 'date';
  placeholder?: string;
  autocomplete?: string;
  tabIndex?: number;
  autoFocus?: boolean;
  rows?: number;
  accept?: string;
  className?: string;
  optionsSource?: string;
  colSpan?: number;
  disabled?: boolean | ((mode: 'create' | 'view' | 'edit', currentUserContext?: UserContext | null, data?: Record<string, any>) => boolean);
}

interface FieldGroup {
  header: string;
  fields: FieldProps[];
  columns: number;
}

interface UserContext {
    store_id: number | null;
    is_global_user: boolean;
}

interface ButtonProps {
  key: string;
  type?: 'button' | 'submit' | 'reset';
  label: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive';
  className?: string;
}

interface ExtraData {
  [key: string]: Array<{ id: number; name: string }> | Record<string, any>;
}

interface AddButtonProps {
    id: string;
    label: string;
    icon: React.ElementType;
    type: string;
    variant: string;
    className: string;
    permission: string;
}

interface CustomModalFormProps {
  title: string;
  description?: string;
  fields: FieldGroup[];
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
  multiImagePreviews?: string[];
  setMultiImagePreviews: React.Dispatch<React.SetStateAction<string[] | undefined>>;
  extraData?: ExtraData;
  addButton?: AddButtonProps;
  children?: React.ReactNode;
  currentUserContext?: UserContext | null;
}

interface AuthPageProps {
    [key: string]: any;
    auth: {
        permissions: string[];
    };
    flash?: {
        success?: string;
        error?: string;
    };
}
// --- END TYPES ---


const getGridClass = (columns: number) => {
  switch (columns) {
    case 4: return 'grid-cols-1 sm:grid-cols-4';
    case 3: return 'grid-cols-1 sm:grid-cols-3';
    case 2: return 'grid-cols-1 sm:grid-cols-2';
    default: return 'grid-cols-1';
  }
};

export const ComplexModalForm: React.FC<CustomModalFormProps> = ({
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
  multiImagePreviews,
  setMultiImagePreviews,
  extraData,
  children,
  currentUserContext,
}) => {
    const { auth } = usePage<AuthPageProps>().props;
    const permissions = auth.permissions || [];

  const optionsMap = useMemo(() => {
    const map: Record<string, { label: string; value: string; key: string }[]> = {};
    if (extraData) {
      Object.keys(extraData).forEach(key => {
        const dataItem = extraData[key];

        if (Array.isArray(dataItem)) {
            map[key] = dataItem.map(item => ({
              label: item.name,
              value: String(item.id),
              key: String(item.id),
            }));
        }
      });
    }
    return map;
  }, [extraData]);

  const handleSingleFileChange = (field: FieldProps, e: React.ChangeEvent<HTMLInputElement>) => {
    setData(field.name, e.target.files ? e.target.files[0] : null);
    if (e.target.files && e.target.files[0]) {
        setData('main_image_cleared', false);
    }
  };

  const handleDeleteMultiImage = (pathToDelete: string) => {
    const newPathsToKeep = (data['existing_multi_images'] || [])
        .filter((path: string) => path !== pathToDelete);

    setData('existing_multi_images', newPathsToKeep);
    setMultiImagePreviews(prev => (prev || []).filter(path => path !== pathToDelete));
  };

  const handleMultiFileChange = (field: FieldProps, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setData(field.name, Array.from(e.target.files));
    } else {
      setData(field.name, []);
    }
  };

  const renderField = (field: FieldProps) => {
    const hidePassword = field.type === 'password' && mode !== 'create';
    if (hidePassword) return null;
    if (field.type === 'hidden') return null;

    const defaultDisabled = processing || mode === 'view';

    const configDisabled = typeof field.disabled === 'function'
                            ? field.disabled(mode, currentUserContext, data)
                            : field.disabled;

    const isDisabled = defaultDisabled || configDisabled;
    const colClass = field.colSpan ? `sm:col-span-${field.colSpan}` : 'sm:col-span-1';

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
        ) : field.type === 'checkbox' ? (
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id={field.id}
              name={field.name}
              checked={!!data[field.name]}
              onCheckedChange={(checked) => setData(field.name, checked)}
              disabled={isDisabled}
            />
            <Label htmlFor={field.id} className="text-sm font-normal text-gray-500">
                {field.placeholder}
            </Label>
          </div>
        ) : field.type === 'single-select' ? (
          <Select
            disabled={isDisabled}
            value={String(data[field.name]) || ''}
            onValueChange={(v) => setData(field.name, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {(optionsMap[field.optionsSource as string] ?? []).map((option) => (
                <SelectItem value={option.value} key={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        // 🟢 NEW: Searchable Select Implementation
        ) : field.type === 'searchable-select' ? (
           <SearchableSelect
              options={optionsMap[field.optionsSource as string] ?? []}
              value={data[field.name]}
              onChange={(val) => setData(field.name, val)}
              placeholder={`Select ${field.label}`}
              disabled={isDisabled}
           />
        ) : field.type === 'file' ? (
          <div className="space-y-2">
            {(mainImagePreview || data[field.name] instanceof File) && (
              <div className="flex flex-col gap-2">
                 <img
                    src={data[field.name] instanceof File
                        ? URL.createObjectURL(data[field.name])
                        : mainImagePreview || ''}
                    alt={field.label}
                    className="h-32 w-32 rounded object-contain border p-1"
                 />
                 {mainImagePreview && mode !== 'view' && (
                    <Button
                        type="button"
                        onClick={() => setData('main_image_cleared', true)}
                        variant="destructive"
                        size="sm"
                        className="w-fit"
                    >
                        Remove Existing Image
                    </Button>
                 )}
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
                disabled={processing || configDisabled}
              />
            )}
            <InputError message={errors?.['main_image_cleared']} />
          </div>
        ) : field.type === 'multi-file' ? (
          <div className="space-y-2">
            {((multiImagePreviews && multiImagePreviews.length > 0) || (data[field.name] && data[field.name].length > 0)) && (
              <div className="flex flex-wrap gap-2 p-2 border rounded">
                {(multiImagePreviews || []).map((src, index) => {
                    const srcString = typeof src === 'string' ? src : '';
                    const finalSrc = srcString.startsWith('/storage/') ? srcString : `/storage/${srcString.replace(/^storage\//, '')}`;

                    return (
                        <div key={`old-img-${index}`} className="relative h-20 w-20">
                            <img
                                src={finalSrc}
                                alt={`Image ${index + 1}`}
                                className="h-full w-full rounded object-cover border"
                            />
                            {mode !== 'view' && (
                                <button
                                    type="button"
                                    onClick={() => handleDeleteMultiImage(src)}
                                    className="absolute top-0 right-0 p-1 bg-red-600 rounded-full text-white text-xs hover:bg-red-700 transition-colors"
                                    title="Remove image"
                                >
                                    ❌
                                </button>
                            )}
                        </div>
                    );
                })}
                {Array.isArray(data[field.name]) && data[field.name].map((file: File, index: number) => {
                    if (file instanceof File) {
                      return <img key={`new-img-${index}`} src={URL.createObjectURL(file)} alt={`New Image ${index + 1}`} className="h-20 w-20 rounded object-cover border border-dashed border-green-500" />;
                    }
                    return null;
                })}
              </div>
            )}
            {mode !== 'view' && (
              <Input
                id={field.id}
                name={field.name}
                type="file"
                multiple
                accept={field.accept}
                tabIndex={field.tabIndex}
                onChange={(e) => handleMultiFileChange(field, e as React.ChangeEvent<HTMLInputElement>)}
                disabled={processing || configDisabled}
              />
            )}
          </div>
        ) : field.type === 'tag-input' ? (
          <TagInput
            id={field.id}
            name={field.name}
            placeholder={field.placeholder}
            value={JSON.stringify(data[field.name] || [])}
            onChange={setData}
            isDisabled={isDisabled}
          />
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
            className={field.className}
          />
        )}

        <InputError message={errors?.[field.name]} />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
    {addButton && (!addButton.permission || hasPermission(permissions, [addButton.permission])) && (
        <DialogTrigger asChild>
        <Button
            type={addButton.type as any}
            className={addButton.className}
            variant={addButton.variant as any}
        >
            {addButton.icon && React.createElement(addButton.icon, { className: 'me-2' })}
            {addButton.label}
        </Button>
        </DialogTrigger>
    )}

    <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mb-2">

        {(fields ?? []).map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-3 p-4 border rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold border-b pb-2 mb-3 text-orange-600 dark:text-orange-400">
                    {group.header}
                </h3>

                <div className={`grid gap-4 ${getGridClass(group.columns)}`}>
                    {(group.fields ?? []).map(renderField)}
                </div>
            </div>
        ))}

        {children}

        <DialogFooter className="sticky bottom-0 bg-white dark:bg-gray-900 border-t pt-4 z-10">
           {buttons.map((btn) => {
            if (btn.key === 'cancel') {
                return (
                <DialogClose asChild key={btn.key}>
                    <Button
                    type={btn.type as any}
                    variant={btn.variant as any}
                    className={btn.className}
                    disabled={processing}
                    >
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

export default ComplexModalForm;
