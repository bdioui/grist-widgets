import { useEffect, useState } from 'react'
import Dashboard from './views/Dashboard'
import Partners from './views/Partners'
import Members from './views/Members'
import Projects from './views/Projects'
import { motion } from "framer-motion"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import {Button} from "@/components/ui/button"
import { Menu, Fullscreen, Download, RefreshCw } from 'lucide-react'
import type { MemberFull } from '@/lib/types'
import {getCurrentUser, getMembersFull} from '@/lib/api'
import { UserContext } from '@/lib/userContext'
import ExportModal from '@/components/ExportModal'

export default function App() {

  const [currentView, setCurrentView] = useState('dashboard')
  const [fullScreen, setFullScreen] = useState(false)
  const [currentMember, setCurrentMember] = useState<MemberFull | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
        Promise.all([getCurrentUser(), getMembersFull()])
            .then(([user, members]) => {
                console.log(currentMember)
                const match = members.find(m => m.email === user.email)
                setCurrentMember(match ?? null)
            })
    }, [])

  function toggleFullScreen() {
      if (!fullScreen) {
          document.documentElement.requestFullscreen()
          setFullScreen(true)
      } else {
          document.exitFullscreen()
          setFullScreen(false)
      }
  }

  return (
    <UserContext.Provider value={currentMember}>
    <div className="min-h-screen bg-gray-50">
      {/* Barre de navigation supérieure */}
      <nav className="flex justify-between align-center p-4 gap-4">
         <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="rounded-md" variant="outline" size="sm">
                    <Menu />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">

                {/* Utilisateur connecté */}
                {currentMember ? (
                    <>
                        <div className="flex items-center gap-2 px-2 py-2">
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                                style={{ backgroundColor: currentMember.partner?.color ?? '#E7E8E2' }}
                            >
                                {currentMember.first_name[0]}{currentMember.last_name[0]}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-medium truncate">{currentMember.first_name} {currentMember.last_name}</span>
                                <span className="text-xs text-muted-foreground truncate">{currentMember.position}</span>
                            </div>
                        </div>
                        <DropdownMenuSeparator />
                    </>
                ) : null}

                <DropdownMenuItem onClick={toggleFullScreen}>
                    <Fullscreen /> {fullScreen ? 'Réduire' : 'Plein écran'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRefreshKey(k => k + 1)}>
                    <RefreshCw /> Actualiser
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowExport(true)}>
                    <Download /> Exporter les données
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
          
        </div>
        <div className="bg-gray-200 rounded-full border p-1 flex relative">
          {['dashboard', 'projets', 'partenaires', 'contacts'].map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`relative px-4 py-1 rounded-full text-sm z-10 transition-colors duration-300 ${
                currentView === view ? 'text-white' : 'text-black'
              }`}
            >
              <span className="relative z-20 capitalize">{view}</span>
              
              {/* La pilule animée qui glisse en dessous */}
              {currentView === view && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-black rounded-full z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      <main>
        {currentView === "dashboard" && <Dashboard key={refreshKey} />}
        {currentView === "projets" && <Projects key={refreshKey} />}
        {currentView === "partenaires" && <Partners key={refreshKey} />}
        {currentView === "contacts" && <Members key={refreshKey} />}
      </main>

      <ExportModal open={showExport} onClose={() => setShowExport(false)} />
    </div>
    </UserContext.Provider>
  )
}                         