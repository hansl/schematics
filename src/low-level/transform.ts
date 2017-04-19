import * as path from 'path';
import { Observable } from 'rxjs/Observable';

import { Action, CreateAction } from './action';

import 'rxjs/add/operator/map';


interface JsonObject {
  [key: string]: any
}

interface TransformFactory {
  (options: JsonObject): TransformFunction;
}

interface TransformFunction {
  (source: Observable<Action>): Observable<Action>;
}

export function PrependRoot(root: string) {
  return (input: Observable<Action>) => {
    return input.map(action => {
      if (action instanceof CreateAction) {
        return path.isAbsolute(action.path)
          ? action
          : new CreateAction(path.join(root, action.path), action.isDirectory, action.content);
      }
      return action;
    });
  };
}