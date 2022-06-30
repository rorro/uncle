import { BaseCommandInteraction, ChatInputApplicationCommandData, Client } from 'discord.js';

export interface Command extends ChatInputApplicationCommandData {
  run: (client: Client, interaction: BaseCommandInteraction) => void;
}

export interface PetRecord {
  [key: number]: [number];
}
