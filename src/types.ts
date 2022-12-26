import {
  ChatInputCommandInteraction,
  ChatInputApplicationCommandData,
  Client,
  ActionRowBuilder,
  AttachmentBuilder,
  EmbedBuilder,
  ButtonBuilder,
  APIEmbed,
  Guild,
  Collection,
  NonThreadGuildBasedChannel,
  User,
  TextChannel
} from 'discord.js';

export interface Command extends ChatInputApplicationCommandData {
  run: (client: Client, interaction: ChatInputCommandInteraction) => void;
}

export interface LeaderboardRecord {
  [key: number]: [number];
}

export interface PlayerSummary {
  name: string;
  points: number;
  diaryTasks: number;
  rank: string;
}

export interface MessageOptions {
  content?: string;
  embeds?: EmbedBuilder[];
  components?: ActionRowBuilder<ButtonBuilder>[];
  files?: AttachmentBuilder[];
}

export enum LeaderboardType {
  TIME,
  REGULAR
}

export interface ChannelResponse {
  id: number;
  channel: string;
  channel_id: string;
}

export enum MessageType {
  Leaderboard = 1,
  Pets = 2,
  Other = 3
}

export interface MessageEntry {
  id: number;
  name: string;
  message_id: string;
  channel: string;
  type: MessageType;
}

export interface ConfigEntry {
  id: number;
  new_members_channel: string | null;
  assign_roles_channel: string | null;
  rules_channel: string | null;
  diary_channel: string | null;
  leaderboard_channel: string | null;
  transcripts_channel: string | null;
  clan_icon: string | null;
  requirements_image: string | null;
  diary_top10_message: string | null;
  channels_count: number;
}

export interface OpenApplicationsResponse {
  user: User;
  channel: TextChannel;
}

export interface OauthData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  user: string;
  date: number;
}

export interface ResponseType {
  guild?: Guild;
  guildChannels: Collection<string, NonThreadGuildBasedChannel | null>;
  configs: ConfigEntry;
  messages: MessageEntry[];
  scheduledMessages: ScheduledMessageEntry[];
}

export enum ScheduledMessageType {
  Simple = 1,
  Embed = 2
}

export interface ScheduledMessageEntry {
  id?: number;
  message: string;
  date: string;
  channel: string;
  type: ScheduledMessageType;
}

export interface ScheduledMessage {
  date: string;
  channel: string;
  content?: string;
  embed?: APIEmbed;
  type: string;
}
