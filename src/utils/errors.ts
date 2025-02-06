export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static notFound(message: string, details?: any) {
    return new AppError(message, 404, 'NOT_FOUND', details);
  }

  static badRequest(message: string, details?: any) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string, details?: any) {
    return new AppError(message, 401, 'UNAUTHORIZED', details);
  }

  static serviceUnavailable(message: string, details?: any) {
    return new AppError(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}
