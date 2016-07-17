import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';


export type EventExecutorFnReturn = PromiseLike<any> | Observable<any> | void;
export type EventExecutorFn<T> = (v: T) => EventExecutorFnReturn;


export class EventObserver<T> {
  constructor(private _emitter: EventEmitter<T>, private _fn: EventExecutorFn<T>) {}

  emit(v: T): EventExecutorFnReturn {
    try {
      return this._fn(v);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  unsubscribe() {
    this._emitter.unsubscribe(this);
  }
}


export class EventEmitter<T> {
  private observers: Array<EventObserver<T>> = [];
  private subject: Subject<T> = new Subject<T>();

  subscribe(fn: EventExecutorFn<T>): EventObserver<T> {
    const observer = new EventObserver(this, fn);
    this.observers.push(observer);
    return observer;
  }

  unsubscribe(ob: EventObserver<T>): void {
    this.observers.splice(this.observers.indexOf(ob), 1);
  }

  emit<R extends T>(value?: R): Observable<any> {
    const s = new Subject<any>();
    let locks = 0;

    function unlock() {
      if (--locks == 0) {
        s.complete();
      }
    }

    const { subject, observers } = this;
    const len = observers.length;
    const copy: EventObserver<T>[] = observers.slice();
    subject.next(value);

    for (let i = 0; i < len; i++) {
      const ret: EventExecutorFnReturn = copy[i].emit(value);
      if (ret) {
        if (ret instanceof Observable) {
          locks++;
          ret.subscribe(
            (v: any) => s.next(v),
            (err: any) => s.error(err),
            () => unlock()
          );
        }
        else if (typeof ret['then'] == 'function') {
          locks++;
          ret.then((v: any) => {
            s.next(v);
            unlock();
          }, (err: any) => {
            s.error(err);
            unlock();
          });
        }
        // Else, nothing, since we're not using a ReplaySubject all these memories would be
        // lost, like tears in the rain.
      }
    }

    if (locks === 0) {
      // No observers returned an async promise/observable, just complete.
      s.complete();
    }
    return s.asObservable();
  }

  asObservable(): Observable<T> {
    return this.subject.asObservable();
  }
}


export function promisify(fn: (...args: any[]) => any): (...args: any[]) => Promise<any> {
  return <any>function() {
    const args: any[] = [];
    for (let i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    return new Promise((resolve, reject) => {
      fn.apply(this, args.concat(function(err: any, result?: any) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }));
    });
  };
}
