'use client'
import useAuth from "@/components/hooks/useAuth"
import { client } from "@/api/client"


interface CreateStrat {
    title: string;
    game: string;
    map: string;
    tags: string[];
    difficulty: "Easy" | "Medium" | "Hard";
    content: string;
}

export const createStrat = async (formData: CreateStrat) => {
    const auth = useAuth()
    const user = auth?.user
    const { user_id: author } = user.id;
    const gameID = client.from("games").select("id").eq("name", formData.game).single()
    const mapId = client.from("maps").select("id").eq("name", formData.map).single()

    const tagIds = await Promise.all(
    formData.tags.map(async (tagName) => {
        const { data: existingTag } = await client
            .from("tags")
            .select("id")
            .eq("name", tagName)
            .maybeSingle()

        if (existingTag) {
            return existingTag.id
        }

        const { data: newTag, error: createError } = await client
            .from("tags")
            .insert({ 
                name: tagName,
                count: 1 
            })
            .select("id")
            .single()

        if (createError) throw createError
            return newTag.id
        })
    )

    const { data, error } = await client
        .from("strats")
        .insert({
            title: formData.title,
            game_id: gameID,
            map_id: mapId,
            difficulty: formData.difficulty,
            content: formData.content,
            author,
        })
        .select()
        .single()
    
    
    if (error || !data) {
        throw new Error(error?.message || "Failed to create strat")
    }

    if (tagIds.length > 0) {
        const { error: tagAssociationError } = await client
            .from("strategy_tags")
            .insert(
                tagIds.map(tagId => ({
                    strategy_id: data.id,
                    tag_id: tagId
                }))
            )

        if (tagAssociationError) {
            console.error("Failed to associate tags:", tagAssociationError)
            // Don't throw - strat is created, just log the error
        }
    }

    return data[0]
}