export class ApiResponse {
  /**
   * Success response
   */
  static success(data: any, message = 'Success', statusCode = 200) {
    return {
      status: 'success',
      message,
      data,
      statusCode,
    };
  }

  /**
   * Error response
   */
  static error(message: string, statusCode = 500, errors?: any) {
    return {
      status: 'error',
      message,
      statusCode,
      ...(errors && { errors }),
    };
  }

  /**
   * Created response (201)
   */
  static created(data: any, message = 'Resource created successfully') {
    return {
      status: 'success',
      message,
      data,
      statusCode: 201,
    };
  }

  /**
   * No content response (204)
   */
  static noContent() {
    return {
      status: 'success',
      message: 'No content',
      statusCode: 204,
    };
  }

  /**
   * Paginated response
   */
  static paginated(
    data: any[],
    page: number,
    limit: number,
    total: number,
    message = 'Data retrieved successfully'
  ) {
    return {
      status: 'success',
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      statusCode: 200,
    };
  }
}