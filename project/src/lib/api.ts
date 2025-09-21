import axios from 'axios'
import { User, Project, Chat, Message, ApiResponse } from '../types'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

// Auth API calls
export const authAPI = {
  register: async (email: string, password: string, name?: string): Promise<{ user: User; token: string }> => {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', {
      email,
      password,
      name
    })
    return response.data.data!
  },

  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', {
      email,
      password
    })
    return response.data.data!
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me')
    return response.data.data!.user
  }
}

// Projects API calls
export const projectsAPI = {
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get<ApiResponse<{ projects: Project[] }>>('/projects')
    return response.data.data!.projects
  },

  createProject: async (projectData: {
    name: string
    description?: string
    systemPrompt: string
  }): Promise<Project> => {
    const response = await api.post<ApiResponse<{ project: Project }>>('/projects', projectData)
    return response.data.data!.project
  },

  getProject: async (projectId: string): Promise<Project> => {
    const response = await api.get<ApiResponse<{ project: Project }>>(`/projects/${projectId}`)
    return response.data.data!.project
  },

  updateProject: async (projectId: string, updates: {
    name?: string
    description?: string
    systemPrompt?: string
  }): Promise<Project> => {
    const response = await api.put<ApiResponse<{ project: Project }>>(`/projects/${projectId}`, updates)
    return response.data.data!.project
  },

  deleteProject: async (projectId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}`)
  }
}

// Chat API calls
export const chatAPI = {
  createChat: async (projectId: string, title?: string): Promise<Chat> => {
    const response = await api.post<ApiResponse<{ chat: Chat }>>(`/chat/projects/${projectId}/chats`, {
      title: title || 'New Chat'
    })
    return response.data.data!.chat
  },

  getChatMessages: async (chatId: string): Promise<Message[]> => {
    const response = await api.get<ApiResponse<{ messages: Message[] }>>(`/chat/chats/${chatId}/messages`)
    return response.data.data!.messages
  },

  sendMessage: async (chatId: string, content: string): Promise<{
    userMessage: Message
    assistantMessage: Message
    metadata?: any
  }> => {
    const response = await api.post<ApiResponse<{
      userMessage: Message
      assistantMessage: Message
      metadata?: any
    }>>(`/chat/chats/${chatId}/messages`, { content })
    return response.data.data!
  }
}

// Health check
export const healthAPI = {
  checkHealth: async () => {
    const response = await api.get('/health')
    return response.data
  }
}

export default api
// Files API calls
export const filesAPI = {
  uploadFiles: async (projectId: string, files: FileList): Promise<{
    files: any[]
    errors: any[]
  }> => {
    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('files', file)
    })

    const response = await api.post<ApiResponse<{
      files: any[]
      errors: any[]
    }>>(`/files/projects/${projectId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data.data!
  },

  getProjectFiles: async (projectId: string): Promise<any[]> => {
    const response = await api.get<ApiResponse<{ files: any[] }>>(`/files/projects/${projectId}/files`)
    return response.data.data!.files
  },

  deleteFile: async (fileId: string): Promise<void> => {
    await api.delete(`/files/files/${fileId}`)
  },

  getFileContent: async (fileId: string): Promise<string> => {
    const response = await api.get<ApiResponse<{
      content: string
      filename: string
      mimeType: string
    }>>(`/files/${fileId}/content`)
    return response.data.data!.content
  }
}
