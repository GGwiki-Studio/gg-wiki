'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Heart, MessageCircle, Eye, Calendar, User, Trophy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { toast } from 'sonner'
import useAuth from '@/components/hooks/useAuth'
import { getStrat, likeStrat, getComments, addComment, incrementViewCount } from '@/lib/actions/strat.actions'
import ReportButton from '@/components/ReportButton'  // ADD THIS

interface Strategy {
    id: string
    title: string
    content: string
    difficulty: string
    view_count: number
    created_at: string
    strat_url: string
    likes_count: number
    user: {
        id: string
        username: string
    }
    game: {
        name: string
        slug: string
    }
    map: {
        name: string
        slug: string
    }
    tags: string[]
}

interface Comment {
    id: string
    content: string
    created_at: string
    user: {
        username: string
    }
}

const StrategyPage = () => {
    const params = useParams()
    const stratId = params.stratId as string
    const { user } = useAuth()

    const [strategy, setStrategy] = useState<Strategy | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [voteType, setVoteType] = useState<'upvote' | 'downvote' | null>(null)
    const [votesCount, setVotesCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [submittingComment, setSubmittingComment] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        const fetchStrategy = async () => {
            try {
                const stratData = await getStrat(stratId)
                setStrategy(stratData)
                setVotesCount(stratData.likes_count || 0)

                await incrementViewCount(stratId)
                setStrategy(prev => prev ? { ...prev, view_count: (prev.view_count || 0) + 1 } : null)

            } catch (error) {
                const message = error instanceof Error ? error.message : String(error)
                console.error('Error fetching strategy:', error)
                setErrorMessage(message)
                toast.error('Failed to load strategy')
            } finally {
                setLoading(false)
            }
        }

        const fetchComments = async () => {
            try {
                const commentsData = await getComments(stratId)
                setComments(commentsData)
            } catch (error) {
                console.error('Error fetching comments:', error)
            }
        }

        if (stratId) {
            fetchStrategy()
            fetchComments()
        }
    }, [stratId, user])

    const handleVote = async (newVoteType: 'upvote' | 'downvote') => {
        if (!user) {
            toast.error('Please sign in to vote')
            return
        }
        else if (user && !user.email_confirmed_at) {
            toast.error('Please verify your email to vote')
            return
        }

        try {
            const result = await likeStrat(stratId, user.id, newVoteType)
            setVoteType(result.voteType)
            setVotesCount(result.votesCount)
            if (result.voted) {
                toast.success(`Strategy ${newVoteType}d!`)
            } else {
                toast.success('Vote removed')
            }
        } catch (error) {
            console.error('Error voting on strategy:', error)
            toast.error('Failed to vote on strategy')
        }
    }

    const handleAddComment = async () => {
        if (!user) {
            toast.error('Please sign in to comment')
            return
        }
        else if (user && !user.email_confirmed_at) {
            toast.error('Please verify your email to comment')
            return
        }

        if (!newComment.trim()) {
            toast.error('Comment cannot be empty')
            return
        }

        setSubmittingComment(true)
        try {
            const comment = await addComment(stratId, user.id, newComment.trim())
            setComments(prev => [...prev, comment])
            setNewComment('')
            toast.success('Comment added!')
        } catch (error) {
            console.error('Error adding comment:', error)
            toast.error('Failed to add comment')
        } finally {
            setSubmittingComment(false)
        }
    }

    const formatDate = (timestamp: string): string => {
        const date = new Date(timestamp)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-64 bg-gray-700 rounded mb-6"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
            </div>
            </div>
            </div>
        )
    }

    if (!strategy) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Strategy not found</h1>
            <p className="text-gray-400">The strategy you're looking for doesn't exist.</p>
            {errorMessage && (
                <p className="text-red-400 mt-4">
                <span className="font-semibold">Error:</span> {errorMessage}
                </p>
            )}
            <p className="text-gray-500 mt-4">Requested strategy id: <span className="font-mono text-sm">{stratId}</span></p>
            </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
        {/* Strategy Header */}
        <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
        <div>
        <h1 className="text-4xl font-bold mb-2">{strategy.title}</h1>
        <div className="flex items-center gap-4 text-gray-400 mb-4">
        <div className="flex items-center gap-2">
        <User size={16} />
        <span>{strategy.user.username}</span>
        </div>
        <div className="flex items-center gap-2">
        <Calendar size={16} />
        <span>{formatDate(strategy.created_at)}</span>
        </div>
        <div className="flex items-center gap-2">
        <Eye size={16} />
        <span>{strategy.view_count} views</span>
        </div>
        </div>
        </div>
        {/* UPDATED: Added ReportButton here */}
        <div className="flex items-center gap-4">
        <Badge className="bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600 flex items-center gap-2">
        <Trophy size={14} />
        {strategy.difficulty}
        </Badge>
        <ReportButton contentType="strategy" contentId={strategy.id} />
        </div>
        </div>

        {/* Game and Map info */}
        <div className="flex gap-2 mb-4">
        <Badge className="bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600">{strategy.game.name}</Badge>
        <Badge className="bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600">{strategy.map.name}</Badge>
        </div>

        {/* Tags */}
        {strategy.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
            {strategy.tags.map((tag, index) => (
                <Badge key={index} className="bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600">{tag}</Badge>
            ))}
            </div>
        )}

        {/* strat image */}
        {strategy.strat_url && (
            <div className="mb-6">
            <Image
            src={strategy.strat_url}
            alt={strategy.title}
            width={800}
            height={400}
            className="w-full h-64 object-cover rounded-lg"
            />
            </div>
        )}
        </div>

        {/* Strategy Content */}
        <Card className="mb-8 bg-gray-800 border-gray-700">
        <CardContent className="p-6">
        <div className="prose prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
        {strategy.content}
        </div>
        </div>
        </CardContent>
        </Card>

        {/* Vote and Comment Actions */}
        <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
        <Button
        onClick={() => handleVote('upvote')}
        className={`flex items-center gap-2 ${
            voteType === 'upvote'
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600'
        }`}
        >
        <ThumbsUp size={18} className={voteType === 'upvote' ? 'fill-current' : ''} />
        </Button>
        <Button
        onClick={() => handleVote('downvote')}
        className={`flex items-center gap-2 ${
            voteType === 'downvote'
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600'
        }`}
        >
        <ThumbsDown size={18} className={voteType === 'downvote' ? 'fill-current' : ''} />
        </Button>
        <span className="text-gray-400">{votesCount} {votesCount === 1 ? 'Vote' : 'Votes'}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
        <MessageCircle size={18} />
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </div>
        </div>

        {/* Comments Section */}
        <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
        <CardTitle className="text-xl">Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Add Comment */}
        {user ? (
            <div className="space-y-4">
            <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
            rows={3}
            />
            <Button
            onClick={handleAddComment}
            disabled={submittingComment || !newComment.trim()}
            className="bg-blue-600 hover:bg-blue-700"
            >
            {submittingComment ? 'Posting...' : 'Post Comment'}
            </Button>
            </div>
        ) : (
            <div className="text-center py-4 text-gray-400">
            Please sign in to comment
            </div>
        )}

        {/* Comments List - UPDATED with ReportButton */}
        <div className="space-y-4">
        {comments.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No comments yet. Be the first to comment!</p>
        ) : (
            comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User size={16} />
                </div>
                <span className="font-semibold">{comment.user.username}</span>
                <span className="text-sm text-gray-400">{formatDate(comment.created_at)}</span>
                </div>
                <ReportButton contentType="comment" contentId={comment.id} />
                </div>
                <p className="text-gray-200 ml-10">{comment.content}</p>
                </div>
            ))
        )}
        </div>
        </CardContent>
        </Card>
        </div>
        </div>
    )
}

export default StrategyPage
