'use client'
import Link from "next/link"
import Navitems from "./Navitems"
import Search from "./Search"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import useAuth from "./hooks/useAuth"
import Image from "next/image"
import { useEffect, useState } from "react"
import { client } from "@/api/client"

const Navbar = () => {
  const pathname = usePathname();
  const href = "/registration";
  const auth = useAuth()
  const user = auth?.user
  const [showDropDown, setShowDropDown] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setShowDropDown(false)
  }, [pathname])

  const showOptions = () => {
    setShowDropDown(!showDropDown)
  }

  const logOut = () => {
    client.auth.signOut()
    router.push("/");
  }

  return (
    <nav className="navbar">
        <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
                <h1 className="text-4xl anton-sc-regular">GGwiki</h1>
            </div>
        </Link>
        <div className="flex-1 hidden md:flex justify-center">
          <Search />
        </div>
        <div className="flex items-center gap-8">
            <Navitems />
            <Link href={href} className={cn(pathname === href && 'font-bold', 'text-xl', cn(user && 'hidden'))}>Register</Link>
            <div className="relative">
              <a onClick={showOptions} className={cn(!user && 'hidden', 'cursor-pointer')}>
                <Image src="/profile.svg" alt="User Icon" width={40} height={40} className={'filter invert'}/>
              </a>
              {showDropDown && user && (
                <div className="bg-[#252525] absolute top-12 right-4 flex flex-col gap-4 p-4 rounded min-w-37.5">
                  <a href="/profile" className="cursor-pointer hover:opacity-80">Profile</a>
                  <a href="/settings" className="cursor-pointer hover:opacity-80">Settings</a>
                  <a onClick={logOut} className="cursor-pointer hover:opacity-80">Logout</a>
                </div>
              )}
            </div>
        </div>
    </nav>
  )
}

export default Navbar