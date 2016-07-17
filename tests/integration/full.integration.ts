// Full specs running the equivalent of a real project integration.
import {
  FileSource,
  Library,
  MemorySink
} from '../../src/index';


import './simple';
import './inherited';


const sink = new MemorySink();
Library.global.addProviders([FileSource]);
Library.global.setContext({ nb: 1 });
Library.global.setSink(sink);


describe('Simple', () => {
  it('works', (done) => {
    Library.global.install('simple')
      .then(() => {
        expect(Object.keys(sink.files)).toEqual(['file1']);
        expect(sink.files['file1']).toBe('\nNb: 1.  Nb+1: 2\n');
      })
      .then(done, done.fail);
  });
});

describe('Inherited', () => {
  it('works', (done) => {
    Library.global.install('inherited')
      .then(() => {
        expect(Object.keys(sink.files).sort()).toEqual(['ABCHelloDEF', 'file1', 'file2']);
        expect(sink.files['file1']).toBe('\nNb: 1.  Nb+1: 2\nother');
      })
      .then(done, done.fail);
  });

  it('supports events', (done) => {
    let nbInstall = 0;
    let nbTransform = 0;
    let nbWrite = 0;
    Library.global.install('inherited', {
      beforeInstall: () => { nbInstall++; },
      afterInstall: () => { nbInstall++; },
      beforeTransformEntry: () => { nbTransform++; },
      afterTransformEntry: () => { nbTransform++; },
      beforeWriteEntry: () => { nbWrite++; },
      afterWriteEntry: () => { nbWrite++; }
    })
      .then(() => {
        expect(Object.keys(sink.files).sort()).toEqual(['ABCHelloDEF', 'file1', 'file2']);
        expect(nbInstall).toBe(2);
        expect(nbTransform).toBe(6);
        expect(nbWrite).toBe(6);
      })
      .then(done, done.fail);
  });
});
