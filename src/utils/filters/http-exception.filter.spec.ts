import { GlobalHttpExceptionFilter } from './http-exception.filter';
import { BadRequestException, HttpStatus } from '@nestjs/common';

describe('GlobalHttpExceptionFilter', () => {
  let filter: GlobalHttpExceptionFilter;

  beforeEach(() => {
    filter = new GlobalHttpExceptionFilter();
  });

  it('should format HttpException according to standard error envelope', () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockHost: any = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
      }),
    };

    const exception = new BadRequestException('Reason description');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Reason description',
        timestamp: expect.any(String),
      }),
    );
  });

  it('should handle array validation errors and join them', () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockHost: any = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
      }),
    };

    const exception = new BadRequestException([
      'email must be an email',
      'password must not be empty',
    ]);
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        message: 'email must be an email; password must not be empty',
        timestamp: expect.any(String),
      }),
    );
  });
});
