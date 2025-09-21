const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// LLM Service Configuration
const LLM_SERVICES = {
  OPENAI: 'openai',
  OPENROUTER: 'openrouter'
};

// Get AI response from available services
const getAIResponse = async (messages, preferredService = null) => {
  const services = [];
  
  // Determine service priority
  if (preferredService === LLM_SERVICES.OPENAI && process.env.OPENAI_API_KEY) {
    services.push(LLM_SERVICES.OPENAI);
  } else if (preferredService === LLM_SERVICES.OPENROUTER && process.env.OPENROUTER_API_KEY) {
    services.push(LLM_SERVICES.OPENROUTER);
  }
  
  // Add remaining services as fallbacks
  if (process.env.OPENAI_API_KEY && !services.includes(LLM_SERVICES.OPENAI)) {
    services.push(LLM_SERVICES.OPENAI);
  }
  if (process.env.OPENROUTER_API_KEY && !services.includes(LLM_SERVICES.OPENROUTER)) {
    services.push(LLM_SERVICES.OPENROUTER);
  }

  // Try each service in order
  for (const service of services) {
    try {
      console.log(`Attempting to use ${service.toUpperCase()} API...`);
      
      if (service === LLM_SERVICES.OPENAI) {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
          }
        );
        
        console.log('✅ OpenAI API successful');
        return {
          content: response.data.choices[0].message.content,
          service: 'OpenAI GPT-3.5-turbo',
          usage: response.data.usage
        };
        
      } else if (service === LLM_SERVICES.OPENROUTER) {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'openai/gpt-3.5-turbo',
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
              'X-Title': 'Chatbot Platform'
            },
            timeout: 30000 // 30 second timeout
          }
        );
        
        console.log('✅ OpenRouter API successful');
        return {
          content: response.data.choices[0].message.content,
          service: 'OpenRouter GPT-3.5-turbo',
          usage: response.data.usage
        };
      }
      
    } catch (error) {
      console.error(`❌ ${service.toUpperCase()} API failed:`, {
        status: error.response?.status,
        message: error.response?.data?.error?.message || error.message,
        code: error.response?.data?.error?.code
      });
      
      // Continue to next service if this one fails
      continue;
    }
  }
  
  // If all services fail, throw error
  throw new Error('All LLM services are currently unavailable');
};
// Create new chat
router.post('/projects/:projectId/chats', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title } = req.body;

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.user.id
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const chat = await prisma.chat.create({
      data: {
        title: title || 'New Chat',
        projectId
      }
    });

    res.status(201).json({
      success: true,
      data: { chat }
    });

  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get chat messages
router.get('/chats/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verify chat belongs to user's project
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        project: {
          userId: req.user.id
        }
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    res.json({
      success: true,
      data: { messages: chat.messages }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send message and get AI response
router.post('/chats/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, fileIds } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Verify chat belongs to user's project and get project details
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        project: {
          userId: req.user.id
        }
      },
      include: {
        project: true,
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      }
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        chatId,
        role: 'user',
        content: content.trim()
      }
    });

    // Get file context if fileIds provided
    let fileContext = '';
    if (fileIds && fileIds.length > 0) {
      try {
        const files = await prisma.file.findMany({
          where: {
            openaiFileId: { in: fileIds },
            project: {
              userId: req.user.id
            }
          }
        });
        
        if (files.length > 0) {
          fileContext = `\n\nContext: The user has uploaded ${files.length} file(s) for reference:\n${files.map(f => `- ${f.originalName} (${f.mimeType})`).join('\n')}\n\nPlease consider these files when responding to the user's question.`;
        }
      } catch (error) {
        console.error('Error fetching file context:', error);
      }
    }

    // Prepare conversation history for AI with file context
    const conversationHistory = [
      {
        role: 'system',
        content: (chat.project.systemPrompt || 'You are a helpful assistant.') + fileContext
      },
      ...chat.messages.reverse().map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: content.trim()
      }
    ];

    // Get AI response
    let aiResult = null;
    
    try {
      // Try to get AI response from available services
      aiResult = await getAIResponse(conversationHistory);
      
    } catch (error) {
      console.error('All LLM services failed:', error.message);
      
      // Fallback to simulated response
      const responses = [
        `I apologize, but I'm currently experiencing connectivity issues with my AI services. However, I can still help you based on my configuration.`,
        `Based on your question about "${content.slice(0, 30)}...", I would normally provide a detailed response, but I'm currently in offline mode.`,
        `Thank you for your message. I'm temporarily unable to access my full AI capabilities, but I'm still here to assist you.`,
        `I understand you're asking about "${content.slice(0, 20)}...". While my AI services are temporarily unavailable, I can provide basic assistance.`
      ];
      
      const fallbackResponse = responses[Math.floor(Math.random() * responses.length)];
      
      aiResult = {
        content: fallbackResponse + (chat.project.systemPrompt ? `\n\nNote: I'm configured as: ${chat.project.systemPrompt.slice(0, 100)}...` : ''),
        service: 'Fallback Mode',
        usage: null
      };
    }

    // Save AI response
    const assistantMessage = await prisma.message.create({
      data: {
        chatId,
        role: 'assistant',
        content: aiResult.content
      }
    });

    // Log usage for monitoring
    if (aiResult.usage) {
      console.log(`💰 Token usage - Service: ${aiResult.service}, Input: ${aiResult.usage.prompt_tokens}, Output: ${aiResult.usage.completion_tokens}, Total: ${aiResult.usage.total_tokens}`);
    }

    res.json({
      success: true,
      data: {
        userMessage,
        assistantMessage,
        metadata: {
          service: aiResult.service,
          usage: aiResult.usage
        }
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;