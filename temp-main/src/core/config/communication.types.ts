export interface ServerEndpoints {
  mapServer: string;
  messagesServer: string;
  /**
   * Optional REST API base URL — host[:port][/path]. The REST client
   * accepts it with or without a scheme; missing schemes default to
   * `http://`. Leave undefined to disable REST until the backend is
   * online.
   */
  apiServer?: string;
}

export interface CommunicationConfig {
  servers: ServerEndpoints;
  serversc?: ServerEndpoints;
}
