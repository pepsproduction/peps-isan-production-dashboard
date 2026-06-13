import { useState } from 'react'
import { ExternalLink, ImageOff, Images, Loader2 } from 'lucide-react'
import { fetchStoryboardImages } from '../api/googleSheetApi'
import { storyboardStatusLabel } from '../utils/storyboard'
import LinkButton from './LinkButton'
import StatusBadge from './StatusBadge'
import StoryboardViewer from './StoryboardViewer'

export default function StoryboardGallery({ communities = [], config, notify }) {
  const [loadingId, setLoadingId] = useState('')
  const [viewer, setViewer] = useState({ open: false, community: null, images: [], driveUrl: '' })

  const openCommunity = async (community) => {
    setLoadingId(community.id)
    try {
      const result = await fetchStoryboardImages(config, community)
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
          const hasStoryboard = community.storyboardStatus !== 'missing'
          return (
            <article key={community.id} className="card overflow-hidden">
              <button
                type="button"
                className="block w-full text-left"
                onClick={() => openCommunity(community)}
                disabled={!hasStoryboard && !community.storyboardLink}
              >
                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-black">
                  {loadingId === community.id ? (
                    <Loader2 className="animate-spin text-peps" size={34} />
                  ) : hasStoryboard ? (
                    <Images className="text-peps" size={44} />
                  ) : (
                    <ImageOff className="text-zinc-600" size={44} />
                  )}
                </div>
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
                <LinkButton label="ดูในเว็บ" icon={Images} onClick={() => openCommunity(community)} disabled={!hasStoryboard && !community.storyboardLink} />
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
