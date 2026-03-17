import { client } from "@/api/client"

export async function uploadMapImage(
    file: File,
    mapId: string,
    gameSlug: string
): Promise<{ success: boolean; url?: string; error?: any }> {
    try {

        const fileExt = file.name.split('.').pop()
        const fileName = `${gameSlug}/${mapId}.${fileExt}`

        const { error: uploadError } = await client.storage
        .from('map-images')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
        })

        if (uploadError) throw uploadError

            const { data: urlData } = client.storage
            .from('map-images')
            .getPublicUrl(fileName)

            return { success: true, url: urlData.publicUrl }

    } catch (error) {
        console.error('Map image upload failed:', error)
        return { success: false, error }
    }
}
