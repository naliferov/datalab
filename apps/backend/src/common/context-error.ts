class ContextError extends Error {
  context: any;

  constructor(message: string, context: any) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
  }
}
