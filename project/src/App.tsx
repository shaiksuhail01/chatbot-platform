import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthPage } from './components/auth/AuthPage'
import { Header } from './components/layout/Header'
import { Dashboard } from './components/dashboard/Dashboard'
import { ProjectDetail } from './components/projects/ProjectDetail'
import { Project } from './types'

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()
  const [currentView, setCurrentView] = useState<'dashboard' | 'project'>('dashboard')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project)
    setCurrentView('project')
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedProject(null)
  }

  const handleUpdateProject = async (projectId: string, updates: {
    name?: string
    description?: string
    systemPrompt?: string
  }) => {
    // This will be handled by the Dashboard component
    console.log('Update project:', projectId, updates)
  }
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === 'dashboard' ? (
        <>
          <Header />
          <main className="max-w-7xl mx-auto px-6 py-8">
            <Dashboard
              onOpenProject={handleOpenProject}
            />
          </main>
        </>
      ) : currentView === 'project' && selectedProject ? (
        <ProjectDetail
          project={selectedProject}
          onBack={handleBackToDashboard}
          onUpdateProject={handleUpdateProject}
        />
      ) : null}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
