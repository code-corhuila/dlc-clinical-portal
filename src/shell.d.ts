declare module 'shell/apiClient' {
  /**
   * Contract intentionally pending publication by dlc-front.
   * Portals must not add operations to this boundary.
   */
  interface ApiClient {
    readonly __contractPending?: never;
  }

  const apiClient: ApiClient;
  export default apiClient;
}
