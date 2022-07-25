import { PathMapper } from './PathMapper';

export class DefaultPathMapper implements PathMapper {
  constructor(
    protected readonly inputLoader: string | undefined,
    protected readonly inputSuffix: string,
    protected readonly outputSuffix: string,
  ) {
    //
  }

  nameToInput(name: string): string {
    return `${ name }${ this.inputSuffix }`;
  }

  inputToName(path: string): string | undefined {
    if (!path.toLowerCase().endsWith(this.inputSuffix.toLowerCase())) {
      return undefined;
    }

    return path.substring(0, path.length - this.inputSuffix.length);
  }

  nameToOutput(name: string): string {
    return `${ name }${ this.outputSuffix }`;
  }

  outputToName(path: string): string | undefined {
    if (!path.toLowerCase().endsWith(this.outputSuffix.toLowerCase())) {
      return undefined;
    }

    return path.substring(0, path.length - this.outputSuffix.length);
  }
}
