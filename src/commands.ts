import { acceptApplicationCommand } from './commands/AcceptApplication';
import { applicationCommand } from './commands/Application';
import { checkApplicantRequirementsCommand } from './commands/CheckApplicantRequirements';
import { configCommand } from './commands/Config';
import { diaryCommand } from './commands/Diary';
import { leaderboardCommand } from './commands/Leaderboard';
import { messageCommand } from './commands/Message';
import { petsCommand } from './commands/Pets';
import { scheduleCommand } from './commands/ScheduleMessage';
import { splitsCommand } from './commands/Splits';
import { supportCommand } from './commands/Suport';
import { completeCommand } from './commands/Complete';
import { rolesCommand } from './commands/Roles';
import { Command } from './types';
import { helpCommand } from './commands/Help';

export const commands: Command[] = [
  checkApplicantRequirementsCommand,
  acceptApplicationCommand,
  messageCommand,
  petsCommand,
  splitsCommand,
  diaryCommand,
  leaderboardCommand,
  applicationCommand,
  supportCommand,
  scheduleCommand,
  configCommand,
  completeCommand,
  rolesCommand,
  helpCommand
];
