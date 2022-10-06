export interface ChannelResponse {
  id: number;
  channel: string;
  channel_id: string;
}

export interface MessagesResponse {
  id: number;
  name: string;
  message_id: string;
  type: MessageType;
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

export interface OpenApplicationsResponse {
  id: number;
  user_id: string;
  channel_id: string;
}
