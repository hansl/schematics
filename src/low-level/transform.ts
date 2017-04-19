import * as path from 'path';
import { Observable } from 'rxjs/Observable';
import { template } from 'lodash';

import { Action, CreateAction } from './action';

import 'rxjs/add/operator/map';


export interface JsonObject {
  [key: string]: any
}

export interface TransformFactory {
  (options: JsonObject): TransformFunction;
}

export interface TransformFunction {
  (source: Observable<Action>): Observable<Action>;
}

export function PrependRoot(options: JsonObject): TransformFunction {
  return (source: Observable<Action>) => {
    return source.map(action => {
      if (action instanceof CreateAction) {
        return path.isAbsolute(action.path)
          ? action
          : new CreateAction(
            path.join(options.root, action.path), action.isDirectory, action.content
          );
      }
      return action;
    });
  };
}

export function LodashCompiler(options: JsonObject): TransformFunction {
  return (source: Observable<Action>) => {
    return source.map(action => {
      if (action instanceof CreateAction) {
        const compiledContent = template(action.content)(options.variables);
        return new CreateAction(action.path, action.isDirectory, compiledContent);
      }
      return action;
    });
  };
}