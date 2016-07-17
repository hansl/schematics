import {EventEmitter} from '../../src/utils/private';
import {Subject} from 'rxjs/Subject';


describe('EventEmitter', () => {
  it('Synchronous: works as a subject', (done) => {
    const s = new EventEmitter<number>();

    let last: number = undefined;
    s.subscribe((x) => {
      last = x;
    });

    let called = false;
    s.subscribe((): any => {
      called = true;
      // This should be next() by EventEmitter in its observable.
      return 'hello';
    });

    const nextObserver = s.emit(0);
    expect(called).toBe(true);
    expect(last).toBe(0);

    // Count should be 0.
    nextObserver
      .toArray()
      .toPromise()
      .then(x => expect(x).toEqual([]))  // 'hello' will be ignored.
      .then(done, done.fail);
  });

  it('Synchronous: handle errors', (done) => {
    const s = new EventEmitter<void>();

    s.subscribe(() => {
      throw new Error('blah');
    });

    let called = false;
    s.subscribe((): any => {
      // This will still be called.
      called = true;
    });

    const nextObserver = s.emit();
    expect(called).toBe(true);

    // Count should be 0.
    nextObserver
      .toPromise()
      .then(() => { expect(false).toBe(true); }, (err: Error) => {
        expect(err.message).toBe('blah');
      })
      .then(done, done.fail);
  });

  it('Synchronous: has no last value', (done) => {
    const s = new EventEmitter<number>();

    let last: number = undefined;
    s.subscribe((x) => {
      last = x;
    });

    let called = false;
    s.subscribe((x) => {
      called = true;
    });

    const nextObserver = s.emit(2);
    expect(called).toBe(true);
    expect(last).toBe(2);
    nextObserver
      .toPromise()
      .then(x => expect(x).toBe(undefined))
      .then(done, done.fail);
  });

  it('Asynchronous: handles Promises', (done) => {
    const s = new EventEmitter<number>();

    let last: number = undefined;
    s.subscribe((x) => {
      return new Promise((resolve) => setTimeout(() => {
        last = x;
        resolve(1);
      }, 1));
    });

    let called = false;
    s.subscribe((x) => {
      called = true;
    });

    const nextObserver = s.emit(2);
    expect(called).toBe(true);
    expect(last).toBe(undefined);

    nextObserver
      .toPromise()
      .then(x => {
        expect(last).toBe(2);
        expect(x).toBe(1);
      })
      .then(done, done.fail);
  });

  it('Asynchronous: handles Promise errors', (done) => {
    const s = new EventEmitter<void>();

    s.subscribe((x) => {
      return new Promise((_, reject) => setTimeout(() => {
        reject(new Error('1'));
      }, 1));
    });

    let called = false;
    s.subscribe((x) => {
      called = true;
    });

    const nextObserver = s.emit();
    expect(called).toBe(true);

    nextObserver
      .toPromise()
      .then(() => {
        expect(false).toBe(true);
      }, err => {
        expect(err.message).toBe('1');
      })
      .then(done, done.fail);
  });

  it('Asynchronous: handles Observables', (done) => {
    const s = new EventEmitter<number>();

    let last: number = undefined;
    s.subscribe((x) => {
      last = x;
      const s2 = new Subject<string>();
      setTimeout(function() {
        s2.next('hello');
        setTimeout(function() {
          s2.complete();
        }, 1);
      }, 1);
      return s2.asObservable();
    });
    s.subscribe((x) => {
      last = x;
      const s3 = new Subject<string>();
      setTimeout(function() {
        s3.next('world');
        s3.complete();
      }, 1);
      return s3.asObservable();
    });

    let called = 0;
    s.subscribe((x) => {
      called++;
    });

    const nextObserver = s.emit(1);
    expect(called).toBe(1);
    expect(last).toBe(1);

    nextObserver
      .merge(s.emit(2))
      .toArray()
      .toPromise()
      .then(x => {
        expect(last).toBe(2);
        expect(x).toEqual(['hello', 'world', 'hello', 'world']);
        expect(called).toBe(2);
      })
      .then(done, done.fail);
  });

  it('Asynchronous: handles Observable errors', (done) => {
    const s = new EventEmitter<void>();

    s.subscribe((x) => {
      const s2 = new Subject<string>();
      setTimeout(function() {
        s2.next('hello');
        setTimeout(function() {
          s2.next('world');
          s2.error(new Error('2'));
        }, 1);
      }, 1);
      return s2.asObservable();
    });

    let called = 0;
    s.subscribe((x) => {
      called++;
    });

    const nextObserver = s.emit();
    expect(called).toBe(1);

    nextObserver
      .toArray()
      .toPromise()
      .then(() => {
        expect(false).toBe(true);
      }, err => {
        expect(err.message).toBe('2');
      })
      .then(done, done.fail);
  });

  it('can unsubscribe', (done) => {
    const s = new EventEmitter<void>();

    let called = 0;
    const ob1 = s.subscribe(() => {
      called++;
    });
    const ob2 = s.subscribe(() => {
      called++;
    });

    let nextObserver = s.emit();
    expect(called).toBe(2);
    ob1.unsubscribe();
    nextObserver = nextObserver.merge(s.emit());
    expect(called).toBe(3);  // ob1 isn't called, but ob2 is.
    s.unsubscribe(ob2);
    nextObserver = nextObserver.merge(s.emit());
    expect(called).toBe(3);

    nextObserver
      .count()
      .toPromise()
      .then(x => expect(x).toBe(0))
      .then(done, done.fail);
  });
});
