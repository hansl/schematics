import {Context, Entry} from 'api/entry';


export type CompiledFn = (context: Context) => Promise<Entry> | Entry;


export interface Compiler {
  compile(entry: Entry): CompiledFn | Promise<CompiledFn>;
}


/**
 * A compiler that returns the content, unmodified, of the entry.
 */
export class IdentityCompiler implements Compiler {
  compile(entry: Entry) {
    return () => entry;
  }
}
