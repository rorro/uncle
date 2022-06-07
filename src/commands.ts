import { Command } from './types';
import { helpCommand } from './commands/Help';
import { checkApplicantRequirementsCommand } from './commands/CheckApplicantRequirements';
import { acceptApplicationCommand } from './commands/AcceptApplication';
import { messageCommand } from './commands/Message';
import { petsCommand } from './commands/Pets';

export const commands: Command[] = [
  helpCommand,
  checkApplicantRequirementsCommand,
  acceptApplicationCommand,
  messageCommand,
  petsCommand
];
