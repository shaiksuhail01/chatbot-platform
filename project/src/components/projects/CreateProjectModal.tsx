import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Loader2 } from 'lucide-react'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (project: {
    name: string
    description?: string
    systemPrompt: string
  }) => Promise<void>
}

export function CreateProjectModal({ isOpen, onClose, onCreateProject }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      await onCreateProject({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        systemPrompt: formData.systemPrompt.trim()
      })
      
      // Reset form
      setFormData({ name: '', description: '', systemPrompt: '' })
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to create project. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ name: '', description: '', systemPrompt: '' })
      setErrors({})
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-700">
            Project Name *
          </label>
          <Input
            id="name"
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
          <label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description
          </label>
          <Textarea
            id="description"
            placeholder="Brief description of what this chatbot does..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            disabled={isLoading}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="systemPrompt" className="text-sm font-medium text-gray-700">
            System Prompt *
          </label>
          <Textarea
            id="systemPrompt"
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
          <p className="text-xs text-gray-500">
            This defines how your chatbot will behave and respond to users.
          </p>
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
                Creating...
              </>
            ) : (
              'Create Project'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}