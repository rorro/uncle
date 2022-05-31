import { Command } from './types';
import { helpCommand } from './commands/Help';
import { checkApplicantRequirementsCommand } from './commands/CheckApplicantRequirements';
import { acceptApplicationCommand } from './commands/AcceptApplication';
import { messageCommand } from './commands/Message';

export const commands: Command[] = [
  helpCommand,
  checkApplicantRequirementsCommand,
  acceptApplicationCommand,
  messageCommand
];
