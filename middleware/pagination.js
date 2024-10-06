const Blog = require('../models/blog'); // Correct model import

module.exports = async (req, res, next) => {
  try {
    // Default pagination settings
    const defaultSize = 20;
    const maxSize = 20;
    let size = parseInt(req.query.size) || defaultSize;
    let page = parseInt(req.query.page) || 1;

    // Limit the size to a maximum
    if (size < 1 || size > maxSize) size = defaultSize;
    if (page < 1) page = 1;

    // Get the number of results
    const numberOfResults = await Blog.find(req.findFilter).countDocuments();

    // Calculate total pages
    const totalPages = Math.ceil(numberOfResults / size);

    // Ensure the page is within valid range
    if (page > totalPages) page = totalPages;

    // Calculate the pagination details
    const start = (page - 1) * size;
    const end = page * size;

    // Prepare the pagination object for the request
    req.pagination = {
      page,
      sizePerPage: size,
      totalPages,
      start,
      end,
      numberOfResults
    };

    // Add previous and next page details if applicable
    if (page > 1) {
      req.pagination.previousPage = {
        page: page - 1,
        limit: size,
      };
    }
    if (page < totalPages) {
      req.pagination.nextPage = {
        page: page + 1,
        limit: size,
      };
    }

    // Set page info for the response
    req.pageInfo = {
      results: numberOfResults,
      totalPages,
      currentPage: page,
    };
    if (req.pagination.previousPage) req.pageInfo.previousPage = req.pagination.previousPage;
    if (req.pagination.nextPage) req.pageInfo.nextPage = req.pagination.nextPage;

    next(); // Proceed to the next middleware
  } catch (err) {
    err.source = 'pagination middleware';
    next(err); // Pass the error to the error handler
  }
};
