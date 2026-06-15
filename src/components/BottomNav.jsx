import {
  CalendarDays,
  CheckSquare,
  GalleryHorizontalEnd,
  Home,
  Hotel,
  Map,
  ReceiptText,
  Settings,
  Users,
  Clock3,
} from 'lucide-react'
import { NAV_ITEMS } from '../config'

const icons = {
  dashboard: Home,
  today: CalendarDays,
  timeline: Clock3,
  communities: Users,
  storyboards: GalleryHorizontalEnd,
  checklist: CheckSquare,
  expenses: ReceiptText,
  lodging: Hotel,
  maps: Map,
  settings: Settings,
}

export default function BottomNav({ currentPage, onNavigate }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/94 px-2 py-2 backdrop-blur-xl lg:hidden">
      <div className="flex gap-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = icons[item.id] || Home
          const active = currentPage === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex min-w-[78px] flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold ${
                active ? 'bg-peps text-black' : 'text-zinc-400'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
