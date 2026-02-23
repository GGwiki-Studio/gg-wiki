import CreateForm from "@/components/CreateForm"

const page = () => {
  return (
    <main>
        <article className="mt-12 p-4 border border-gray-300 rounded-2xl w-full gap-4 flex flex-col bg-[#161616] lg:w-1/3 md:w-2/3 mx-auto">
            <h1 className="text-3xl font-bold">Strategy Builder</h1>

            <CreateForm />
        </article>
    </main>
  )
}

export default page