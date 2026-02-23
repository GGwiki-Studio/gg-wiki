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
  FormDescription,
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


const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  game: z.string().min(1, { message: "Game is required" }),
  map: z.string().min(1, { message: "Map is required" }),
  tags: z.array(z.string()).min(1, { message: "At least one tag is required" }),
  difficulty: z.enum(["Easy", "Medium", "Hard"], { message: "Difficulty is required" }),
  content: z.string().min(1, { message: "Description is required" }),
})

const CreateForm = () => {
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
 
  const onSubmit = (data: z.infer<typeof formSchema>) => {
      console.log(data)
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
                  <SelectItem value="counter-strike-source-2">Counter-Strike Source 2</SelectItem>
                  <SelectItem value="valorant">Valorant</SelectItem>
                  <SelectItem value="league-of-legends">League of Legends</SelectItem>
                  <SelectItem value="rainbow-six-siege">Rainbow Six Siege</SelectItem>
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
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <SelectTrigger className="w-full capitalize">
                  <SelectValue placeholder="Select a map" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accent">Accent</SelectItem>
                  <SelectItem value="bind">Bind</SelectItem>
                  <SelectItem value="breeze">Breeze</SelectItem>
                  <SelectItem value="fracture">Fracture</SelectItem>
                  <SelectItem value="haven">Haven</SelectItem>
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