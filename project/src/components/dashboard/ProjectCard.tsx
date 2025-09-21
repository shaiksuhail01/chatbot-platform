import React from 'react'
import { Project } from '../../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { formatDate } from '../../lib/utils'
import { MessageSquare, Settings, Trash2 } from 'lucide-react'

interface ProjectCardProps {
  project: Project
  onOpen: (project: Project) => void
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

export function ProjectCard({ project, onOpen, onEdit, onDelete }: ProjectCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={() => onOpen(project)}>
            <CardTitle className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              {project.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {project.description || 'No description provided'}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-1 ml-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(project)
              }}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(project)
              }}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Created {formatDate(project.createdAt)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpen(project)}
            className="flex items-center space-x-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Open Chat</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}