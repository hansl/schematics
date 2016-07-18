import {Context, Entry} from '../api/entry';


export type CompileResult = Promise<Entry> | Entry;


export abstract class Compiler {
  abstract compile(entry: Entry, context: Context): CompileResult;
}
