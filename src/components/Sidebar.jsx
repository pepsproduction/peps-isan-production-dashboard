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

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside className="fixed bottom-0 left-0 top-0 hidden w-72 border-r border-white/10 bg-black/30 p-4 pt-24 backdrop-blur-xl lg:block">
      <nav className="space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = icons[item.id] || Home
          const active = currentPage === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                active ? 'bg-peps text-black' : 'text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={19} />
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
