import StoryboardGallery from '../components/StoryboardGallery'
import StatusBadge from '../components/StatusBadge'

export default function Storyboards({ data, config, notify }) {
  const communities = data?.communities || []
  const unmatched = data?.unmatchedStoryboardFolders || []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Storyboard Gallery</h1>
        <p className="muted">ดูรูป Storyboard ในหน้าเว็บ กดรูปเพื่อเปิด fullscreen viewer พร้อม zoom, swipe และคีย์บอร์ด</p>
      </div>
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4"><StatusBadge status="complete" /><p className="mt-3 text-2xl font-bold text-white">{communities.filter((item) => item.storyboardStatus === 'complete').length}</p><p className="muted">ครบ 6 รูป</p></div>
        <div className="card p-4"><StatusBadge status="partial" /><p className="mt-3 text-2xl font-bold text-white">{communities.filter((item) => item.storyboardStatus === 'partial').length}</p><p className="muted">มีแล้วแต่ยังไม่ครบ</p></div>
        <div className="card p-4"><StatusBadge status="missing" /><p className="mt-3 text-2xl font-bold text-white">{communities.filter((item) => item.storyboardStatus === 'missing').length}</p><p className="muted">ยังไม่มี</p></div>
      </section>
      <StoryboardGallery communities={communities} config={config} notify={notify} />
      {unmatched.length ? (
        <section className="card p-4">
          <h2 className="section-title">Unmatched Folder</h2>
          <p className="muted">โฟลเดอร์ที่จับคู่กับชุมชนยังไม่มั่นใจ เก็บไว้ให้เลือกจับคู่เองในอนาคต</p>
          <div className="mt-4 space-y-2">
            {unmatched.map((folder) => (
              <div key={folder.id || folder.name} className="soft-card p-3 text-sm text-zinc-200">{folder.name}</div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
