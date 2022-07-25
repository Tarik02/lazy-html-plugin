import * as Express from 'express';
import { PathMapper } from '../path/PathMapper';
import { TemplatesManager } from '../templates/TemplatesManager';

export class EntryMiddleware {
  constructor(
    protected readonly prefix: string,
    protected readonly templates: TemplatesManager,
    protected readonly pathMapper: PathMapper,
  ) {
  }

  handler = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    const templateName = this.pathMapper.outputToName(req.path.replace(/^\//, ''));
    if (templateName === undefined) {
      res.status(404);
      return next();
    }

    const [template, unsubscribe] = this.templates.subscribe(templateName);

    res.send(`<!doctype html><html><head></head><body></body></html><script src="/${this.prefix}/lazy-html-plugin/client.js?prefix=${encodeURIComponent(this.prefix)}&template=${templateName}"></script>`);

    setTimeout(
      () => unsubscribe(),
      1000
    );
  }
}
