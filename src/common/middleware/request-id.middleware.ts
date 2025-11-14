import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestIdMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4();
    req['id'] = requestId;
    res.setHeader('X-Request-Id', requestId);

    this.logger.log(`[${requestId}][${req.method}]` + req.url);
    next();
  }
}
