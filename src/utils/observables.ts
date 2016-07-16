import * as path from 'path';
import {Entry, ConcatEntry} from '../api/entry';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/groupBy';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/reduce';


/**
 * Allows entries in an Observable to concat each other (instead of overwriting).
 */
export function mergeConcatEntry<T extends Entry>(a: Observable<T>, b: Observable<T>): Observable<T> {
  return a.merge(b)
    .groupBy(entry => path.join(entry.path, entry.name))
    .mergeMap(obs => {
      return obs.reduce(function(acc: Entry | null, curr: Entry) {
        if (acc === null) {
          return curr;
        }
        return new ConcatEntry(acc, curr);
      }, null);
    });
}
