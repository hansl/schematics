import {Observable} from 'rxjs/Observable';

import {Entry} from './entry';


export interface Source {
  read(): Observable<Entry>;
}
