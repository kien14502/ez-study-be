/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpException, InternalServerErrorException, Logger } from '@nestjs/common';

export function WithTryCatch(errorMessage = 'Internal server error'): MethodDecorator {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== 'function') {
      throw new Error(`@WithTryCatch chỉ có thể gắn vào method: ${String(propertyKey)}`);
    }

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Nếu là HttpException -> ném lại
        if (error instanceof HttpException) throw error;

        // Dùng logger nếu có, nếu không tạo logger mặc định
        const logger: Logger =
          this?.logger instanceof Logger ? this.logger : new Logger(target.constructor?.name || 'UnknownService');

        const errMsg = error instanceof Error ? error.message : String(error);
        const errStack = error instanceof Error ? error.stack : undefined;

        logger.error(`Error in ${target.constructor.name}.${String(propertyKey)}: ${errMsg}`, errStack);

        // Ném lỗi chung
        throw new InternalServerErrorException(errorMessage);
      }
    };

    return descriptor;
  };
}
