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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { client } from "@/api/client"

const formSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }),
  password: z.string().min(6, { message: "Password is required and more than 6 characters" }),
})

const SignInForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
 
  const onSubmit = async ({email, password}: z.infer<typeof formSchema>) => {
    console.log("Email:", email, "Password:", password);
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    })

    form.reset()

    if(error){
      toast.error("Error signing in: " + error.message);
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField name="email" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="Enter email address" id="email" type="email" {...field} className="text-4xl" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="password" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input id="password" type="password" {...field} className="text-4xl" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        
        <div className="flex w-full justify-between items-center">
          <Button type="submit" className="w-full bg-[#313131] hover:bg-[#444444] text-white font-bold py-2 px-4 rounded cursor-pointer">
            Sign In
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default SignInForm