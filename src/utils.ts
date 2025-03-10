import { GuildMember } from 'discord.js';
import config from './config';

export const MAX_LEVEL = 99;
export const DATE_FORMAT = 'YYYY-MM-DD HH:mm';

export enum PeriodsInMillseconds {
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
  'The Mimic',
  'Tombs of Amascut: Normal (Solo)',
  'Tombs of Amascut: Expert (Solo)',
  'Tombs of Amascut: Expert (Teams)',
  'Phantom Muspah'
];

enum Ranks {
  legacy = '<:legacy:1100009734339309589>',
  trialist = '<:trialist:996048382789423174>',
  staff = '<:moderator:1089142076861595649>',
  gamer = '<:gamer:1348062233124536403> ',
  quester = '<:quester:1348062230343712890>',
  achiever = '<:achiever:1348062231723507822>',
  elite = '<:elite:1348062240988729425>',
  templar = '<:templar:996045854962102342>',
  vanguard = '<:vanguard:996045856291704912>',
  warden = '<:warden:996045857633882223>',
  guardian = '<:guardian:996045849639518358>',
  sentry = '<:sentry:996045853557006456>',
  justiciar = '<:justicear:996045850759397437>',
  bulwark = '<:bulwark:996045848557387866>',
  protector = '<:protector:996045852013498489>'
}

enum CombatAchievements {
  master = '<:mca:1348096176842473694>',
  grandmaster = '<:gmca:1348096178293702728>'
}

const timeRegex: RegExp = /^(?:(?:[1-9]\d*:)?(?:[0-5]?\d:[0-5]?\d\.\d{1,2})|(?:[0-5]?\d\.\d{1,2}))$/;

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
  return r || `\\-`;
}

export function getCa(achieved: string): string {
  const ca = (<any>CombatAchievements)[achieved.toLowerCase()];
  return ca || ``;
}

export function getRoleName(roleId: string): string {
  const roles = config.guild.roles;
  return roleId === roles.protector ? 'Protector' : roleId === roles.bulwark ? 'Bulwark' : 'Justiciar';
}

// Code shamelessly stolen from: https://stackoverflow.com/a/54385026
function* range(start: number, end: number) {
  for (; start <= end; ++start) {
    yield start;
  }
}

function last<T>(arr: T[]) {
  return arr[arr.length - 1];
}

function* numericCombinations(n: number, r: number, loc: number[] = []): IterableIterator<number[]> {
  const idx = loc.length;
  if (idx === r) {
    yield loc;
    return;
  }
  for (let next of range(idx ? last(loc) + 1 : 0, n - r + idx)) {
    yield* numericCombinations(n, r, loc.concat(next));
  }
}

export function* combinations<T>(arr: T[], r: number) {
  for (let idxs of numericCombinations(arr.length, r)) {
    yield idxs.map(i => arr[i]);
  }
}

export function timeInMilliseconds(time: string) {
  const splitTime = time.split(':');
  const hours: number = Number(splitTime.at(-3))
    ? Number(splitTime.at(-3)) * PeriodsInMillseconds.hour
    : 0;
  const minutes: number = Number(splitTime.at(-2))
    ? Number(splitTime.at(-2)) * PeriodsInMillseconds.minute
    : 0;
  const seconds: number = Number(splitTime.at(-1)?.split('.')[0])
    ? Number(splitTime.at(-1)?.split('.')[0]) * PeriodsInMillseconds.second
    : 0;
  const milliseconds: number = Number(splitTime.at(-1)?.split('.')[1])
    ? Number(splitTime.at(-1)?.split('.')[1]) * 10
    : 0;

  return hours + minutes + seconds + milliseconds;
}

export function timeInHumanReadable(time: number): string {
  const hours = Math.floor(time / PeriodsInMillseconds.hour);
  const minutes = Math.floor((time - hours * PeriodsInMillseconds.hour) / PeriodsInMillseconds.minute);
  const seconds = Math.floor(
    (time - hours * PeriodsInMillseconds.hour - minutes * PeriodsInMillseconds.minute) /
      PeriodsInMillseconds.second
  );
  const milliseconds =
    (time -
      hours * PeriodsInMillseconds.hour -
      minutes * PeriodsInMillseconds.minute -
      seconds * PeriodsInMillseconds.second) /
    10;

  let humanReadable = '';
  humanReadable +=
    hours > 0
      ? `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}.${padNumber(
          milliseconds,
          true
        )}`
      : minutes > 0
      ? `${padNumber(minutes)}:${padNumber(seconds)}.${padNumber(milliseconds, true)}`
      : `${padNumber(seconds)}.${padNumber(milliseconds, true)}`;

  return humanReadable;
}

function padNumber(num: number, end: boolean = false): string {
  if (num < 10) {
    return end ? num + '0' : '0' + num;
  } else {
    return num + '';
  }
}

export function isStaff(member: GuildMember): boolean {
  return hasRole(member, config.guild.roles.staff) || hasRole(member, config.guild.roles.juniorStaff);
}
