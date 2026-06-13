export default function FilterChips({ options = [], value, onChange, allLabel = 'ทั้งหมด' }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        className={`chip shrink-0 ${!value ? 'border-peps bg-peps text-black' : 'bg-white/5'}`}
        onClick={() => onChange('')}
      >
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          type="button"
          key={option}
          className={`chip shrink-0 ${value === option ? 'border-peps bg-peps text-black' : 'bg-white/5'}`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
