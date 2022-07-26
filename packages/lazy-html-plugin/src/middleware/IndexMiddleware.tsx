import * as Path from 'path';
import * as FS from 'fs';
import * as Express from 'express';
import { PathMapper } from '../path/PathMapper';
import { Index } from '../../client/src/views/Index';
import { renderPage } from '../../client/src/utils/renderPage';

export class IndexMiddleware {
  constructor(
    protected readonly fs: typeof FS,
    protected readonly prefix: string,
    protected readonly directory: string,
    protected readonly pathMapper: PathMapper,
  ) {
  }

  handler = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    const rootDirectory = Path.resolve(
      this.directory,
      '.' + Path.normalize('/' + req.path)
    );

    this.fs.readdir(rootDirectory, (err, files) => {
      if (err) {
        next();
        return;
      }

      const availableTemplates = files
        .map(file => this.pathMapper.inputToName(file))
        .filter((name): name is string => name !== undefined)
        .map(name => ({
          name: name,
          file: this.pathMapper.nameToOutput(name),
        }));

      res.send(
        renderPage(
          'index',
          Index,
          {
            prefix: this.prefix,
            templates: availableTemplates,
          }
        )
      );
    });
  }
}
