'use client';

import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { Input } from './ui/input';

interface TagInputProps {
  value?: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({ 
  value = [], 
  onChange,
  placeholder = 'Add tags...'
}) => {
  const [tags, setTags] = useState<string[]>(value);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    const trimmedInput = input.trim().toLowerCase();
    
    if (!trimmedInput) return;
    if (tags.some(tag => tag.toLowerCase() === trimmedInput)) return;
    
    const newTags = [...tags, trimmedInput];
    setTags(newTags);
    setInput('');
    onChange?.(newTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
    onChange?.(newTags);
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-700 text-white text-sm font-medium"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:bg-gray-600 rounded-full p-0.5 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{tags.length} tags added</p>
    </div>
  );
};

export default TagInput;