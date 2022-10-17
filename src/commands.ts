import { acceptApplicationCommand } from './commands/AcceptApplication';
import { applicationCommand } from './commands/Application';
import { checkApplicantRequirementsCommand } from './commands/CheckApplicantRequirements';
import { configCommand } from './commands/Config';
import { diaryCommand } from './commands/Diary';
import { helpCommand } from './commands/Help';
import { leaderboardCommand } from './commands/Leaderboard';
import { messageCommand } from './commands/Message';
import { petsCommand } from './commands/Pets';
import { scheduleCommand } from './commands/ScheduleMessage';
import { splitsCommand } from './commands/Splits';
import { supportCommand } from './commands/Suport';
import { Command } from './types';

export const commands: Command[] = [
  helpCommand,
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
  configCommand
];
