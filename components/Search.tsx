import Image from "next/image";
const Search = () => {
  return (
    <div className="h-10 gap-3 w-full max-w-xl border border-gray-300 rounded-2xl flex items-center px-4 bg-black mx:hidden">
      <select name="search-category" id="search-category" className="bg-transparent outline-none text-xl w-24">
        <option value="all">All</option>
        <option value="games">Games</option>
        <option value="maps">Maps</option>
      </select>
      <Image src="/search-svgrepo-com.svg" alt="Search icon" width={20} height={20} className="filter invert"/>
      <input type="text" placeholder="Search..." className="flex-1 bg-transparent outline-none text-xl" />
    </div>
  )
}

export default Search;