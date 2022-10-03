import {
  ChatInputCommandInteraction,
  ChatInputApplicationCommandData,
  Client,
  ActionRowBuilder,
  AttachmentBuilder,
  EmbedBuilder,
  ButtonBuilder
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

export interface ScheduledMessage {
  date: string;
  channel: string;
  content?: string;
  embed?: any;
  type: string;
}

export interface MessageOptions {
  message?: string;
  embeds?: EmbedBuilder[];
  components?: ActionRowBuilder<ButtonBuilder>[];
  files?: AttachmentBuilder[];
}

export enum LeaderboardType {
  TIME,
  REGULAR
}
