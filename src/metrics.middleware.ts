import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Histogram } from 'prom-client';

interface ExpressRoute {
  path: string;
}

export const httpRequestDuration = new Histogram({
  name: 'http_response_time_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const end = httpRequestDuration.startTimer();

    res.on('finish', () => {
      const route = (req.route as ExpressRoute | undefined)?.path ?? req.path;
      end({
        method: req.method,
        route,
        status_code: res.statusCode,
      });
    });

    next();
  }
}
