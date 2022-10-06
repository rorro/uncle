export interface ChannelResponse {
  channel_id: string;
}

export interface MessagesResponse {
  name: string;
  message_id: string;
}

export enum MessageType {
  Leaderboard = 1,
  Pets = 2,
  Other = 3
}

export interface MessageOptions {
  name?: string;
  type?: MessageType;
}

// export interface ApplicationsResponse {

// }
