'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Input } from './ui/input'
import { client } from '@/api/client'
import { useDebounce } from '@/components/hooks/useDebounce'
import { toast } from 'sonner'

interface TagInputProps {
  value?: string[]
  onChange?: (tags: string[]) => void
  placeholder?: string
}

interface TagSuggestion {
  id: string
  name: string
}

const TagInput: React.FC<TagInputProps> = ({value = [], onChange, placeholder = 'Add tags...'}) => {
  const [tags, setTags] = useState<string[]>(value)
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debouncedInput = useDebounce(input, 1000)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if(!debouncedInput.trim()){
        const { data } = await client
          .from('tags')
          .select('id, name')
          .order('count', { ascending: false })
          .limit(5)
        
        setSuggestions(data || [])
        return
      }

      setLoading(true)
      try {
        const { data, error } = await client
          .from('tags')
          .select('id, name')
          .ilike('name', `%${debouncedInput}%`)
          .order('name', { ascending: false })
          .limit(5)

        if (error) throw error
        setSuggestions(data || [])
      } catch (error) {
        console.error('Error fetching tag suggestions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedInput, client])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const ensureTagExists = async (tagName: string): Promise<string> => {
    try {
      const { data: existingTag, error: fetchError } = await client
        .from('tags')
        .select('id, name')
        .ilike('name', tagName)
        .maybeSingle()

      if (fetchError) throw fetchError
      if(fetchError){
        toast.error('error fetching tag exists')
      }

      let newTag
      if(!existingTag){
        const { data , error: createError } = await client
          .from('tags')
          .insert({
            name: tagName,
            slug: tagName.toLowerCase().replaceAll(' ', '-'),
          })
          .select('name')
          .single()

        if (createError) throw createError
        if(createError){
          toast.error('error creating new tag')
        }
        newTag = data
      }
      return newTag?.name;
      
    } catch (error) {
      console.error('Error ensuring tag exists:', error)
      return tagName
    }
  }

  const handleAddTag = async () => {
    const trimmedInput = input.trim().toLowerCase()
    
    if (!trimmedInput) return
    if (tags.some(tag => tag.toLowerCase() === trimmedInput)) {
      return
    }

    setLoading(true)
    try {
      const tagName = await ensureTagExists(trimmedInput)
      
      const newTags = [...tags, tagName]
      setTags(newTags)
      setInput('')
      setShowSuggestions(false)
      onChange?.(newTags)
    } catch (error) {
      console.error('Error adding tag:', error)
      const newTags = [...tags, trimmedInput]
      setTags(newTags)
      setInput('')
      onChange?.(newTags)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1)
    } else if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index)
    setTags(newTags)
    onChange?.(newTags)
  }

  const handleSuggestionClick = async (suggestion: TagSuggestion) => {
    if (tags.some(tag => tag.toLowerCase() === suggestion.name.toLowerCase())) return

    setLoading(true)
    try {
      const newTags = [...tags, suggestion.name]
      setTags(newTags)
      setInput('')
      setShowSuggestions(false)
      onChange?.(newTags)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full relative">
      <div className="flex flex-wrap gap-2 p-2 border rounded-md focus-within:ring-2">
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
              //disabled={loading}
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <div className="flex-1 min-w-30 relative">
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setShowSuggestions(true)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="w-full outline-none bg-transparent text-sm border-0 focus-visible:ring-0 px-0"
            //disabled={loading}
          />
          {loading && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
      </div>

      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {loading && suggestions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading suggestions...</div>
          ) : (
            <>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-black hover:bg-gray-100 flex justify-between items-center"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={tags.some(tag => tag.toLowerCase() === suggestion.name.toLowerCase())}
                >
                  <span className="text-sm">{suggestion.name}</span>
                </button>
              ))}
              {input.trim() && !suggestions.some(s => s.name.toLowerCase() === input.toLowerCase()) && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-blue-600 text-sm font-medium"
                  onClick={handleAddTag}
                >
                  Create "{input}" as new tag
                </button>
              )}
            </>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-1">
        {tags.length} tag{tags.length !== 1 ? 's' : ''} added
        {input && ` • Press Enter to add`}
      </p>
    </div>
  )
}

export default TagInput