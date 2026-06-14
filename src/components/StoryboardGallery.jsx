import { useEffect, useRef, useState } from 'react'
import { ExternalLink, ImageOff, Images, Loader2 } from 'lucide-react'
import { fetchStoryboardImage, fetchStoryboardImages } from '../api/googleSheetApi'
import { storyboardStatusLabel } from '../utils/storyboard'
import LinkButton from './LinkButton'
import StatusBadge from './StatusBadge'
import StoryboardViewer from './StoryboardViewer'

function firstImageFile(images = []) {
  return images.find((image) => image && String(image.mimeType || '').startsWith('image/'))
}

function StoryboardPreview({ community, config, isOpening }) {
  const [thumbnail, setThumbnail] = useState('')
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const previewRef = useRef(null)
  const hasStoryboard = community.storyboardStatus !== 'missing'

  useEffect(() => {
    if (!hasStoryboard || thumbnail || failed) return undefined
    const node = previewRef.current
    let cancelled = false

    const loadThumbnail = async () => {
      setLoading(true)
      try {
        let image = firstImageFile([community.storyboardFolder?.firstImage])
        if (!image) {
          const result = await fetchStoryboardImages(config, community)
          image = firstImageFile(result.images)
        }
        if (!image) throw new Error('No preview image')
        if (image.dataUrl) {
          if (!cancelled) setThumbnail(image.dataUrl)
          return
        }
        const imageResult = await fetchStoryboardImage(config, image.fileId)
        if (!cancelled && imageResult?.dataUrl) setThumbnail(imageResult.dataUrl)
      } catch {
        if (!cancelled) setFailed(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (!node || !('IntersectionObserver' in window)) {
      loadThumbnail()
      return () => {
        cancelled = true
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          loadThumbnail()
        }
      },
      { rootMargin: '180px' },
    )
    observer.observe(node)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [community, config, failed, hasStoryboard, thumbnail])

  return (
    <div ref={previewRef} className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-black">
      {thumbnail ? (
        <img src={thumbnail} alt={`Storyboard ${community.community}`} className="h-full w-full object-cover" loading="lazy" />
      ) : isOpening || loading ? (
        <Loader2 className="animate-spin text-peps" size={34} />
      ) : hasStoryboard ? (
        <Images className="text-peps" size={44} />
      ) : (
        <ImageOff className="text-zinc-600" size={44} />
      )}
      {thumbnail ? <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" /> : null}
    </div>
  )
}

export default function StoryboardGallery({ communities = [], config, notify }) {
  const [loadingId, setLoadingId] = useState('')
  const [viewer, setViewer] = useState({ open: false, community: null, images: [], driveUrl: '' })

  const openCommunity = async (community) => {
    setLoadingId(community.id)
    try {
      const result = await fetchStoryboardImages(config, community)
      if (result.fallback === 'drive-folder' && !(result.images || []).length) {
        notify?.('ยังไม่ได้เชื่อม Apps Script สำหรับรูป Storyboard จึงแสดงโฟลเดอร์ Drive ในเว็บเป็นตัวสำรอง', 'warning')
      }
      setViewer({
        open: true,
        community,
        images: result.images || [],
        driveUrl: result.folder?.url || community.storyboardLink,
      })
    } catch (err) {
      notify?.(`โหลด Storyboard ไม่สำเร็จ: ${err.message}`, 'error')
    } finally {
      setLoadingId('')
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {communities.map((community) => {
          const count = community.storyboardFolder?.imageCount || community.storyboardFolder?.images?.length || (community.storyboardStatus === 'missing' ? 0 : 1)
          return (
            <article key={community.id} className="card overflow-hidden">
              <button
                type="button"
                className="block w-full text-left"
                onClick={() => openCommunity(community)}
              >
                <StoryboardPreview community={community} config={config} isOpening={loadingId === community.id} />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge status={community.storyboardStatus}>
                      {storyboardStatusLabel(community.storyboardStatus, count)}
                    </StatusBadge>
                    <span className="text-sm font-bold text-peps">{community.sequence}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-white">{community.province} - {community.community}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{community.content || community.program}</p>
                </div>
              </button>
              <div className="flex gap-2 border-t border-white/10 p-3">
                <LinkButton label="ดูในเว็บ" icon={Images} onClick={() => openCommunity(community)} />
                {community.storyboardLink ? <LinkButton href={community.storyboardLink} label="เปิด Drive" icon={ExternalLink} /> : null}
              </div>
            </article>
          )
        })}
      </div>
      <StoryboardViewer
        open={viewer.open}
        community={viewer.community}
        images={viewer.images}
        driveUrl={viewer.driveUrl}
        onClose={() => setViewer({ open: false, community: null, images: [], driveUrl: '' })}
        config={config}
      />
    </>
  )
}
