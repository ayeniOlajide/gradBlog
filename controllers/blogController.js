const Blog = require('../models/blog')
const User = require('../models/user')

// Create a new blog
const createBlog = async (req, res, next) => {
  try {
    const { title, description, tags, body } = req.body;

    // Validate required fields
    if (!title || !body) {
      return res.status(400).json({
        status: false,
        error: 'Title and body are required to create a blog',
      });
    }

    // Check if req.user exists (ensure authentication middleware is working)
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        status: false,
        error: 'Unauthorized. User information is missing.',
      });
    }

    // Check if a blog with the same title already exists
    const existingBlog = await Blog.findOne({ title });
    if (existingBlog) {
      return res.status(400).json({
        status: false,
        error: 'A blog with this title already exists. Please choose a different title.',
      });
    }

    // Create new blog
    const newBlog = new Blog({
      title,
      description: description || title, // Use title as description if description is not provided
      tags,
      author: req.user._id,
      body,
      state: 'draft', // Default state is draft
      reading_time: calculateReadingTime(body),
    });

    // Save the new blog post
    const createdBlog = await newBlog.save();

    // Ensure the articles array exists in user object before using concat
    if (!req.user.articles) {
      req.user.articles = [];  // Initialize if not present
    }
    req.user.articles = req.user.articles.concat(createdBlog._id);
    await req.user.save();

    // Send success response
    return res.status(201).json({
      status: true,
      message: 'Blog created successfully',
      data: createdBlog,
    });
  } catch (error) {
    // Handle unique field error from MongoDB
    if (error.code === 11000) {
      return res.status(400).json({
        status: false,
        error: 'A blog with this title already exists. Please choose a different title.',
      });
    }
    error.source = 'creating a blog';
    next(error);
  }
};


// Get a list of blogs with pagination and filters
const getBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find(req.findFilter)
      .select(req.fields)
      .populate('author', { username: 1 })
      .skip(req.pagination.start)
      .limit(req.pagination.sizePerPage);

    const pageInfo = req.pageInfo;

    return res.json({
      status: true,
      pageInfo,
      data: blogs,
    });
  } catch (err) {
    err.source = 'get blogs controller';
    next(err);
  }
};
const blogFilterMiddleware = (req, res, next) => {
  const { page = 1, limit = 10, author, tag } = req.query;

  // Build filter query
  const findFilter = {};
  if (author) findFilter.author = author;
  if (tag) findFilter.tags = tag;

  // Pagination info
  const sizePerPage = parseInt(limit, 10);
  const start = (parseInt(page, 10) - 1) * sizePerPage;

  req.findFilter = findFilter;
  req.pagination = { start, sizePerPage };
  req.pageInfo = { page, sizePerPage };
  next();
};


// Get a single blog by ID
const getBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id).populate('author', { username: 1 });

    if (!blog) {
      return res.status(404).json({
        status: false,
        error: 'Blog not found',
      });
    }

    // Restrict access to non-published blogs
    if (blog.state !== 'published' && req.user._id.toString() !== blog.author._id.toString()) {
      return res.status(403).json({
        status: false,
        error: 'You do not have permission to view this blog',
      });
    }

    // Update blog read count
    blog.read_count += 1;
    await blog.save();

    return res.json({
      status: true,
      data: blog,
    });
  } catch (err) {
    err.source = 'get blog controller';
    next(err);
  }
};

// Update an existing blog
const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        status: false,
        error: 'Blog not found',
      });
    }

    // Only allow the owner or admin to update the blog
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: false,
        error: 'You do not have permission to update this blog',
      });
    }

    Object.assign(blog, updates);
    if (updates.body) {
      blog.reading_time = calculateReadingTime(updates.body);
    }
    const updatedBlog = await blog.save();

    return res.json({
      status: true,
      message: 'Blog updated successfully',
      data: updatedBlog,
    });
  } catch (err) {
    err.source = 'update blog controller';
    next(err);
  }
};

// Delete a blog
const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        status: false,
        error: 'Blog not found',
      });
    }

    // Only allow the owner or admin to delete the blog
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: false,
        error: 'You do not have permission to delete this blog',
      });
    }

    await blog.remove();

    return res.json({
      status: true,
      message: 'Blog deleted successfully',
    });
  } catch (err) {
    err.source = 'delete blog controller';
    next(err);
  }
};

// Calculate reading time based on word count
function calculateReadingTime(text) {
  const wordsPerMinute = 200; // Average reading speed
  const words = text.split(' ').length;
  const time = Math.ceil(words / wordsPerMinute);
  return `${time} min read`;
}

module.exports = {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
  blogFilterMiddleware,
};
