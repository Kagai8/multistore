import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface Option {
  label: string;
  value: string | number;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Normalize value for comparison
  const normalizedValue = value?.toString();

  // Find label for display
  const selectedLabel = options.find((option) => option.value.toString() === normalizedValue)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !normalizedValue && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {/* 🟢 FIX: Added w-[--radix-popover-trigger-width] to ensure dropdown matches button width */}
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          {/* 🟢 FIX: Added max-h and overflow to allow mouse scrolling */}
          <CommandList className="max-h-[250px] overflow-y-auto">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // Filtering relies on this label
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      normalizedValue === option.value.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
