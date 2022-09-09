import { GuildMember } from 'discord.js';
import config from './config';

export const MAX_LEVEL = 99;
export const DATE_FORMAT = 'YYYY-MM-DD HH:mm';

export enum periodsInMillseconds {
  hour = 60 * 60 * 1000,
  minute = 60 * 1000,
  second = 1000,
  tick = 600
}

export const SKILLS = [
  'attack',
  'strength',
  'defence',
  'ranged',
  'prayer',
  'magic',
  'runecrafting',
  'construction',
  'hitpoints',
  'agility',
  'herblore',
  'thieving',
  'crafting',
  'fletching',
  'slayer',
  'hunter',
  'mining',
  'smithing',
  'fishing',
  'cooking',
  'firemaking',
  'woodcutting',
  'farming'
];

export const SPEED_CATEGORIES = [
  'Chambers of Xeric (Solo)',
  'Chambers of Xeric (Teams)',
  'Chambers of Xeric: Challenge Mode (Solo)',
  'Chambers of Xeric: Challenge Mode (Teams)',
  'Theatre of Blood: Normal Mode',
  'Theatre of Blood: Hard Mode',
  'Gauntlet',
  'Corrupted Gauntlet',
  'Zulrah',
  'Vorkath',
  'Jad (On task)',
  'Jad (Off task)',
  'Zuk',
  'Nightmare of Ashihama',
  "Phosani's Nightmare",
  'Alchemical Hydra',
  'Grotesque Guardians',
  'Hespori',
  'The Mimic'
];

enum Ranks {
  marshal = '<:marshal:997273187412881470>',
  templar = '<:templar:996045854962102342>',
  vanguard = '<:vanguard:996045856291704912>',
  warden = '<:warden:996045857633882223>',
  guardian = '<:guardian:996045849639518358>',
  sentry = '<:sentry:996045853557006456>',
  justiciar = '<:justicear:996045850759397437>',
  bulwark = '<:bulwark:996045848557387866>',
  protector = '<:protector:996045852013498489>',
  trialist = '<:trialist:996048382789423174>',
  staff = '<:staff:995767143159304252>'
}

export function getLevel(experience: number): number {
  // Unranked
  if (experience === -1) {
    return 0;
  }

  let accumulated = 0;

  for (let level = 1; level < MAX_LEVEL; level++) {
    const required = getXpDifferenceTo(level + 1);

    if (experience >= accumulated && experience < accumulated + required) {
      return level;
    }

    accumulated += required;
  }

  return MAX_LEVEL;
}

function getXpDifferenceTo(level: number): number {
  if (level < 2) {
    return 0;
  }

  return Math.floor(level - 1 + 300 * 2 ** ((level - 1) / 7)) / 4;
}

export function hasRole(member: GuildMember, roleId: string): boolean {
  if (!member) return false;

  return roleId ? member.roles.cache.has(roleId) : false;
}

// Get the roles that a new clan applicant should get based on Legacy Diary tasks completed.
export function getApplicantRoles(tasksCompleted: number) {
  const roles = config.guild.roles;
  const ranksToGive: string[] = [roles.member];

  tasksCompleted < 10
    ? ranksToGive.push(roles.protector)
    : tasksCompleted < 15
    ? ranksToGive.push(roles.bulwark)
    : ranksToGive.push(roles.justiciar);

  return ranksToGive;
}

export function parseMessage(message: string): string {
  const split = message.split('\\n ');
  let result = '';
  split.forEach(line => {
    result += line + '\n';
  });

  return result;
}

export function formatMessage(message: string): string {
  return message
    .replaceAll('`', '\\`') // code
    .replaceAll('*', '\\*') // italics and bold
    .replaceAll('~', '\\~') // strikethrough
    .replaceAll('>', '\\>') // quote
    .replaceAll('|', '\\|') // spoiler
    .replaceAll('_', '\\_') // underline
    .split('\n')
    .join('\\n\n');
}

export function getRank(rank: string): string {
  const r = (<any>Ranks)[rank.toLowerCase()];
  return r || '❌';
}

export function getRoleName(roleId: string): string {
  const roles = config.guild.roles;
  return roleId === roles.protector ? 'Protector' : roleId === roles.bulwark ? 'Bulwark' : 'Justiciar';
}
