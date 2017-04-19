import { Observable } from 'rxjs/Observable';

import {
  Action,
  CreateAction,
  RenameAction,
  UpdateAction,
  DeleteAction,
  FunctionAction
} from './action';


export interface Sink {
  constructor(...args: any[]): Sink;  // Sink implementation specific.

  preCreate: (action: CreateAction) => CreateAction | Observable<CreateAction> | void;
  postCreate: (action: CreateAction) => Promise<void> | void;
  preRename: (action: RenameAction) => RenameAction | Observable<RenameAction> | void;
  postRename: (action: RenameAction) => void;
  preUpdate: (action: UpdateAction) => UpdateAction | Observable<UpdateAction> | void;
  postUpdate: (action: UpdateAction) => void;
  preDelete: (action: DeleteAction) => DeleteAction | Observable<DeleteAction> | void;
  postDelete: (action: DeleteAction) => void;
  preFunction: (action: FunctionAction) => FunctionAction | Observable<FunctionAction> | void;
  postFunction: (action: FunctionAction) => void;

  // The signature of the promise resolution is implementation specific.
  install(actions: Observable<Action>): Promise<any>;
}