export class Mutex {
  private current = Promise.resolve();

  async acquire() {
    let release: () => void;
    const next = new Promise<void>((resolve) => {
      release = () => { resolve(); };
    });
    const releaser = this.current.then(() => release);
    this.current = next;
    return releaser;
  }
}
