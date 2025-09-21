import React, { useState, useEffect } from 'react'
import { Project } from '../../types'
import { projectsAPI } from '../../lib/api'
import { ProjectCard } from './ProjectCard'
import { CreateProjectModal } from '../projects/CreateProjectModal'
import { EditProjectModal } from '../projects/EditProjectModal'
import { Button } from '../ui/Button'
import { Plus, Search } from 'lucide-react'
import { Input } from '../ui/Input'
import { useAuth } from '../../contexts/AuthContext'

interface DashboardProps {
  onOpenProject: (project: Project) => void
}

export function Dashboard({ onOpenProject }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const userProjects = await projectsAPI.getProjects()
        setProjects(userProjects)
      } catch (error: any) {
        console.error('Failed to load projects:', error)
        setError('Failed to load projects. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProjects()
  }, [])

  const handleCreateProject = async (projectData: {
    name: string
    description?: string
    systemPrompt: string
  }) => {
    try {
      const newProject = await projectsAPI.createProject(projectData)
      setProjects(prev => [newProject, ...prev])
      setShowCreateModal(false)
    } catch (error: any) {
      console.error('Failed to create project:', error)
      throw new Error(error.response?.data?.message || 'Failed to create project')
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setShowEditModal(true)
  }

  const handleUpdateProject = async (projectId: string, updates: {
    name?: string
    description?: string
    systemPrompt?: string
  }) => {
    try {
      const updatedProject = await projectsAPI.updateProject(projectId, updates)
      setProjects(prev => prev.map(project => 
        project.id === projectId ? updatedProject : project
      ))
      setShowEditModal(false)
      setEditingProject(null)
    } catch (error: any) {
      console.error('Failed to update project:', error)
      throw new Error(error.response?.data?.message || 'Failed to update project')
    }
  }

  const handleDeleteProject = async (project: Project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      try {
        await projectsAPI.deleteProject(project.id)
        setProjects(prev => prev.filter(p => p.id !== project.id))
      } catch (error: any) {
        console.error('Failed to delete project:', error)
        alert('Failed to delete project. Please try again.')
      }
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Projects</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
          <p className="text-gray-600 mt-1">Manage your chatbot projects and agents</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {projects.length === 0 ? 'No projects yet' : 'No projects found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {projects.length === 0 
              ? 'Create your first chatbot project to get started'
              : 'Try adjusting your search terms'
            }
          </p>
          {projects.length === 0 && (
            <Button onClick={() => setShowCreateModal(true)}>Create Your First Project</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={onOpenProject}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateProject={handleCreateProject}
      />

      <EditProjectModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        project={editingProject}
        onUpdateProject={handleUpdateProject}
      />
    </div>
  )
}