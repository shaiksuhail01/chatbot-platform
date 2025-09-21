const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 512 * 1024 * 1024, // 512MB limit (OpenAI's limit)
  },
  fileFilter: (req, file, cb) => {
    // OpenAI supported file types
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/json',
      'text/javascript',
      'application/javascript',
      'text/typescript',
      'text/jsx',
      'text/tsx',
      'text/python',
      'text/html',
      'text/css',
      'application/x-python-code',
      'text/x-python'
    ];

    // Also allow by extension for code files
    const allowedExtensions = ['.txt', '.md', '.pdf', '.doc', '.docx', '.csv', '.json', 
                              '.js', '.ts', '.tsx', '.jsx', '.py', '.html', '.css'];
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not supported. Allowed types: ${allowedExtensions.join(', ')}`));
    }
  }
});

// Upload file to OpenAI Files API
const uploadToOpenAI = async (filePath, filename, purpose = 'assistants') => {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('purpose', purpose);

    const response = await axios.post('https://api.openai.com/v1/files', formData, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders()
      },
      timeout: 60000 // 60 second timeout for large files
    });

    return response.data;
  } catch (error) {
    console.error('OpenAI upload error:', error.response?.data || error.message);
    throw error;
  }
};

// Upload files to project
router.post('/projects/:projectId/upload', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const { projectId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided'
      });
    }

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.user.id
      }
    });

    if (!project) {
      // Clean up uploaded files
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        // Create file record in database
        const fileRecord = await prisma.file.create({
          data: {
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            projectId: projectId,
            status: 'uploading'
          }
        });

        // Upload to OpenAI in background
        try {
          const openaiFile = await uploadToOpenAI(file.path, file.originalname);
          
          // Update file record with OpenAI file ID
          await prisma.file.update({
            where: { id: fileRecord.id },
            data: {
              openaiFileId: openaiFile.id,
              status: 'processed'
            }
          });

          uploadedFiles.push({
            ...fileRecord,
            openaiFileId: openaiFile.id,
            status: 'processed'
          });

        } catch (openaiError) {
          console.error('OpenAI upload failed for file:', file.originalname, openaiError.message);
          
          // Update status to error but keep the file
          await prisma.file.update({
            where: { id: fileRecord.id },
            data: {
              status: 'error',
              errorMessage: 'Failed to upload to OpenAI'
            }
          });

          uploadedFiles.push({
            ...fileRecord,
            status: 'error',
            errorMessage: 'Failed to upload to OpenAI'
          });
        }

        // Clean up local file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

      } catch (error) {
        console.error('File processing error:', error);
        errors.push({
          filename: file.originalname,
          error: error.message
        });

        // Clean up local file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      data: {
        files: uploadedFiles,
        errors: errors
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up any uploaded files
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'File upload failed'
    });
  }
});

// Get files for a project
router.get('/projects/:projectId/files', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

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

    const files = await prisma.file.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: { files }
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve files'
    });
  }
});

// Delete file
router.delete('/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Find file and verify ownership
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        project: {
          userId: req.user.id
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete from OpenAI if it exists
    if (file.openaiFileId && process.env.OPENAI_API_KEY) {
      try {
        await axios.delete(`https://api.openai.com/v1/files/${file.openaiFileId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          }
        });
      } catch (openaiError) {
        console.error('Failed to delete from OpenAI:', openaiError.message);
        // Continue with local deletion even if OpenAI deletion fails
      }
    }

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId }
    });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
});

// Get file content (for preview)
router.get('/:fileId/content', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Find file and verify ownership
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        project: {
          userId: req.user.id
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    if (!file.openaiFileId) {
      return res.status(400).json({
        success: false,
        message: 'File not processed yet'
      });
    }

    // Get file content from OpenAI
    try {
      const response = await axios.get(`https://api.openai.com/v1/files/${file.openaiFileId}/content`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      });

      res.json({
        success: true,
        data: {
          content: response.data,
          filename: file.originalName,
          mimeType: file.mimeType
        }
      });

    } catch (openaiError) {
      console.error('Failed to get file content from OpenAI:', openaiError.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve file content'
      });
    }

  } catch (error) {
    console.error('Get file content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve file content'
    });
  }
});

module.exports = router;