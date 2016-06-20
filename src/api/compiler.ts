import {Context} from 'api/entry';


export type CompiledFn = (context: Context) => Promise<string> | string;


export interface Compiler {
  compile(content: string): CompiledFn | Promise<CompiledFn>;
}
