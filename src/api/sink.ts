import {Entry} from './entry';

export interface Sink {
  init(): Promise<void> | void;
  done(): Promise<void> | void;

  // This should throw to propagate, or swallow the error.
  error(err: any): void;

  write(fileName: string, content: string): Promise<void> | void;
}

export abstract class SimpleSink implements Sink {
  init() {}
  done() {}
  error(err: any) { throw err; }

  abstract write(fileName: string, content: string): Promise<void> | void;
}
