import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Project } from '../../types'
import { Loader2 } from 'lucide-react'

interface EditProjectModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  onUpdateProject: (projectId: string, updates: {
    name?: string
    description?: string
    systemPrompt?: string
  }) => Promise<void>
}

export function EditProjectModal({ isOpen, onClose, project, onUpdateProject }: EditProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        systemPrompt: project.systemPrompt || ''
      })
    }
  }, [project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return

    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    }
    if (!formData.systemPrompt.trim()) {
      newErrors.systemPrompt = 'System prompt is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    
    try {
      await onUpdateProject(project.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        systemPrompt: formData.systemPrompt.trim()
      })
      
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to update project. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setErrors({})
      onClose()
    }
  }

  if (!project) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Project"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="edit-name" className="text-sm font-medium text-gray-700">
            Project Name *
          </label>
          <Input
            id="edit-name"
            type="text"
            placeholder="e.g., Customer Support Bot"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            disabled={isLoading}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-description" className="text-sm font-medium text-gray-700">
            Description
          </label>
          <Textarea
            id="edit-description"
            placeholder="Brief description of what this chatbot does..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            disabled={isLoading}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-systemPrompt" className="text-sm font-medium text-gray-700">
            System Prompt *
          </label>
          <Textarea
            id="edit-systemPrompt"
            placeholder="You are a helpful assistant that..."
            value={formData.systemPrompt}
            onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
            disabled={isLoading}
            rows={4}
            className={errors.systemPrompt ? 'border-red-500' : ''}
          />
          {errors.systemPrompt && (
            <p className="text-sm text-red-600">{errors.systemPrompt}</p>
          )}
        </div>

        {errors.general && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {errors.general}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Project'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}