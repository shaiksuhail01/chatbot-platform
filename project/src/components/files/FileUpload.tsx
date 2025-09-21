import React, { useState, useRef } from 'react'
import { Button } from '../ui/Button'
import { Upload, X, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FileUploadProps {
  projectId: string
  onUploadComplete: () => void
  className?: string
}

interface UploadFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

export function FileUpload({ projectId, onUploadComplete, className }: FileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supportedTypes = [
    '.txt', '.md', '.pdf', '.doc', '.docx', 
    '.csv', '.json', '.js', '.ts', '.tsx', 
    '.jsx', '.py', '.html', '.css'
  ]

  const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      file,
      id: generateId(),
      status: 'pending',
      progress: 0
    }))

    setFiles(prev => [...prev, ...uploadFiles])
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      files.forEach(({ file }) => {
        formData.append('files', file)
      })

      // Update all files to uploading status
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const, progress: 50 })))

      const response = await fetch(`https://chatbot-platform-cxqh.onrender.com/api/files/projects/${projectId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        // Update files with success status
        setFiles(prev => prev.map(f => ({ ...f, status: 'success' as const, progress: 100 })))
        
        // Clear files after a delay
        setTimeout(() => {
          setFiles([])
          onUploadComplete()
        }, 2000)
      } else {
        // Update files with error status
        setFiles(prev => prev.map(f => ({ 
          ...f, 
          status: 'error' as const, 
          error: result.message || 'Upload failed' 
        })))
      }

    } catch (error) {
      console.error('Upload error:', error)
      setFiles(prev => prev.map(f => ({ 
        ...f, 
        status: 'error' as const, 
        error: 'Network error' 
      })))
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Files
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supported: {supportedTypes.join(', ')}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          Browse Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={supportedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Selected Files</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getStatusIcon(uploadFile.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                    {uploadFile.error && (
                      <p className="text-xs text-red-600 mt-1">
                        {uploadFile.error}
                      </p>
                    )}
                  </div>
                </div>
                
                {uploadFile.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(uploadFile.id)}
                    className="h-8 w-8 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}

                {uploadFile.status === 'uploading' && (
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadFile.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={uploadFiles}
              disabled={isUploading || files.every(f => f.status !== 'pending')}
              className="flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload {files.filter(f => f.status === 'pending').length} Files</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}