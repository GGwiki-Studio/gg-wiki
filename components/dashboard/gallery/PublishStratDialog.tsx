'use client'
 
import { useEffect, useState } from 'react'
import { Dialog } from 'radix-ui'
import { Tag, X } from 'lucide-react'
import { toast } from 'sonner'
import { client } from '@/api/client'
import { publishStrat } from '@/lib/actions/post.actions'
import { renameStrat } from '@/lib/actions/strat.actions'
import type { StratListItem } from '@/components/strat-viewer/strat.types'
import TagInput from '@/components/TagInput'
 
interface PublishStratDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  strat: StratListItem | null
  userId: string
  onPublished: (strategyId: string, gameSlug: string, mapSlug: string) => void
  onRenamed: (id: string, newTitle: string) => void
}
 
interface Game {
  id: string
  name: string
  slug: string
}
 
interface GameMap {
  id: string
  name: string
  slug: string
}
 
const fieldCls =
  'w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 text-sm text-[#ccc] outline-none focus:border-[#3b82f6] transition'
 
export default function PublishStratDialog({
  open,
  onOpenChange,
  strat,
  userId,
  onPublished,
  onRenamed,
}: PublishStratDialogProps) {
  const [title, setTitle] = useState('')
  const [gameId, setGameId] = useState('')
  const [mapId, setMapId] = useState('')
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
 
  const [games, setGames] = useState<Game[]>([])
  const [maps, setMaps] = useState<GameMap[]>([])
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
 
  // reset form when dialog opens with a new strat
  useEffect(() => {
    if (!open || !strat) return
 
    setTitle(strat.title)
    setGameId('')
    setMapId('')
    setDifficulty('Easy')
    setContent('')
    setTags([])
  }, [open, strat])
 
  // fetch games on open
  useEffect(() => {
    if (!open) return
 
    const fetchGames = async () => {
      setLoading(true)
      const { data, error } = await client.from('games').select('id, name, slug').eq('is_active', true).order('name')
 
      if (data) setGames(data)
      if (error) toast.error('Failed to load games')
      setLoading(false)
    }
 
    fetchGames()
  }, [open])
 
  // fetch maps when game changes
  useEffect(() => {
    if (!gameId) { setMaps([]); setMapId(''); return }
 
    const fetchMaps = async () => {
      const { data, error } = await client
        .from('maps')
        .select('id, name, slug')
        .eq('game_id', gameId)
        .order('name')
 
      if (data) setMaps(data)
      if (error) toast.error('Failed to load maps')
    }
 
    fetchMaps()
    setMapId('')
  }, [gameId])
 
  const handlePublish = async () => {
    if (!strat) return
 
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!gameId) { toast.error('Select a game'); return }
    if (!mapId) { toast.error('Select a map'); return }
    if (!content.trim()) { toast.error('Description is required'); return }
    if (tags.length === 0) { toast.error('Add at least one tag'); return }
 
    setPublishing(true)
 
    // rename strat if title changed
    if (title.trim() !== strat.title) {
      const { error: renameError } = await renameStrat(strat.id, userId, title.trim())
      if (renameError) {
        toast.error('Failed to rename strat')
        setPublishing(false)
        return
      }
      onRenamed(strat.id, title.trim())
    }
 
    const selectedGame = games.find((g) => g.id === gameId)
    const selectedMap = maps.find((m) => m.id === mapId)
 
    const { data, error } = await publishStrat({
      userId,
      stratId: strat.id,
      title: title.trim(),
      content: content.trim(),
      difficulty,
      gameId,
      mapId,
      thumbnailUrl: strat.thumbnailUrl,
      tags,
    })
 
    if (error || !data) {
      toast.error(error || 'Failed to publish')
      setPublishing(false)
      return
    }
 
    toast.success('Strat published!')
    setPublishing(false)
    onOpenChange(false)
    onPublished(data.id, selectedGame?.slug || '', selectedMap?.slug || '')
  }
 
  if (!strat) return null
 
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] shadow-lg">
 
          {/* header */}
          <div className="flex items-center justify-between border-b border-[#2a2a2a] px-5 py-4">
            <Dialog.Title className="text-base font-medium text-[#eee]">
              Publish strat
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded p-1 text-[#555] hover:text-[#999]">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
 
          {/* form */}
          <div className="flex flex-col gap-4 px-5 py-5">
 
            {/* thumbnail preview */}
            <div className="flex items-center gap-3 rounded-lg bg-[#252525] p-3">
              <div className="h-10 w-16 shrink-0 overflow-hidden rounded bg-[#333]">
                {strat.thumbnailUrl ? (
                  <img src={strat.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[8px] text-[#555]">No preview</div>
                )}
              </div>
              <div>
                <p className="text-xs text-[#888]">Publishing from dashboard</p>
              </div>
            </div>
 
            {/* title */}
            <div>
              <label className="mb-1 block text-xs text-[#888]">Title</label>
              <input
                className={`${fieldCls} h-9`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Strategy title"
                maxLength={100}
              />
              <span className="mt-0.5 block text-[10px] text-[#555]">Editing this also renames the strat</span>
            </div>
 
            {/* game + map */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-[#888]">Game</label>
                <select
                  className={`${fieldCls} h-9 appearance-none`}
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select a game</option>
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-[#888]">Map</label>
                <select
                  className={`${fieldCls} h-9 appearance-none`}
                  value={mapId}
                  onChange={(e) => setMapId(e.target.value)}
                  disabled={!gameId || maps.length === 0}
                >
                  <option value="">{!gameId ? 'Select a game first' : maps.length === 0 ? 'No maps' : 'Select a map'}</option>
                  {maps.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
 
            {/* difficulty */}
            <div>
              <label className="mb-1 block text-xs text-[#888]">Difficulty</label>
              <div className="flex gap-2">
                {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 rounded-md border py-1.5 text-xs transition ${
                      difficulty === d
                        ? 'border-[#2d5a9e] bg-[#0d1829] text-[#6ba3e0]'
                        : 'border-[#2a2a2a] bg-[#0d0d0d] text-[#888] hover:border-[#444]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
 
            {/* description */}
            <div>
              <label className="mb-1 block text-xs text-[#888]">Description</label>
              <textarea
                className={`${fieldCls} min-h-[72px] resize-none py-2`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your strategy..."
                rows={3}
              />
            </div>
 
            {/* tags */}
            <div>
                <label className="mb-1 block text-xs text-[#888]">Tags</label>
                <TagInput
                    value={tags}
                    onChange={setTags}
                    placeholder="Add tags..."
                />
            </div>
 
          </div>
 
          {/* footer */}
          <div className="flex justify-end gap-3 border-t border-[#2a2a2a] px-5 py-3">
            <Dialog.Close asChild>
              <button className="rounded-md px-4 py-1.5 text-sm text-[#888] transition hover:text-[#ccc]">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="rounded-md bg-white px-4 py-1.5 text-sm text-[#1a1a1a] transition hover:bg-[#e0e0e0] disabled:opacity-40"
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          </div>
 
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}