import fs = require('fs');

import {FileSystemException} from './source';


export function readFile(p: string, encoding: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(p, encoding, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export function writeFile(p: string, data: string, encoding: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(p, data, encoding, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function mkdir(p: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(p, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function readdir(p: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(p, (err, files) => {
      if (err) {
        reject(new FileSystemException(err));
      } else {
        resolve(files);
      }
    });
  });
}

export function access(p: string, mode: number): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.access(p, mode, (err) => {
      if (err) {
        reject(new FileSystemException(err));
      } else {
        resolve();
      }
    });
  });
}

export function stat(p: string): Promise<fs.Stats> {
  return new Promise((resolve, reject) => {
    fs.stat(p, (err, stats) => {
      if (err) {
        reject(new FileSystemException(err));
      } else {
        resolve(stats);
      }
    });
  });
}
