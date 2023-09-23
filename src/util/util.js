export const isObject = d => typeof d === 'object' && !Array.isArray(d) && d !== null;
export const isStr = str => typeof str === 'string';
export const pathToArr = path => Array.isArray(path) ? path : path.split('.');