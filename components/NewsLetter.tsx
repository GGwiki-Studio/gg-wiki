const NewsLetter = () => {
  return (
    <article className="m-8">
        <h2 className="text-2xl font-bold">Subscribe to our Newsletter</h2>
        <p className="mb-4">Get the latest updates and news about your favorite games and strategies.</p>
        <form className="flex flex-col justify-between sm:flex-row gap-4">
            <input type="email" placeholder="Enter your email" className="p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 w-3/4" />
            <button type="submit" className="bg-gray-800 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded cursor-pointer">
                Subscribe
            </button>
        </form>
    </article>
  )
}

export default NewsLetter