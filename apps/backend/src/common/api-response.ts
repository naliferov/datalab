export interface ApiResponse<T> {
  status: 'success' | 'fail';
  message?: string;
  data?: T;
  errors?: [];
}
