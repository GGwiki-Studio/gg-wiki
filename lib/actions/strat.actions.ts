'use client'
import { client } from "@/api/client"


interface CreateStrat {
    title: string;
    game: string;
    map: string;
    tags: string[];
    difficulty: "Easy" | "Medium" | "Hard";
    content: string;
}

export const createStrat = async (formData: CreateStrat, author: any) => {
    const gameID = (await client.from("games").select("id").eq("slug", formData.game).single()).data
    const mapId = (await client.from("maps").select("id").eq("slug", formData.map).single()).data

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
        }
    ))

    if (!gameID) {
        throw new Error("Game not found")
    }

    if (!mapId) {
        throw new Error("Map not found")
    }

    const { data, error } = await client
        .from("strategies")
        .insert({
            title: formData.title,
            game_id: gameID.id,
            map_id: mapId.id,
            difficulty: formData.difficulty,
            content: formData.content,
            user_id: author,
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
        }
    }

    return data
}