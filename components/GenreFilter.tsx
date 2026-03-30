'use client'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectItem,
  SelectContent
} from "./ui/select"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useState, useEffect, Suspense } from "react"

function PageContent(){
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const queryGenre = searchParams.get("genre") || "all"
  const [genre, setGenre] = useState(queryGenre)

  useEffect(() => {
    setGenre(queryGenre)
  }, [queryGenre])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (genre === "all") {
      params.delete("genre")
    } else {
      params.set("genre", genre)
    }

    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname

    const currentQuery = searchParams.toString()
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname

    if (newUrl !== currentUrl) {
      router.push(newUrl)
    }
  }, [genre, searchParams.toString(), pathname, router])

  return (
    <Select value={genre} onValueChange={setGenre}>
      <SelectTrigger className="w-full max-w-48">
        <SelectValue placeholder="Select a genre" />
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">All Genres</SelectItem>
          <SelectItem value="action">Action</SelectItem>
          <SelectItem value="adventure">Adventure</SelectItem>
          <SelectItem value="role-playing">Role-Playing</SelectItem>
          <SelectItem value="strategy">Strategy</SelectItem>
          <SelectItem value="simulation">Simulation</SelectItem>
          <SelectItem value="sports">Sports</SelectItem>
          <SelectItem value="puzzle">Puzzle</SelectItem>
          <SelectItem value="shooter">Shooter</SelectItem>
          <SelectItem value="moba">Moba</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

const GenreFilter = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContent />
    </Suspense>
  )
}

export default GenreFilter