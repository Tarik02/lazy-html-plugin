import { Template } from './Template';

export interface TemplatesManager {
  used(): ReadonlyArray<string>;

  emit(name: string, content: string): void;

  subscribe(name: string): [Template, () => void];
}
