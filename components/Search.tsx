'use client'

import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"

const Search = () => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState(searchParams.get('topic') || '')
  const [category, setCategory] = useState('all')

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (pathname === '/games') setCategory('games')
    else if (pathname === '/feed') setCategory('strats')
    else setCategory('all')
  }, [pathname])

  useEffect(() => {
    const urlTopic = searchParams.get('topic') || ''
    setSearchQuery(urlTopic)
  }, [searchParams.toString()])

  const buildUrl = (newParams: URLSearchParams) => {
    const queryString = newParams.toString()
    return queryString ? `${pathname}?${queryString}` : pathname
  }

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (!searchQuery.trim()) {
      params.delete("topic")
    } else {
      params.set("topic", searchQuery)
    }

    let basePath = "/"

    if (category === 'games') basePath = '/games'
    else if (category === 'strats') basePath = '/feed'

    const queryString = params.toString()
    const newUrl = queryString ? `${basePath}?${queryString}` : basePath

    router.push(newUrl)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (value === '') {
      timeoutRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("topic")

        const newUrl = buildUrl(params)
        router.push(newUrl)
      }, 300)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')

    const params = new URLSearchParams(searchParams.toString())
    params.delete("topic")

    const newUrl = buildUrl(params)
    router.push(newUrl)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      handleSearch()
    }
  }

  return (
    <div className="h-10 gap-3 w-full max-w-xl border border-gray-300 flex items-center px-4 bg-black mx:hidden">
      <select 
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="bg-transparent outline-none text-xl w-24"
      >
        <option value="all">All</option>
        <option value="games">Games</option>
        <option value="strats">Strats</option>
      </select>

      <Image 
        src="/search-svgrepo-com.svg" 
        alt="Search" 
        width={20} 
        height={20} 
        className="filter invert"
      />

      <input 
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent outline-none text-xl"
      />

      {searchQuery && (
        <button 
          onClick={handleClearSearch}
          className="px-2 text-gray-400 hover:text-white"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export default Search