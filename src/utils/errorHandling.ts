interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

class AppError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

export const handleError = (error: any): ErrorResponse => {
  console.error('Error occurred:', error);

  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      details: import.meta.env.DEV ? error.details : undefined
    };
  }

  // Handle network errors
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return {
      message: 'Unable to connect to the server. Please check your internet connection.',
      code: 'NETWORK_ERROR'
    };
  }

  // Handle API errors
  if (error.response) {
    return {
      message: error.response.data?.message || 'An error occurred while processing your request.',
      code: error.response.status.toString(),
      details: import.meta.env.DEV ? error.response.data : undefined
    };
  }

  // Default error
  return {
    message: import.meta.env.DEV ? error.message : 'An unexpected error occurred.',
    code: 'INTERNAL_ERROR',
    details: import.meta.env.DEV ? error : undefined
  };
};

export const isProduction = () => import.meta.env.PROD;
export const isDevelopment = () => import.meta.env.DEV;

export { AppError };