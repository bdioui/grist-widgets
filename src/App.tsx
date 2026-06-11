import { useEffect, useState } from 'react'
import Dashboard from './views/Dashboard'
import Partners from './views/Partners'
import Members from './views/Members'
import Projects from './views/Projects'
import Actions from './views/Actions'
import { motion } from "framer-motion"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, Download, RefreshCw, UserCircle, LogOut } from 'lucide-react'
import type { MemberFull } from '@/lib/types'
import { getMembersFull } from '@/lib/api'
import { UserContext } from '@/lib/userContext'
import ExportModal from '@/components/ExportModal'

const STORAGE_KEY = 'grist_current_member_id'

export default function App() {

  const [currentView, setCurrentView] = useState('dashboard')
  const [currentMember, setCurrentMember] = useState<MemberFull | null>(null)
  const [allMembers, setAllMembers] = useState<MemberFull[]>([])
  const [showExport, setShowExport] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showProfilePicker, setShowProfilePicker] = useState(false)
  const [profileSearch, setProfileSearch] = useState('')

  useEffect(() => {
    getMembersFull().then(members => {
      setAllMembers(members)
      const savedId = localStorage.getItem(STORAGE_KEY)
      if (savedId) {
        const match = members.find(m => m.id === Number(savedId))
        setCurrentMember(match ?? null)
      }
    })
  }, [])

  function selectMember(member: MemberFull) {
    setCurrentMember(member)
    localStorage.setItem(STORAGE_KEY, String(member.id))
    setShowProfilePicker(false)
  }

  function clearMember() {
    setCurrentMember(null)
    localStorage.removeItem(STORAGE_KEY)
  }


  return (
    <UserContext.Provider value={currentMember}>
    <div className="min-h-screen bg-gray-50">
      <nav className="flex justify-between align-center p-4 gap-4">
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="rounded-md" variant="outline" size="sm">
                <Menu />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56" onCloseAutoFocus={() => setShowProfilePicker(false)}>

              {/* Utilisateur connecté */}
              {currentMember ? (
                <>
                  <div className="flex items-center gap-2 px-2 py-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={currentMember.profile_image} />
                      <AvatarFallback className="text-xs" style={{ backgroundColor: currentMember.partner?.color ?? '#E7E8E2' }}>
                        {currentMember.first_name[0]}{currentMember.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium truncate">{currentMember.first_name} {currentMember.last_name}</span>
                      <span className="text-xs text-muted-foreground truncate">{currentMember.position}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                </>
              ) : null}

              {/* Sélecteur de profil */}
              {!showProfilePicker ? (
                <DropdownMenuItem
                  onSelect={e => e.preventDefault()}
                  onClick={() => { setShowProfilePicker(true); setProfileSearch('') }}
                >
                  <UserCircle /> {currentMember ? 'Changer de profil' : 'Sélectionner mon profil'}
                </DropdownMenuItem>
              ) : (
                <div
                  className="px-2 py-1"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                >
                  <p className="text-xs text-muted-foreground mb-1.5">Qui êtes-vous ?</p>
                  <input
                    autoFocus
                    value={profileSearch}
                    onChange={e => setProfileSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full text-xs border rounded px-2 py-1 mb-1.5 outline-none focus:ring-1 focus:ring-ring"
                  />
                  <div className="max-h-44 overflow-y-auto">
                    {allMembers
                      .filter(m =>
                        `${m.first_name} ${m.last_name}`.toLowerCase().includes(profileSearch.toLowerCase())
                      )
                      .map(m => (
                        <button
                          key={m.id}
                          onClick={() => selectMember(m)}
                          className="w-full text-left flex items-center gap-2 px-1 py-1.5 rounded hover:bg-accent text-sm"
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={m.profile_image} />
                            <AvatarFallback className="text-[10px]" style={{ backgroundColor: m.partner?.color ?? '#E7E8E2' }}>
                              {m.first_name[0]}{m.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{m.first_name} {m.last_name}</span>
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}

              {currentMember && !showProfilePicker && (
                <DropdownMenuItem onClick={clearMember}>
                  <LogOut /> Se déconnecter
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
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
          {['dashboard', 'actions', 'projets', 'partenaires', 'contacts'].map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`relative px-4 py-1 rounded-full text-sm z-10 transition-colors duration-300 ${
                currentView === view ? 'text-white' : 'text-black'
              }`}
            >
              <span className="relative z-20 capitalize">{view}</span>
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
        {currentView === "actions" && <Actions key={refreshKey} />}
        {currentView === "projets" && <Projects key={refreshKey} />}
        {currentView === "partenaires" && <Partners key={refreshKey} />}
        {currentView === "contacts" && <Members key={refreshKey} />}
      </main>

      <ExportModal open={showExport} onClose={() => setShowExport(false)} />
    </div>
    </UserContext.Provider>
  )
}
