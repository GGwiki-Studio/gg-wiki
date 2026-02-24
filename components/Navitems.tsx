'use client'
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter} from "next/navigation"
import useAuth from "./hooks/useAuth"
import { toast } from "sonner"

const navItems = [
  {label: "Home", href: "/"},
  {label: "Games", href: "/games"},
  {label: "Create", href: "/create-strat", protected: true},
  {label: "Dashboard", href: "/dashboard", protected: true},
]

const Navitems = () => {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth()
  const user = auth?.user

  const handleNavItemClick = (e: React.MouseEvent, protectedItem?: boolean) => {
    if (protectedItem && !user) {
      e.preventDefault();
      router.push("/registration");
      toast.error("You must be logged in to access this page.");
      return;
    }
  }

  const getHref = (item: typeof navItems[0]) => {
    if (item.label === "Dashboard" && user?.id) {
      return `/dashboard/${user.id}`;
    }
    return item.href;
  }

  return (
    <nav className="text-xl flex items-center gap-8 oswald-light">
      {navItems.map((item) => {
        const href = getHref(item);
        return (
          <Link key={item.label} href={href} onClick={(e) => handleNavItemClick(e, item.protected)} className={cn(pathname === href && 'font-bold')}>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default Navitems