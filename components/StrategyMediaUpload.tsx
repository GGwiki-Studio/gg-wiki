'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { uploadStrategyMedia } from '@/lib/storage/uploadStrategyMedia'
import { updateStratMedia } from '@/lib/actions/strat.actions'
import { toast } from 'sonner'
import Image from 'next/image'

interface StrategyMediaUploadProps {
    strategyId: string
    userId: string
    currentUrl?: string
}

export default function StrategyMediaUpload({
    strategyId,
    userId,
    currentUrl
}: StrategyMediaUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(currentUrl || null)
    const [file, setFile] = useState<File | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

            if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
                toast.error('Please select an image or video file')
                return
            }

            if (selectedFile.size > 50 * 1024 * 1024) {
                toast.error('File size must be less than 50MB')
                return
            }

            setFile(selectedFile)
            setPreview(URL.createObjectURL(selectedFile))
    }

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file first')
            return
        }

        setUploading(true)

        try {

            const uploadResult = await uploadStrategyMedia(file, strategyId, userId)

            if (!uploadResult.success || !uploadResult.url) {
                throw new Error('Upload failed')
            }

            await updateStratMedia(strategyId, uploadResult.url, userId)

            toast.success('Media uploaded successfully!')
            setPreview(uploadResult.url)
            setFile(null)

        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload media. Please try again.')
            setPreview(currentUrl || null)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-4">
        <div className="flex flex-col gap-4">
        <label
        htmlFor="strategy-media"
        className="text-sm font-medium"
        >
        Strategy Image/Video
        </label>

        <input
        id="strategy-media"
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-sm text-gray-400
        file:mr-4 file:py-2 file:px-4
        file:rounded file:border-0
        file:text-sm file:font-semibold
        file:bg-gray-700 file:text-white
        hover:file:bg-gray-600
        file:cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed"
        />
        </div>

        {preview && (
            <div className="relative rounded-lg overflow-hidden border border-gray-700">
            {file?.type.startsWith('video/') ? (
                <video
                src={preview}
                controls
                className="w-full max-h-96 object-contain bg-black"
                />
            ) : (
                <Image
                src={preview}
                alt="Strategy media preview"
                width={800}
                height={400}
                className="w-full max-h-96 object-contain bg-black"
                />
            )}
            </div>
        )}

        {file && (
            <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-gray-700 hover:bg-gray-500"
            >
            {uploading ? 'Uploading...' : 'Upload Media'}
            </Button>
        )}
        </div>
    )
}
