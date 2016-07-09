import {Observable} from 'rxjs/Observable';

import {Entry} from './entry';


export abstract class Source {
  abstract read(): Observable<Entry>;
}
