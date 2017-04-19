import { Observable } from 'rxjs/Observable';


export interface BlueprintHost {
  exists(fileName: string): Observable<boolean>;
  read(fileName: string): Observable<string>;
  isDirectory(path: string): Observable<boolean>;
  listFiles(path: string): Observable<string>;
}