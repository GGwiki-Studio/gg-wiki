'use client'
import { cn } from "@/lib/utils"
import Link from "next/link"

import { usePathname } from "next/navigation"

const navItems = [
  {label: "Home", href: "/"},
  {label: "Games", href: "/games"},
  {label: "Create", href: "/create-strat"},
  {label: "Profile", href: "/profile"},
]

const Navitems = () => {
  const pathname = usePathname();

  return (
    <nav className="text-xl flex items-center gap-8 oswald-light">
      {navItems.map(({label, href}) => (
        <Link key={label} href={href} className={cn(pathname === href && 'font-bold')}>
          {label}
        </Link>
      ))}
    </nav>
  )
}

export default Navitems