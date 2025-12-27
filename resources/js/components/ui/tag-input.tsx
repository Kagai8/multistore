// resources/js/components/ui/tag-input.tsx (FINAL FIX)
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useCallback, KeyboardEvent, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface TagInputProps {
  id: string;
  name: string;
  value: string; // Expects a JSON string of a string array: '["Red", "Blue"]'
  onChange: (name: string, value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
}

// Helper to safely parse the JSON string value
const parseInitialTags = (jsonString: string): string[] => {
  try {
    if (jsonString && typeof jsonString === 'string') {
      const parsedTags = JSON.parse(jsonString);
      if (Array.isArray(parsedTags)) {
        return parsedTags.filter(t => typeof t === 'string' && t.trim() !== '');
      }
    }
  } catch (e) {
    return [];
  }
  return [];
};

const TagInput: React.FC<TagInputProps> = ({ id, name, value, onChange, placeholder, isDisabled = false }) => {

  // 1. Initialize state using the function initializer, which only runs on mount
  // The parent component's 'key' prop ensures this runs correctly when the modal opens/closes.
  const [tags, setTags] = useState<string[]>(() => parseInitialTags(value));

  // 2. Local state for the current input value
  const [inputValue, setInputValue] = useState('');

  // Function to add a tag
  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag) {
      setTags(currentTags => {
        if (currentTags.includes(trimmedTag)) return currentTags;
        const newTags = [...currentTags, trimmedTag];
        onChange(name, JSON.stringify(newTags));
        return newTags;
      });
    }
    setInputValue('');
  }, [name, onChange]);

  // Function to remove a tag
  const removeTag = useCallback((tagToRemove: string) => {
    setTags(currentTags => {
      const newTags = currentTags.filter(tag => tag !== tagToRemove);
      onChange(name, JSON.stringify(newTags));
      return newTags;
    });
  }, [name, onChange]);

  // Handler for Enter or Comma key press
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  // Handler for Backspace when input is empty (to remove last tag)
  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    if (e.key === 'Backspace' && inputValue === '') {
      e.preventDefault();
      if (tags.length > 0) {
        removeTag(tags[tags.length - 1]);
      }
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-wrap gap-2 p-2 border border-input rounded-md min-h-[40px] items-start">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center space-x-1 bg-orange-500">
            <span>{tag}</span>
            {!isDisabled && (
              <X
                className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
              />
            )}
          </Badge>
        ))}

        {/* The main input field */}
        <Input
          id={id}
          name={name}
          type="text"
          placeholder={tags.length === 0 ? placeholder : ''}
          value={inputValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleInputKeyDown}
          className="flex-1 min-w-[100px] border-none shadow-none focus-visible:ring-0 h-8 p-0"
          disabled={isDisabled}
        />
      </div>
      <p className="text-xs text-gray-500">Type a value and press Enter or Comma.</p>
    </div>
  );
};

export default TagInput;
