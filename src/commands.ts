import { acceptApplicationCommand } from './commands/AcceptApplication';
import { applicationCommand } from './commands/Application';
import { checkApplicantRequirementsCommand } from './commands/CheckApplicantRequirements';
import { diaryCommand } from './commands/Diary';
import { messageCommand } from './commands/Message';
import { scheduleCommand } from './commands/ScheduleMessage';
import { splitsCommand } from './commands/Splits';
import { supportCommand } from './commands/Suport';
import { completeCommand } from './commands/Complete';
import { rolesCommand } from './commands/Roles';
import { Command } from './types';
import { playerStatsCommand } from './commands/PlayerStats';

export const commands: Command[] = [
  checkApplicantRequirementsCommand,
  acceptApplicationCommand,
  messageCommand,
  //splitsCommand,
  //diaryCommand,
  applicationCommand,
  supportCommand,
  scheduleCommand,
  completeCommand,
  rolesCommand,
  playerStatsCommand
];
