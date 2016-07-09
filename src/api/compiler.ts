import {Context, Entry} from '../api/entry';


export type CompiledFn = (context: Context) => Promise<Entry> | Entry;


export abstract class Compiler {
  abstract compile(entry: Entry): CompiledFn | Promise<CompiledFn>;
}


/**
 * A compiler that returns the content, unmodified, of the entry.
 */
export class IdentityCompiler extends Compiler {
  compile(entry: Entry) {
    return () => entry;
  }
}
