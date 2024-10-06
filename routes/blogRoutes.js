const router = require('express').Router();
const {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
  blogFilterMiddleware
} = require('../controllers/blogController');

const { redisCachingMiddleware } = require('../helpers/redis'); // if needed
const verifyToken = require('../middleware/verifyToken'); // Ensure the user is authenticated

// Route to create a blog (requires authentication)
router.post('/', verifyToken, createBlog);

// Route to get a list of blogs with pagination and filters (optional caching)
router.get('/', blogFilterMiddleware, getBlogs);

// Route to get a single blog by ID
router.get('/:id', getBlog);

// Route to update a blog by ID (requires authentication)
router.put('/:id', verifyToken, updateBlog);

// Route to delete a blog by ID (requires authentication)
router.delete('/:id', verifyToken, deleteBlog);

module.exports = router;
