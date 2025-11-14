import { Params } from 'nestjs-pino';

export const loggerConfig = (): Params => ({
  pinoHttp: {
    transport: {
      level: 'silent',
      target: 'pino-pretty',
      options: {
        colorize: true,
        singleLine: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname,context,res.headers,req.headers,req.remoteAddress,req.remotePort',
      },
    },
    serializers: {
      req: (req) => {
        return req;
      },
      res: (res) => {
        return res;
      },
    },
  },
});
