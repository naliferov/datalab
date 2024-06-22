export interface Error {
  message?: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'fail';
  message?: string;
  data?: T;
  errors?: Error[];
}
