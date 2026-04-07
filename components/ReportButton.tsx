'use client'
import { useState } from 'react'
import { client } from '@/api/client'

interface ReportButtonProps {
    contentType: 'strategy' | 'comment' | 'strat'
    contentId: string
}

export default function ReportButton({ contentType, contentId }: ReportButtonProps) {
    const [showForm, setShowForm] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const { data: { user } } = await client.auth.getUser()

        if (!user) {
            setError('Please log in to report content')
            setLoading(false)
            return
        }

        const { error: submitError } = await client.from('reports').insert({
            reporter_id: user.id,
            content_type: contentType,
            content_id: contentId,
            reason: formData.get('reason') as string,
                                                                           description: formData.get('description') as string || null,
        })

        if (submitError) {
            setError('Failed to submit report. Please try again.')
            console.error(submitError)
        } else {
            setSubmitted(true)
            setTimeout(() => setShowForm(false), 2000)
        }

        setLoading(false)
    }

    if (submitted) {
        return <span className="text-sm text-green-400">✓ Reported</span>
    }

    return (
        <div className="inline-block relative z-50">
        <button
        onClick={() => setShowForm(!showForm)}
        className="text-sm text-gray-400 hover:text-red-400 transition"
        type="button"
        aria-label="Report this content"
        >
        🚩 Report
        </button>

        {showForm && (
            <form
            onSubmit={handleSubmit}
            className="absolute right-0 mt-2 p-4 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl min-w-[280px]"
            >
            <p className="text-sm font-medium mb-2">Why are you reporting this?</p>
            <select
            name="reason"
            required
            className="w-full bg-[#252525] border border-gray-600 rounded px-3 py-2 mb-2 text-sm"
            >
            <option value="">Select a reason...</option>
            <option value="spam">Spam or misleading</option>
            <option value="inappropriate">Inappropriate content</option>
            <option value="harassment">Harassment</option>
            <option value="misinformation">False information</option>
            <option value="other">Other</option>
            </select>

            <textarea
            name="description"
            placeholder="Additional details (optional)"
            className="w-full bg-[#252525] border border-gray-600 rounded px-3 py-2 mb-3 text-sm"
            rows={3}
            />

            {error && (
                <div className="mb-3 text-xs text-red-400 bg-red-900/20 p-2 rounded">
                ⚠️ {error}
                </div>
            )}

            <div className="flex gap-2">
            <button
            type="submit"
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {loading ? 'Submitting...' : 'Submit'}
            </button>
            <button
            type="button"
            onClick={() => setShowForm(false)}
            className="text-gray-400 px-4 py-2 text-sm hover:text-white"
            >
            Cancel
            </button>
            </div>
            </form>
        )}
        </div>
    )
}
