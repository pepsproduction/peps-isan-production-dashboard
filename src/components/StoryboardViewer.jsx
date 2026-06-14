import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, Minus, Plus, X } from 'lucide-react'
import { fetchStoryboardImage } from '../api/googleSheetApi'
import { makeDriveFolderEmbedUrl } from '../utils/storyboard'
import LinkButton from './LinkButton'

export default function StoryboardViewer({ open, community, images = [], initialIndex = 0, onClose, config, driveUrl }) {
  const [index, setIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [loaded, setLoaded] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const touchStart = useRef(null)

  const current = images[index]
  const imageCount = images.length
  const currentSrc = current?.dataUrl || loaded[current?.fileId]
  const unsupported = current && !String(current.mimeType || '').startsWith('image/')
  const driveEmbedUrl = makeDriveFolderEmbedUrl(driveUrl)

  const loadImage = useMemo(
    () => async (image) => {
      if (!image || image.dataUrl || loaded[image.fileId] || unsupported) return
      setLoading(true)
      setError('')
      try {
        const result = await fetchStoryboardImage(config, image.fileId)
        if (result?.dataUrl) {
          setLoaded((prev) => ({ ...prev, [image.fileId]: result.dataUrl }))
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    },
    [config, loaded, unsupported],
  )

  useEffect(() => {
    if (!open) return
    setIndex(initialIndex)
    setZoom(1)
  }, [open, initialIndex])

  useEffect(() => {
    if (!open || !current) return
    loadImage(current)
    if (images[index + 1]) loadImage(images[index + 1])
  }, [open, current, images, index, loadImage])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') setIndex((value) => Math.min(value + 1, imageCount - 1))
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(value - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, imageCount, onClose])

  if (!open) return null

  const go = (next) => {
    setIndex(Math.min(Math.max(next, 0), imageCount - 1))
    setZoom(1)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/96">
      <div className="flex min-h-16 items-center justify-between gap-3 border-b border-white/10 px-4">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{community?.province} - {community?.community}</p>
          <p className="text-sm text-zinc-400">{imageCount ? `${index + 1}/${imageCount}` : 'ไม่มีรูป'}</p>
        </div>
        <div className="flex items-center gap-2">
          {driveUrl ? <LinkButton href={driveUrl} label="เปิด Drive" icon={ExternalLink} className="hidden sm:inline-flex" /> : null}
          <button type="button" className="btn btn-ghost px-3" onClick={() => setZoom((value) => Math.max(0.7, value - 0.2))} title="Zoom out">
            <Minus size={18} />
          </button>
          <button type="button" className="btn btn-ghost px-3" onClick={() => setZoom((value) => Math.min(2.4, value + 0.2))} title="Zoom in">
            <Plus size={18} />
          </button>
          <button type="button" className="btn btn-ghost px-3" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>
      </div>

      <div
        className="storyboard-viewer-image relative flex flex-1 items-center justify-center overflow-hidden p-4"
        onTouchStart={(event) => {
          touchStart.current = event.changedTouches[0].clientX
        }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return
          const diff = event.changedTouches[0].clientX - touchStart.current
          if (diff < -48) go(index + 1)
          if (diff > 48) go(index - 1)
          touchStart.current = null
        }}
      >
        {imageCount > 1 ? (
          <>
            <button type="button" className="absolute left-3 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" onClick={() => go(index - 1)} disabled={index === 0}>
              <ChevronLeft size={28} />
            </button>
            <button type="button" className="absolute right-3 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" onClick={() => go(index + 1)} disabled={index === imageCount - 1}>
              <ChevronRight size={28} />
            </button>
          </>
        ) : null}

        {unsupported ? (
          <div className="soft-card max-w-lg p-6 text-center">
            <p className="text-lg font-semibold text-white">Preview ในเว็บยังไม่รองรับไฟล์ชนิดนี้</p>
            <p className="mt-2 text-sm text-zinc-400">{current.name}</p>
            {driveUrl ? <LinkButton href={driveUrl} label="เปิดใน Drive" className="mt-4" /> : null}
          </div>
        ) : loading && !currentSrc ? (
          <div className="flex items-center gap-3 text-zinc-300"><Loader2 className="animate-spin" /> กำลังโหลดรูป</div>
        ) : error && !currentSrc ? (
          <div className="soft-card max-w-lg p-6 text-center">
            <p className="font-semibold text-red-200">โหลดรูปไม่สำเร็จ</p>
            <p className="mt-2 text-sm text-zinc-400">{error}</p>
            {driveUrl ? <LinkButton href={driveUrl} label="เปิดใน Drive" className="mt-4" /> : null}
          </div>
        ) : currentSrc ? (
          <img
            src={currentSrc}
            alt={current?.name || 'Storyboard'}
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl transition-transform"
            style={{ transform: `scale(${zoom})` }}
          />
        ) : driveEmbedUrl ? (
          <div className="flex h-full w-full max-w-6xl flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-300">
              <span>ยังไม่ได้รายการไฟล์จาก Apps Script จึงแสดงโฟลเดอร์ Drive ในหน้าเว็บเป็นตัวสำรอง</span>
              {driveUrl ? <LinkButton href={driveUrl} label="เปิด Drive" icon={ExternalLink} /> : null}
            </div>
            <iframe
              title={`Storyboard Drive ${community?.community || ''}`}
              src={driveEmbedUrl}
              className="min-h-[62vh] w-full flex-1 rounded-lg border border-white/10 bg-white"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="text-zinc-400">ไม่มีรูป Storyboard</div>
        )}
      </div>
    </div>
  )
}
