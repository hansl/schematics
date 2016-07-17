import {Context, Entry} from '../api/entry';


export type CompiledFnReturn = Promise<Entry> | Entry;
export type CompiledFn = (context: Context) => CompiledFnReturn;


export abstract class Compiler {
  abstract compile(entry: Entry): CompiledFn | Promise<CompiledFn>;
}
