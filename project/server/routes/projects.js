const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all projects for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { chats: true }
        },
        chats: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            title: true,
            updatedAt: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { projects }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new project
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, systemPrompt } = req.body;

    // Validation
    if (!name || !systemPrompt) {
      return res.status(400).json({
        success: false,
        message: 'Name and system prompt are required'
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        systemPrompt,
        userId: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single project
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        chats: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: { project }
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update project
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, systemPrompt } = req.body;

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name: name || existingProject.name,
        description,
        systemPrompt: systemPrompt || existingProject.systemPrompt
      }
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project }
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete project
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await prisma.project.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;