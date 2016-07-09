import {Entry} from './entry';

export abstract class Sink {
  abstract init(): Promise<void> | void;
  abstract done(): Promise<void> | void;

  // This should throw to propagate, or swallow the error.
  abstract error(err: any): void;

  abstract write(entry: Entry): Promise<void> | void;
}

export abstract class SimpleSink extends Sink {
  init() {}
  done() {}
  error(err: any) { throw err; }

  abstract write(entry: Entry): Promise<void> | void;
}
