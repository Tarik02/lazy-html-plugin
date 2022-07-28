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
      return next();
    }

    const [template, unsubscribe] = this.templates.subscribe(templateName);

    const unsubscribeData = template.listen(documentData => {
      unsubscribeData();

      if (res.closed) {
        return;
      }

      res.send(`${ documentData }<script src="/${this.prefix}/lazy-html-plugin/client.js?prefix=${encodeURIComponent(this.prefix)}&template=${templateName}"></script>`);
      // res.send(`${ documentData }`);
    }, true);
    // res.send(`<!doctype html><html><head></head><body></body></html><script src="/${this.prefix}/lazy-html-plugin/client.js?prefix=${encodeURIComponent(this.prefix)}&template=${templateName}"></script>`);

    res.on('close', () => {
      setTimeout(() => {
        unsubscribe();
        unsubscribeData();
      }, 1000);
    });
  }
}
