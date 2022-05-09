import { Client, GuildMember } from 'discord.js';
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

export function isApplicationManager(member: GuildMember): boolean {
  if (!member) return false;

  const roleId = config.developmentGuild.ranks.applicationManager
    ? config.developmentGuild.ranks.applicationManager
    : config.productionGuild.ranks.applicationManager;

  return member.roles.cache.has(roleId);
}

// Get the roles that a new clan applicant should get based on Legacy Diary tasks completed.
export function getApplicantRoles(tasksCompleted: number) {
  const isDev = config.developmentGuild.ranks.applicationManager;
  const ranks = isDev ? config.developmentGuild.ranks : config.productionGuild.ranks;
  const ranksToGive = [ranks.member as string];

  tasksCompleted < 10
    ? ranksToGive.push(ranks.protector as string)
    : ranksToGive.push(ranks.bulwark as string);
  return ranksToGive;
}

// Where to welcome the new members
function getNewMembersChannel(): string {
  return config.developmentGuild.channels.newMembers
    ? config.developmentGuild.channels.newMembers
    : config.productionGuild.channels.newMembers;
}

// Send a message in a specific channel
export async function sendMessageInChannel(client: Client, message: string) {
  const channelId = getNewMembersChannel();
  const channel = client.channels.cache.get(channelId);
  if (!channel?.isText()) return;

  await channel.send({ content: message });
}
