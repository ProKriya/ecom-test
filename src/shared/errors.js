/**
 * Custom error classes for the e-commerce backend
 */

/**
 * Base error class for all custom errors
 */
export class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500);
  }
}

/**
 * Error handler middleware helper
 * @param {AppError} error - Error object
 * @returns {Response} Error response
 */
export function handleAppError(error) {
  console.error('Error:', error);
  return new Response(
    JSON.stringify({
      error: error.message,
      status: error.status
    }),
    {
      status: error.status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

