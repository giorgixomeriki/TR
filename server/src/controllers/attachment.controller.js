const prisma = require('../lib/prisma');
const fs     = require('fs');
const path   = require('path');

/* POST /api/tasks/:id/upload */
const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided.' });
    }

    // Verify the task belongs to the authenticated user
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!task) {
      fs.unlinkSync(req.file.path); // clean up orphaned upload
      return res.status(404).json({ message: 'Task not found.' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const attachment = await prisma.attachment.create({
      data: {
        filename: req.file.originalname,
        url:      `${baseUrl}/uploads/${req.file.filename}`,
        taskId:   req.params.id,
      },
    });

    res.status(201).json(attachment);
  } catch (error) {
    next(error);
  }
};

/* GET /api/tasks/:id/attachments */
const getAttachments = async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const attachments = await prisma.attachment.findMany({
      where:   { taskId: req.params.id },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json(attachments);
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/attachments/:id */
const deleteAttachment = async (req, res, next) => {
  try {
    const attachment = await prisma.attachment.findUnique({
      where:   { id: req.params.id },
      include: { task: { select: { userId: true } } },
    });

    if (!attachment || attachment.task.userId !== req.user.id) {
      return res.status(404).json({ message: 'Attachment not found.' });
    }

    // Remove file from disk
    const uploadsDir = path.join(__dirname, '../../uploads');
    const filename   = attachment.url.split('/uploads/')[1];
    const filePath   = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.attachment.delete({ where: { id: req.params.id } });

    res.status(200).json({ message: 'Attachment deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadAttachment, getAttachments, deleteAttachment };
