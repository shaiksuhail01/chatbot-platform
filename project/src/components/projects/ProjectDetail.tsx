import React, { useState } from 'react'
import { Project } from '../../types'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { FileUpload } from '../files/FileUpload'
import { FileList } from '../files/FileList'
import { ChatInterface } from '../chat/ChatInterface'
import { 
  ArrowLeft, 
  MessageSquare, 
  FileText, 
  Settings, 
  Save,
  Loader2
} from 'lucide-react'

interface ProjectDetailProps {
  project: Project
  onBack: () => void
  onUpdateProject: (projectId: string, updates: {
    name?: string
    description?: string
    systemPrompt?: string
  }) => Promise<void>
}

type TabType = 'chat' | 'files' | 'settings'

export function ProjectDetail({ project, onBack, onUpdateProject }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const [selectedFiles, setSelectedFiles] = useState<any[]>([])
  const [fileRefreshTrigger, setFileRefreshTrigger] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
    systemPrompt: project.systemPrompt || ''
  })

  const handleFileUploadComplete = () => {
    setFileRefreshTrigger(prev => prev + 1)
  }

  const handleUpdateProject = async () => {
    setIsUpdating(true)
    try {
      await onUpdateProject(project.id, {
        name: formData.name,
        description: formData.description || undefined,
        systemPrompt: formData.systemPrompt
      })
      alert('Project updated successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to update project')
    } finally {
      setIsUpdating(false)
    }
  }

  const tabs = [
    { id: 'chat' as TabType, label: 'Chat', icon: MessageSquare },
    { id: 'files' as TabType, label: 'Files', icon: FileText },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings }
  ]

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-500">
                {project.description || 'No description'}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <ChatInterface 
            project={project} 
            onBack={onBack}
            selectedFiles={selectedFiles}
          />
        )}

        {activeTab === 'files' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Files</h2>
                <p className="text-gray-600">
                  Upload files to enhance your chatbot's knowledge and capabilities
                </p>
              </div>

              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload New Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    projectId={project.id}
                    onUploadComplete={handleFileUploadComplete}
                  />
                </CardContent>
              </Card>

              {/* File List */}
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileList
                    projectId={project.id}
                    onFileSelect={setSelectedFiles}
                    selectedFiles={selectedFiles}
                    selectable={true}
                    refreshTrigger={fileRefreshTrigger}
                  />
                </CardContent>
              </Card>

              {selectedFiles.length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">
                          {selectedFiles.length} files selected for chat context
                        </h4>
                        <p className="text-sm text-blue-700">
                          These files will be available to the AI during conversations
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('chat')}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        Go to Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Settings</h2>
                <p className="text-gray-600">
                  Configure your chatbot's behavior and personality
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Project Name *
                    </label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Customer Support Bot"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of what this chatbot does..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="systemPrompt" className="text-sm font-medium text-gray-700">
                      System Prompt *
                    </label>
                    <Textarea
                      id="systemPrompt"
                      value={formData.systemPrompt}
                      onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                      placeholder="You are a helpful assistant that..."
                      rows={6}
                    />
                    <p className="text-xs text-gray-500">
                      This defines how your chatbot will behave and respond to users.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleUpdateProject}
                  disabled={isUpdating || !formData.name.trim() || !formData.systemPrompt.trim()}
                  className="flex items-center space-x-2"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}