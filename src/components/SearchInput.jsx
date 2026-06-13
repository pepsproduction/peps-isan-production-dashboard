import { Search } from 'lucide-react'

export default function SearchInput({ value, onChange, placeholder = 'ค้นหา', className = '' }) {
  return (
    <label className={`relative block ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
      <input
        className="field pl-10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}
