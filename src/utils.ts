import { Client, GuildMember } from 'discord.js';
import { resourceLimits } from 'worker_threads';
import config from './config';

export const MAX_LEVEL = 99;

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

  tasksCompleted < 10 ? ranksToGive.push(roles.protector) : ranksToGive.push(roles.bulwark);
  return ranksToGive;
}

// Send a message in a specific channel
export async function sendMessageInChannel(
  client: Client,
  channelId: string | undefined,
  message: string
) {
  if (channelId === undefined) return;
  const channel = client.channels.cache.get(channelId);
  if (!channel?.isText()) return;

  await channel.send({ content: message });
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
