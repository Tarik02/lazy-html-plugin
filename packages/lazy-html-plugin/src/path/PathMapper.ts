export interface PathMapper {
  nameToInput(name: string): string;

  inputToName(path: string): string | undefined;

  nameToOutput(name: string): string;

  outputToName(path: string): string | undefined;
}

export const isPathMapper = (input: any): input is PathMapper =>
  (typeof input === 'object' || typeof input === 'function')
    && 'nameToInput' in input
    && 'inputToName' in input
    && 'nameToOutput' in input
    && 'outputToName' in input;
