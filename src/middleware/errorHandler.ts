import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import axios from 'axios';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle AppError
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }

  // Handle Axios errors
  if (axios.isAxiosError(error)) {
    return res.status(error.response?.status || 500).json({
      error: {
        code: 'EXTERNAL_SERVICE_ERROR',
        message: 'External service error',
        details: {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        }
      }
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
  });
}
