import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout({ children, currentPage, onNavigate, mode, lastUpdated, onRefresh }) {
  return (
    <div className="min-h-screen">
      <TopBar mode={mode} lastUpdated={lastUpdated} onRefresh={onRefresh} />
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="px-4 pb-28 pt-5 md:px-6 lg:ml-72 lg:pb-10">{children}</main>
      <BottomNav currentPage={currentPage} onNavigate={onNavigate} />
    </div>
  )
}
