export class ApiResponse {

  static success(data: any, message = 'Success', statusCode = 200) {
    return {
      status: 'success',
      message,
      data,
      statusCode,
    };
  }


  static error(message: string, statusCode = 500, errors?: any) {
    return {
      status: 'error',
      message,
      statusCode,
      ...(errors && { errors }),
    };
  }

  static created(data: any, message = 'Resource created successfully') {
    return {
      status: 'success',
      message,
      data,
      statusCode: 201,
    };
  }

  static noContent() {
    return {
      status: 'success',
      message: 'No content',
      statusCode: 204,
    };
  }
}