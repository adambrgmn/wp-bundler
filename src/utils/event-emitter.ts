import { EventEmitter } from 'node:events';

export class TypedEventEmitter<Events extends { [key: string]: any }> extends EventEmitter {
  emit<E extends keyof Events & string>(eventName: E, payload: Events[E]) {
    return super.emit(eventName, payload);
  }

  once<E extends keyof Events & string>(eventName: E, listener: (payload: Events[E]) => any) {
    return super.once(eventName, listener);
  }

  on<E extends keyof Events & string>(eventName: E, listener: (payload: Events[E]) => any) {
    return super.on(eventName, listener);
  }

  addListener<E extends keyof Events & string>(eventName: E, listener: (payload: Events[E]) => any) {
    return super.addListener(eventName, listener);
  }

  off<E extends keyof Events & string>(eventName: E, listener: (payload: Events[E]) => any) {
    return super.off(eventName, listener);
  }

  removeListener<E extends keyof Events & string>(eventName: E, listener: (payload: Events[E]) => any) {
    return super.removeListener(eventName, listener);
  }
}
