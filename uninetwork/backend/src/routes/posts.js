const express = require('express');
const { getFeed, createPost, getPostComments, addComment, toggleLike, deletePost } = require('../controllers/postController');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

router.get('/feed', authMiddleware, getFeed);
router.post('/', authMiddleware, createPost);
router.get('/:postId/comments', authMiddleware, getPostComments);
router.post('/:postId/comments', authMiddleware, addComment);
router.post('/:postId/like', authMiddleware, toggleLike);
router.delete('/:id', authMiddleware, deletePost);

module.exports = router;
