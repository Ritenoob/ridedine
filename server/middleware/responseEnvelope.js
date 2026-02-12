/**
 * Response Envelope Standard
 * Provides consistent API response format across all endpoints
 */

/**
 * Success response envelope
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default 200)
 */
function successResponse(data, message = null, statusCode = 200) {
  const response = {
    success: true,
    data
  };
  
  if (message) {
    response.message = message;
  }
  
  return {
    statusCode,
    body: response
  };
}

/**
 * Error response envelope
 * @param {string} error - Error message
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {*} details - Optional error details (only in development)
 */
function errorResponse(error, statusCode = 500, details = null) {
  const response = {
    success: false,
    error
  };
  
  // Include details only in development mode
  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }
  
  return {
    statusCode,
    body: response
  };
}

/**
 * Pagination envelope
 * @param {Array} items - Array of items
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} perPage - Items per page
 */
function paginatedResponse(items, total, page, perPage) {
  return successResponse({
    items,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
      hasMore: page * perPage < total
    }
  });
}

/**
 * Express middleware to send success response
 */
function sendSuccess(res, data, message = null, statusCode = 200) {
  const envelope = successResponse(data, message, statusCode);
  res.status(envelope.statusCode).json(envelope.body);
}

/**
 * Express middleware to send error response
 */
function sendError(res, error, statusCode = 500, details = null) {
  const envelope = errorResponse(error, statusCode, details);
  res.status(envelope.statusCode).json(envelope.body);
}

/**
 * Express middleware to send paginated response
 */
function sendPaginated(res, items, total, page, perPage) {
  const envelope = paginatedResponse(items, total, page, perPage);
  res.status(envelope.statusCode).json(envelope.body);
}

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  sendSuccess,
  sendError,
  sendPaginated
};
