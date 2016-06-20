
export function promisify(fn: (...args: any[]) => any): (...args: any[]) => Promise<any> {
  return <any>function() {
    const args: any[] = [];
    for (let i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    return new Promise(function(reject, resolve) {
      fn.apply(null, args.concat(function(err: any, result?: any) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }));
    });
  }
}
