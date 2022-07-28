import { Template } from './Template';
import { TemplatesManager } from './TemplatesManager';

export class ConstantTemplatesManager implements TemplatesManager {
  protected readonly templates = new Map<string, Template>();

  constructor() {
  }

  update(templateNames: string[]) {
    for (const key of this.templates.keys()) {
      if (!templateNames.includes(key)) {
        this.templates.delete(key);
      }
    }

    for (const name of templateNames) {
      if (!this.templates.has(name)) {
        this.templates.set(name, new Template);
      }
    }
  }

  used() {
    return [...this.templates.keys()];
  }

  emit(name: string, content: string) {
    if (!this.templates.has(name)) {
      return;
    }

    const template = this.templates.get(name)!;
    template.emit(content);
  }

  subscribe(name: string): [Template, () => void] {
    if (!this.templates.has(name)) {
      throw new Error(`Template with name "${ name }" is not available`);
    }

    const template = this.templates.get(name)!;

    const unsubscribe = () => {
      // noop
    };

    return [template, unsubscribe];
  }
}
