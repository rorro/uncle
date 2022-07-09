import { Command } from './types';
import { helpCommand } from './commands/Help';
import { checkApplicantRequirementsCommand } from './commands/CheckApplicantRequirements';
import { acceptApplicationCommand } from './commands/AcceptApplication';
import { messageCommand } from './commands/Message';
import { petsCommand } from './commands/Pets';
import { splitsCommand } from './commands/Splits';
import { diaryCommand } from './commands/Diary';

export const commands: Command[] = [
  helpCommand,
  checkApplicantRequirementsCommand,
  acceptApplicationCommand,
  messageCommand,
  petsCommand,
  splitsCommand,
  diaryCommand
];
