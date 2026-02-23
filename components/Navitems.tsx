'use client'
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter} from "next/navigation"
import useAuth from "./hooks/useAuth"

const navItems = [
  {label: "Home", href: "/"},
  {label: "Games", href: "/games"},
  {label: "Create", href: "/create-strat", protected: true},
  {label: "Profile", href: "/profile", protected: true},
]

const Navitems = () => {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const user = auth?.user;

  const handleNavItemClick = (e: React.MouseEvent, href: string, protectedItem?: boolean) => {
    if (protectedItem && !user) {
      e.preventDefault();
      router.push("/registration");
      return;
    }
  }

  return (
    <nav className="text-xl flex items-center gap-8 oswald-light">
      {navItems.map(({label, href, protected: protectedItem = false}) => (
        <Link key={label} href={href} onClick={(e) => handleNavItemClick(e, href, protectedItem)} className={cn(pathname === href && 'font-bold')}>
          {label}
        </Link>
      ))}
    </nav>
  )
}

export default Navitems