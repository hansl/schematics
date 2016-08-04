import {Library} from './library';


export interface SchematicsMetadataOptions {
  name: string;
}


export function SchematicsMetadata(options?: SchematicsMetadataOptions): ClassDecorator {
  return <T extends Function>(target: T) => {
    Library.global.register(options.name, target);
  };
}

