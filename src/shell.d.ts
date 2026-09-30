declare module 'shell/apiClient' {
  export type ApiClient = {
    get<T>(path: string): Promise<T>;
    post<T>(path: string, body: unknown, options?: { idempotencyKey?: string }): Promise<T>;
  };

  const apiClient: ApiClient;
  export default apiClient;
}
