import pino from 'pino';
import pinoHttp from 'pino-http';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');
mkdir(logsDir, { recursive: true }).catch(console.error);

let logger: pino.Logger;

if (process.env.NODE_ENV !== 'production') {
  const streams: pino.StreamEntry[] = [
    {
      level: 'info',
      stream: pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }),
    },
    {
      level: 'info',
      stream: createWriteStream(path.join(logsDir, 'app.log'), { flags: 'a' }),
    },
    {
      level: 'error',
      stream: createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' }),
    },
  ];

  logger = pino(
    {
      level: process.env.LOG_LEVEL || 'info',
    },
    pino.multistream(streams)
  );
} else {
  const streams: pino.StreamEntry[] = [
    {
      level: 'info',
      stream: pino.destination({
        dest: path.join(logsDir, 'app.log'),
        sync: false,
        mkdir: true,
      }),
    },
    {
      level: 'error',
      stream: pino.destination({
        dest: path.join(logsDir, 'error.log'),
        sync: false,
        mkdir: true,
      }),
    },
  ];

  logger = pino(
    {
      level: process.env.LOG_LEVEL || 'info',
    },
    pino.multistream(streams)
  );
}

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) =>
    (req.headers['x-request-id'] as string) || require('crypto').randomUUID(),
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: (req as any).user?.id || 'anonymous',
    }),
    res: (res) => ({ statusCode: res.statusCode }),
    err: pino.stdSerializers.err,
  },
});

export default logger;