import Link from "next/link"
import Navitems from "./Navitems"
import Search from "./Search"

const Navbar = () => {
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
            <p>Sign In</p>
        </div>
    </nav>
  )
}

export default Navbar