'use client'
import Auth from "@/components/auth/Auth"
import useAuth from "@/components/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const page = () => {
  const auth = useAuth()
  const user = auth?.user
  const loading = auth?.loading
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && user.email_confirmed_at) {
      router.push(`/dashboard/${user.id}`)
    }
    else if (!loading && user && !user.email_confirmed_at) {
      router.push("/verify")
    }
  }, [loading, user, router])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <main>
      <div className="flex items-center justify-center">
        <Auth />
      </div>
    </main>
  )
}

export default page