'use client'
import { client } from "@/api/client"
import { toast } from "sonner";

interface GetAllGames {
    name: string | string[];
    genre: string | string[];
    description: string | string[];
}

export const getAllGames = async ({name, genre, description}: GetAllGames) => {
    let query = client.from('games').select();

    if(name){
        query.ilike('name', `%${name}%`)
    }
    if(genre){
        query.ilike('genre', `%${genre}%`)
    }
    if(description){
        query.or(`description.ilike.%${description}%`)
    }

    const {data: games, error} = await query;

    if(error){
        throw new Error(error.message)
    }

    return games
}