import {
  BaseCommandInteraction,
  ChatInputApplicationCommandData,
  Client,
  MessageActionRow,
  MessageAttachment,
  MessageEmbed
} from 'discord.js';

export interface Command extends ChatInputApplicationCommandData {
  run: (client: Client, interaction: BaseCommandInteraction) => void;
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
  message: string;
  type: string;
}

export interface MessageOptions {
  message?: string;
  embeds?: MessageEmbed[];
  components?: MessageActionRow[];
  files?: MessageAttachment[];
}
