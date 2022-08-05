import { BaseCommandInteraction, ChatInputApplicationCommandData, Client } from 'discord.js';

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
