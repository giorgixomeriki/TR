const express              = require('express');
const router               = express.Router();
const { authenticate }     = require('../middlewares/auth.middleware');
const upload               = require('../middlewares/upload.middleware');
const attachmentController = require('../controllers/attachment.controller');

router.use(authenticate);

// Task-scoped upload + list
router.post('/tasks/:id/upload',      upload.single('file'), attachmentController.uploadAttachment);
router.get('/tasks/:id/attachments',  attachmentController.getAttachments);

// Stand-alone delete
router.delete('/attachments/:id',     attachmentController.deleteAttachment);

module.exports = router;
