export default function ConfirmDialog({ open, title, message, confirmLabel = 'ยืนยัน', onConfirm, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-md p-5">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm text-zinc-400">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
