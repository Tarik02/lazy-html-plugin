import * as Express from 'express';

export class RedirectMiddleware {
  constructor(
    protected readonly url: string,
  ) {
  }

  handler = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    if (req.method === 'GET' && req.path === '/') {
      res.redirect(this.url);
    } else {
      next();
    }
  }
}
