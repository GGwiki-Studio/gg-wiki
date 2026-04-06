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
import { useRouter } from "next/navigation"
import { useState } from "react"
import { time } from "console"

const formSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }),
  username: z.string().min(1, { message: "Unique Username is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

const SignUpForm = () => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
    },
  })

  const onSubmit = async ({ email, username, password }: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)

    try {
      const { data: existingUser, error: checkError } = await client
        .from("profiles")
        .select("username")
        .eq("username", username)
        .maybeSingle()

      if (checkError) throw checkError

      if (existingUser) {
        toast.error("Username already taken. Please choose another one.")
        form.setValue('username', '')
        form.setFocus('username')
        setIsSubmitting(false)
        return
      }

      // Sign up
      const { data: authData, error: authError } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify`,
          data: { username },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        localStorage.setItem('pendingVerificationEmail', JSON.stringify({
          email,
          timestamp: Date.now(),
        }))
        toast.success("Account created successfully! Please check your email to verify your account.")
        router.push("/verify")
      }
    } catch (error: any) {
      console.error("Sign-up error:", error)
      toast.error(`Error creating account: ${error.message}`)
      form.reset()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField name="email" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="Enter email address" id="email" type="email" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="username" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Username</FormLabel>
            <FormControl>
              <Input placeholder="Enter unique username" id="username" type="text" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="password" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input id="password" type="password" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#313131] hover:bg-[#444444] text-white font-bold py-2 px-4 rounded cursor-pointer"
        >
          {isSubmitting ? "Signing up..." : "Sign Up"}
        </Button>
      </form>
    </Form>
  )
}

export default SignUpForm