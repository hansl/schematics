import {Context, Entry} from '../api/entry';


export type CompiledFn = (context: Context) => Promise<Entry> | Entry;


export abstract class Compiler {
  abstract compile(entry: Entry): CompiledFn | Promise<CompiledFn>;
}
