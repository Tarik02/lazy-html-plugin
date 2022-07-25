import * as Express from 'express';
import { TemplatesManager } from '../templates/TemplatesManager';

export class EventsMiddleware {
  protected templates: TemplatesManager;

  constructor(templates: TemplatesManager) {
    this.templates = templates;
  }

  handler = (req: Express.Request, res: Express.Response) => {
    const templateName = req.query.template as string;
    const [template, unsubscribe] = this.templates.subscribe(templateName);

    const headers: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/event-stream;charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      // While behind nginx, event stream should not be buffered:
      // http://nginx.org/docs/http/ngx_http_proxy_module.html#proxy_buffering
      'X-Accel-Buffering': 'no',
    };

    const isHttp1 = !(parseInt(req.httpVersion) >= 2);
    if (isHttp1) {
      req.socket.setKeepAlive(true);
      headers.Connection = 'keep-alive';
    }

    res.writeHead(200, headers);
    res.write('\n');

    const heartbeatInterval = setInterval(() => {
      res.write('data: \uD83D\uDC93\n\n');
    }, 10 * 1000);

    let didSendContent = false;

    const unsubscribeContent = template.listen((document, patch) => {
      if (didSendContent && patch) {
        res.write(`data: ${ JSON.stringify({
          type: 'patch',
          payload: {
            patch,
          },
        }) }\n\n`);
      } else {
        res.write(`data: ${ JSON.stringify({
          type: 'init',
          payload: {
            document,
          },
        }) }\n\n`);
        didSendContent = true;
      }
    }, true);

    req.on('close', () => {
      clearInterval(heartbeatInterval);
      unsubscribeContent();
      unsubscribe();
    });
  }
}
