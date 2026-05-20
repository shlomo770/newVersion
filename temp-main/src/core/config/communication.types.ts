export interface ServerEndpoints {
  mapServer: string;
  messagesServer: string;
}

export interface CommunicationConfig {
  servers: ServerEndpoints;
  serversc?: ServerEndpoints;
}
