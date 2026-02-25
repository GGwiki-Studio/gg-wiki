'use client'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select" 
import {
  RadioGroup,
  RadioGroupItem,
} from "./ui/radio-group"
import TagInput from "./TagInput"
import { createStrat } from "@/lib/actions/strat.actions"
import { redirect } from "next/navigation"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { client } from "@/api/client"
import useAuth from "./hooks/useAuth"
import { useRouter } from "next/navigation"


const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  game: z.string().min(1, { message: "Game is required" }),
  map: z.string().min(1, { message: "Map is required" }),
  tags: z.array(z.string()).min(1, { message: "At least one tag is required" }),
  difficulty: z.enum(["Easy", "Medium", "Hard"], { message: "Difficulty is required" }),
  content: z.string().min(1, { message: "Description is required" }),
})

interface Game {
  id: string
  name: string
  slug: string
}

interface Map {
  id: string
  name: string
  slug: string
  game_id: string
}

const CreateForm = () => {
  const [games, setGames] = useState<Game[]>([])
  const [allMaps, setAllMaps] = useState<Map[]>([])
  const [filteredMaps, setFilteredMaps] = useState<Map[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const auth = useAuth()
  const user = auth?.user


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      game: "",
      map: "",
      tags: [],
      difficulty: "Easy",
      content: "",
    },
  })

  const selectedGame = form.watch("game")

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true)
    } else {
      const timer = setTimeout(() => {
        if (!user) {
          toast.error("You must be logged in to create a strategy")
          router.push("/login")
        }
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [user, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: gamesData, error: gamesError } = await client.from('games').select('id, name, slug')
        if(gamesError) throw gamesError

        const { data: mapsData, error: mapsError } = await client.from('maps').select('id, name, slug, game_id').order('name')
        if (mapsError) throw mapsError

        setGames(gamesData || []);
        setAllMaps(mapsData || []);
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if(selectedGame && allMaps.length > 0){
      const game = games.find(g => g.slug === selectedGame)

      if(game){
        const maps = allMaps.filter(map => map.game_id === game.id)

        setFilteredMaps(maps)
        const currentMap = form.getValues("map")

        if(currentMap && !maps.some(m => m.slug === currentMap)){
          form.setValue("map", "")
        }
      }

    } else {
      setFilteredMaps([])
    }
  }, [selectedGame, allMaps, games, form])

  if(loading){
    return <div>Loading...</div>
  }
 
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const strat = await createStrat(data, user.id)

    if(strat) {
      redirect(`games/${data.game}/maps/${data.map}/strategies/${strat.id}`)
    } else {
      console.error("Failed to create strat")
      toast.error("Failed to create strat. Please try again.")
    }
    form.reset()
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField name="title" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="Enter strategy title" {...field} className="text-4xl" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="game" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Game</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <SelectTrigger className="w-full capitalize">
                  <SelectValue placeholder="Select a game" />
                </SelectTrigger>
                <SelectContent>
                    {games.map((game) => (
                      <SelectItem key={game.id} value={game.slug}>
                        {game.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="map" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Map</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value} disabled={!selectedGame || filteredMaps.length === 0}>
                <SelectTrigger className="w-full capitalize">
                  <SelectValue placeholder={!selectedGame ? "Select a game first" : filteredMaps.length === 0 ? "No maps available" : "Select a map"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredMaps.map((map) => (
                    <SelectItem key={map.id} value={map.slug}>
                      {map.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="content" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Content</FormLabel>
            <FormControl>
              <Textarea placeholder="Enter strategy content" {...field} className="text-4xl" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="difficulty" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Difficulty</FormLabel>
            <FormControl>
              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex grid-cols-3 justify-between items-center">
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl className="w-full">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Easy" id="difficulty-easy" className="peer sr-only" />
                      <label htmlFor="difficulty-easy" className="radio-button">
                        Easy
                      </label>
                    </div>
                  </FormControl>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl className="w-full">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Medium" id="difficulty-medium" className="peer sr-only" />
                      <label htmlFor="difficulty-medium" className="radio-button">
                        Medium
                      </label>
                    </div>
                  </FormControl>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl className="w-full">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Hard" id="difficulty-hard" className="peer sr-only" />
                      <label htmlFor="difficulty-hard" className="radio-button">
                        Hard
                      </label>
                    </div>
                  </FormControl>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="tags" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Tags</FormLabel>
            <FormControl>
              <TagInput value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex w-full justify-between items-center">
          <Button type="button" className="bg-gray-700 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded cursor-pointer" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" className="bg-gray-700 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded cursor-pointer">
            Create Strategy
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default CreateForm