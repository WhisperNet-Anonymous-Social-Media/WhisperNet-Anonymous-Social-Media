type Listener = (...args: any[]) => void;

class EventEmitter {
  private events: Record<string, Listener[]> = {};

  on(event: string, listener: Listener) {
    this.events[event] = this.events[event] || [];
    this.events[event].push(listener);
    return this;
  }

  off(event: string, listener: Listener) {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter((l) => l !== listener);
    return this;
  }

  emit(event: string, ...args: any[]) {
    (this.events[event] || []).forEach((listener) => listener(...args));
    return true;
  }
}

export { EventEmitter };
export default { EventEmitter };

