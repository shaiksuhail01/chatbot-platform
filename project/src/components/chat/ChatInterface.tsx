import React, { useState, useRef, useEffect } from 'react'
import { Project, Chat, Message } from '../../types'
import { chatAPI } from '../../lib/api'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { formatDate, generateId } from '../../lib/utils'
import { Send, ArrowLeft, Bot, User, Loader2 } from 'lucide-react'

interface ChatInterfaceProps {
  project: Project
  onBack: () => void
  selectedFiles?: any[]
}

export function ChatInterface({ project, onBack, selectedFiles = [] }: ChatInterfaceProps) {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initializeChat = async () => {
      try {
        setError(null)
        // Create a new chat when component mounts
        const newChat = await chatAPI.createChat(project.id, `Chat with ${project.name}`)
        setCurrentChat(newChat)

        // Add welcome message with file context info
        let welcomeContent = `Hello! I'm your ${project.name} assistant. How can I help you today?`
        
        if (selectedFiles.length > 0) {
          welcomeContent += `\n\nI have access to ${selectedFiles.length} file(s) you've uploaded:\n${selectedFiles.map(f => `• ${f.originalName}`).join('\n')}\n\nFeel free to ask me questions about these files!`
        }

        const welcomeMessage: Message = {
          id: generateId(),
          chatId: newChat.id,
          role: 'assistant',
          content: welcomeContent,
          timestamp: new Date().toISOString()
        }
        setMessages([welcomeMessage])
      } catch (error: any) {
        console.error('Failed to initialize chat:', error)
        setError('Failed to initialize chat. Please try again.')
      }
    }

    initializeChat()
  }, [project, selectedFiles])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || !currentChat || isLoading) return

    const messageContent = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)
    setError(null)

    try {
      // Send message with file context to backend and get AI response
      const { userMessage, assistantMessage, metadata } = await chatAPI.sendMessage(
        currentChat.id, 
        messageContent,
        selectedFiles.length > 0 ? selectedFiles.map(f => f.openaiFileId).filter(Boolean) : undefined
      )
      
      // Add both messages to the chat
      setMessages(prev => [...prev, userMessage, assistantMessage])
      
      // Log service info for debugging
      if (metadata?.service) {
        console.log(`Response from: ${metadata.service}`)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setError('Failed to send message. Please try again.')
      
      // Add user message back to input if it failed
      setInputMessage(messageContent)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-500">
                {currentChat ? `Chat started ${formatDate(currentChat.createdAt)}` : 'Loading...'}
                {selectedFiles.length > 0 && ` • ${selectedFiles.length} file(s) attached`}
              </p>
            </div>
          </div>
        </div>
        
        {/* File Context Indicator */}
        {selectedFiles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedFiles.map((file) => (
              <div key={file.id} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                <span>📎 {file.originalName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">⚠️</span>
              <p className="text-red-700 text-sm">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-700"
              >
                ✕
              </Button>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-blue-600' 
                  : 'bg-gray-600'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <Card className={`p-4 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatDate(message.timestamp)}
                </p>
              </Card>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-3xl">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <Card className="p-4 bg-white">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  <p className="text-sm text-gray-500">Thinking...</p>
                </div>
              </Card>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-6">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
            autoFocus
          />
          <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}