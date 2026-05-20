import type { InboundHandlerContext, InboundMessageHandler } from './types';

/**
 * Topic-agnostic inbound message router.
 * Features register handlers at bootstrap; core never imports feature modules.
 */
export class MessageRegistry {
  private readonly handlers = new Map<string, InboundMessageHandler>();

  /**
   * Register a handler for a message topic. Last registration wins for duplicate topics.
   */
  register(topic: string, handler: InboundMessageHandler): this {
    if (!topic || typeof topic !== 'string') {
      throw new Error('MessageRegistry.register: topic must be a non-empty string');
    }
    if (typeof handler !== 'function') {
      throw new Error(`MessageRegistry.register: handler for "${topic}" must be a function`);
    }
    this.handlers.set(topic, handler);
    return this;
  }

  /**
   * Register multiple handlers at once.
   */
  registerMany(entries: Readonly<Record<string, InboundMessageHandler>>): this {
    for (const [topic, handler] of Object.entries(entries)) {
      this.register(topic, handler);
    }
    return this;
  }

  unregister(topic: string): boolean {
    return this.handlers.delete(topic);
  }

  has(topic: string): boolean {
    return this.handlers.has(topic);
  }

  get(topic: string): InboundMessageHandler | undefined {
    return this.handlers.get(topic);
  }

  getRegisteredTopics(): string[] {
    return [...this.handlers.keys()];
  }

  clear(): void {
    this.handlers.clear();
  }

  /**
   * Dispatch payload to the handler for `topic`, if registered.
   * @returns true when a handler ran (sync start or async promise returned).
   */
  dispatch(
    topic: string,
    data: unknown,
    context: InboundHandlerContext,
  ): boolean {
    const handler = this.handlers.get(topic);
    if (!handler) {
      return false;
    }
    handler(data, context);
    return true;
  }

  /**
   * Dispatch and await when the handler returns a Promise.
   */
  async dispatchAsync(
    topic: string,
    data: unknown,
    context: InboundHandlerContext,
  ): Promise<boolean> {
    const handler = this.handlers.get(topic);
    if (!handler) {
      return false;
    }
    await handler(data, context);
    return true;
  }
}

/** Application-wide registry instance populated during bootstrap. */
export const globalMessageRegistry = new MessageRegistry();
