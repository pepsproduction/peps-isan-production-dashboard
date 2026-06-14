import { useEffect, useState } from 'react'
import { pingApi } from '../api/googleSheetApi'
import { DEFAULT_CONFIG } from '../config'

export default function Settings({ config, onSave, onClearCache, onRefresh, notify }) {
  const [form, setForm] = useState(config || DEFAULT_CONFIG)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    setForm(config || DEFAULT_CONFIG)
  }, [config])

  const setValue = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const testApi = async () => {
    setTesting(true)
    try {
      const result = await pingApi(form)
      notify(result.ok === false ? result.error : 'เชื่อมต่อ Apps Script ได้แล้ว', result.ok === false ? 'error' : 'success')
    } catch (err) {
      notify(`เชื่อมต่อ API ไม่สำเร็จ: ${err.message}`, 'error')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="muted">ตั้งค่า Apps Script API URL, passcode, Google Maps Embed API Key, Demo Mode และ cache</p>
      </div>
      <form
        className="card space-y-5 p-5"
        onSubmit={(event) => {
          event.preventDefault()
          onSave(form)
        }}
      >
        <label className="block">
          <span className="mb-2 block text-sm text-zinc-400">Apps Script API URL</span>
          <input className="field" value={form.apiUrl || ''} onChange={(event) => setValue('apiUrl', event.target.value)} placeholder="https://script.google.com/macros/s/..." />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-400">Passcode</span>
            <input className="field" type="password" value={form.passcode || ''} onChange={(event) => setValue('passcode', event.target.value)} placeholder="ใส่ passcode จาก Apps Script" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-400">Updated by</span>
            <input className="field" value={form.updatedBy || ''} onChange={(event) => setValue('updatedBy', event.target.value)} />
          </label>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm text-zinc-400">Google Maps Embed API Key</span>
          <input className="field" value={form.mapsApiKey || ''} onChange={(event) => setValue('mapsApiKey', event.target.value)} placeholder="ไม่มีก็ปล่อยว่าง ระบบจะ fallback เป็น maps.google.com?q=...&output=embed" />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
            <span>
              <span className="block font-semibold text-white">Demo Mode</span>
              <span className="text-sm text-zinc-400">ใช้ sample data เมื่อยังไม่ deploy Apps Script</span>
            </span>
            <input type="checkbox" className="h-5 w-5 accent-peps" checked={Boolean(form.demoMode)} onChange={(event) => setValue('demoMode', event.target.checked)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-400">Auto refresh</span>
            <select className="field" value={form.autoRefreshMinutes || 0} onChange={(event) => setValue('autoRefreshMinutes', Number(event.target.value))}>
              <option value={0}>ปิด</option>
              <option value={1}>ทุก 1 นาที</option>
              <option value={3}>ทุก 3 นาที</option>
              <option value={5}>ทุก 5 นาที</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary">บันทึก Settings</button>
          <button type="button" className="btn btn-ghost" onClick={testApi} disabled={testing}>ทดสอบ API</button>
          <button type="button" className="btn btn-ghost" onClick={onRefresh}>Refresh data</button>
          <button type="button" className="btn btn-danger" onClick={onClearCache}>Clear cache</button>
        </div>
      </form>
    </div>
  )
}
