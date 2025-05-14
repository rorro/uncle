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
  welcome_base_message: string;
  welcome_success_message: string;
  welcome_error_message: string;
  welcome_pm_message: string;
  inactivity_check_channel: string;
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

interface EmbedConfig {
  content: string;
  embed: APIEmbed;
}

export interface EmbedConfigs {
  application_embed: EmbedConfig;
  support_embed: EmbedConfig;
}

export interface EmbedConfigData {
  id: number;
  name: string;
  title: string;
  data: string;
}

export interface PetEntry {
  name: string;
  display_name: string;
  emoji: string;
}

export interface PetLeaderboardEntry {
  id: number;
  username: string;
  removed: boolean;
  abyssal_sire: boolean;
  alchemical_hydra: boolean;
  callisto: boolean;
  cerberus: boolean;
  chaos_elemental: boolean;
  commander_zilyana: boolean;
  corporeal_beast: boolean;
  dagannoth_prime: boolean;
  dagannoth_supreme: boolean;
  dagannoth_rex: boolean;
  tztok_jad: boolean;
  general_graardor: boolean;
  giant_mole: boolean;
  grotesque_guardians: boolean;
  tzkal_zuk: boolean;
  kalphite_queen: boolean;
  king_black_dragon: boolean;
  kraken: boolean;
  kreearra: boolean;
  kril_tsutsaroth: boolean;
  scorpia: boolean;
  skotizo: boolean;
  thermonuclear_smoke_devil: boolean;
  venenatis: boolean;
  vetion: boolean;
  vorkath: boolean;
  phoenix: boolean;
  zulrah: boolean;
  chambers_of_xeric: boolean;
  theatre_of_blood: boolean;
  bloodhound: boolean;
  penance_queen: boolean;
  heron: boolean;
  rock_golem: boolean;
  beaver: boolean;
  chinchompa: boolean;
  giant_squirrel: boolean;
  tangleroot: boolean;
  rocky: boolean;
  rift_guardian: boolean;
  herbiboar: boolean;
  chompy_chick: boolean;
  sarachnis: boolean;
  zalcano: boolean;
  gauntlet: boolean;
  nightmare: boolean;
  lil_creator: boolean;
  tempoross: boolean;
  nex: boolean;
  abyssal_protector: boolean;
  tombs_of_amascut: boolean;
  phantom_muspah: boolean;
  the_whisperer: boolean;
  duke_sucellus: boolean;
  vardorvis: boolean;
  the_leviathan: boolean;
  scurrius: boolean;
  sol_heredit: boolean;
  quetzin: boolean;
  araxxor: boolean;
  the_hueycoatl: boolean;
  amoxliatl: boolean;
  the_royal_titans: boolean;
  yama: boolean;
}

export interface SpeedsLeaderboardEntry {
  id: number;
  username: string;
  boss: string;
  category: string | null;
  time: string;
  proof: string;
  removed: number;
}

export interface LeaderboardBoss {
  boss: string;
  emoji: string;
  categories?: string[];
}
