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

export interface ConfigEntry {
  id: number;
  config_key: string;
  config_value: string;
}

export interface OpenApplicationsResponse {
  id: number;
  user_id: string;
  channel_id: string;
}

export interface OauthData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  discord_user_id: string;
}
