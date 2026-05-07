import { useState } from 'react'
import Dashboard from './views/Dashboard'
import Partners from './views/Partners'
import Members from './views/Members'
import Projects from './views/Projects'
import { motion } from "framer-motion"

export default function App() {

  const [currentView, setCurrentView] = useState('dashboard')
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de navigation supérieure */}
      <nav className="flex justify-end p-4 gap-4">
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
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "projets" && <Projects />}
        {currentView === "partenaires" && <Partners />}
        {currentView === "contacts" && <Members />}
      </main>
    </div>
  )
}                         