export class CompilerLock {
  private isLocked = false;
  private listeners: Array<() => void> = [];

  lock() {
    if (this.isLocked) {
      throw new Error('Compiler is already locked');
    }
    this.isLocked = true;
  }

  unlock() {
    if (!this.isLocked) {
      throw new Error('Compiler is not locked');
    }
    this.isLocked = false;

    for (const listener of this.listeners) {
      Promise.resolve()
        .then(() => listener())
        .catch(console.error);
    }
    this.listeners = [];
  }

  waitForReady(): Promise<void> {
    if (!this.isLocked) {
      return Promise.resolve();
    }
    return new Promise(resolve => this.listeners.push(resolve));
  }
}
