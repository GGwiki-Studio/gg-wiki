import { client } from "@/api/client"

export async function uploadStrategyMedia(
    file: File,
    strategyId: string,
    userId: string
): Promise<{ success: boolean; url?: string; error?: any }> {
    try {

        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/${strategyId}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await client.storage
        .from('strategy-media')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        })

        if (uploadError) throw uploadError

            const { data: urlData } = client.storage
            .from('strategy-media')
            .getPublicUrl(fileName)

            return { success: true, url: urlData.publicUrl }

    } catch (error) {
        console.error('Strategy media upload failed:', error)
        return { success: false, error }
    }
}
