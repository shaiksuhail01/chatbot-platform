import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { formatDate } from '../../lib/utils'
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  X
} from 'lucide-react'
import { filesAPI } from '../../lib/api'

interface File {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  status: 'uploading' | 'processed' | 'error'
  openaiFileId?: string
  errorMessage?: string
  createdAt: string
}

interface FileListProps {
  projectId: string
  onFileSelect?: (files: File[]) => void
  selectedFiles?: File[]
  selectable?: boolean
  refreshTrigger?: number
}

export function FileList({ 
  projectId, 
  onFileSelect, 
  selectedFiles = [], 
  selectable = false,
  refreshTrigger = 0
}: FileListProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<{ file: File; content: string } | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [projectId, refreshTrigger])

  const loadFiles = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const projectFiles = await filesAPI.getProjectFiles(projectId)
      setFiles(projectFiles)
    } catch (error: any) {
      console.error('Failed to load files:', error)
      setError('Failed to load files')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (file: File) => {
    if (!selectable || !onFileSelect) return

    const isSelected = selectedFiles.some(f => f.id === file.id)
    const newSelection = isSelected
      ? selectedFiles.filter(f => f.id !== file.id)
      : [...selectedFiles, file]
    
    onFileSelect(newSelection)
  }

  const handleDeleteFile = async (file: File) => {
    if (!window.confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
      return
    }

    try {
      await filesAPI.deleteFile(file.id)
      setFiles(prev => prev.filter(f => f.id !== file.id))
      
      // Remove from selection if selected
      if (onFileSelect && selectedFiles.some(f => f.id === file.id)) {
        onFileSelect(selectedFiles.filter(f => f.id !== file.id))
      }
    } catch (error: any) {
      console.error('Failed to delete file:', error)
      alert('Failed to delete file. Please try again.')
    }
  }

  const handlePreviewFile = async (file: File) => {
    if (file.status !== 'processed' || !file.openaiFileId) {
      alert('File is not ready for preview')
      return
    }

    setIsLoadingPreview(true)
    try {
      const content = await filesAPI.getFileContent(file.id)
      setPreviewFile({ file, content })
    } catch (error: any) {
      console.error('Failed to load file content:', error)
      alert('Failed to load file content')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    return <FileText className="h-5 w-5 text-blue-500" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'uploading':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (file: File) => {
    switch (file.status) {
      case 'processed':
        return 'Ready'
      case 'uploading':
        return 'Processing...'
      case 'error':
        return file.errorMessage || 'Error'
      default:
        return 'Unknown'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading files...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadFiles} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded</h3>
        <p className="text-gray-600">Upload files to enhance your chatbot's knowledge</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {files.map((file) => {
          const isSelected = selectedFiles.some(f => f.id === file.id)
          
          return (
            <Card 
              key={file.id} 
              className={`transition-all ${
                selectable 
                  ? `cursor-pointer hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}` 
                  : ''
              }`}
              onClick={() => selectable && handleFileSelect(file)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(file.mimeType)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {file.originalName}
                      </h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </span>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(file.status)}
                          <span className="text-xs text-gray-500">
                            {getStatusText(file)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(file.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteFile(file)
                      }}
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}