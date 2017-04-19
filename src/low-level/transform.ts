import { Observable } from 'rxjs/Observable';

import { Action } from './action';


interface JsonObject {
  [key: string]: any
}

interface TransformFactory {
  (options: JsonObject): TransformFunction;
}

interface TransformFunction {
  (source: Observable<Action>): Observable<Action>;
}