export class UnprocessableEntityError extends Error {
  constructor(public readonly message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
