'use client'
import { client } from "@/api/client"

interface GetAllGames {
    genre: string | string[];
    topic: string | string[];
}

export const getAllGames = async ({genre, topic}: GetAllGames) => {
    let query = client.from('games').select();

    if(genre && topic){
        query = query.ilike('genre', `%${genre}%`)
        .or(`name.ilike.%${topic}%,description.ilike.%${topic}%`)
    }
    else if(genre){
        query = query.ilike('genre', `%${genre}%`)
    }
    else if(topic){
        query = query.or(`name.ilike.%${topic}%,description.ilike.%${topic}%`)
    }


    // if(name){
    //     query.ilike('name', `%${name}%`)
    // }
    // if(genre){
    //     query.ilike('genre', `%${genre}%`)
    // }
    // if(description){
    //     query.or(`description.ilike.%${description}%`)
    // }

    const {data: games, error} = await query;

    if(error){
        throw new Error(error.message)
    }

    return games
}