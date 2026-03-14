'use client'
import Builder from "@/components/Builder"
import CreateForm from "@/components/CreateForm"

const page = () => {
  return (
    <main>
      <div className="px-4 md:px-10 w-full">
        <article className="mt-12 p-4 border border-gray-300 rounded-2xl w-full gap-4 flex bg-[#161616] mx-auto">
          <section className="w-2/3">
            <Builder />
          </section>
          <section className="w-1/3">
            <h1 className="text-3xl font-bold mb-2">Strategy Builder</h1>
            <CreateForm />
          </section>
        </article>
      </div>
    </main>
  )
}

export default page