import { Observable } from 'rxjs/Observable';
import * as path from 'path';
import * as fs from 'fs';

import { FileSystemException } from './source';
import { access, mkdir, writeFile } from './fs';
import { PrependRoot } from './transform';
import {
  Action,
  CreateAction,
  RenameAction,
  UpdateAction,
  DeleteAction,
  FunctionAction
} from './action';

import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/mergeMap';

export interface Sink {
  preCreate?: (action: CreateAction) => CreateAction | Observable<CreateAction> | void;
  postCreate?: (action: CreateAction) => Promise<void> | void;
  preRename?: (action: RenameAction) => RenameAction | Observable<RenameAction> | void;
  postRename?: (action: RenameAction) => void;
  preUpdate?: (action: UpdateAction) => UpdateAction | Observable<UpdateAction> | void;
  postUpdate?: (action: UpdateAction) => void;
  preDelete?: (action: DeleteAction) => DeleteAction | Observable<DeleteAction> | void;
  postDelete?: (action: DeleteAction) => void;
  preFunction?: (action: FunctionAction) => FunctionAction | Observable<FunctionAction> | void;
  postFunction?: (action: FunctionAction) => void;

  // The signature of the promise resolution is implementation specific.
  install(actions: Observable<Action>): Promise<any>;
}


function _createParentDirectory(p: string): Promise<void> {
  return access(p, fs.W_OK)
    .catch(err => {
      switch (err.code) {
        case 'ENOENT':
          return _createParentDirectory(path.dirname(p))
            .then(() => {
              return mkdir(p)
                .catch((mkdirErr) => {
                  if (mkdirErr.code != 'EEXIST') {
                    throw new FileSystemException(mkdirErr);
                  }
                });
            });
        default:
          throw new FileSystemException(err);
      }
    });
}


function _writeSingleFile(action: Action) {
  if (action instanceof CreateAction) {
    const parentPath = action.isDirectory ? action.path : path.dirname(action.path);
    return _createParentDirectory(parentPath)
      .then(() => writeFile(action.path, action.content, 'utf-8'));
  }
  // Ignore any action besides CreateAction.
  return Promise.resolve();
}


export class WriteFile implements Sink {
  constructor(private root: string) { }
  install(actions: Observable<Action>): Promise<any> {
    return actions
      .let(PrependRoot({ root: this.root }))
      .mergeMap(action => Observable.fromPromise(_writeSingleFile(action)))
      .toPromise();
  }
}