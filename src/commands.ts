import { Command } from './types';
import { helpCommand } from './commands/Help';
import { checkApplicantRequirementsCommand } from './commands/CheckApplicantRequirements';
import { acceptApplicationCommand } from './commands/AcceptApplication';

export const commands: Command[] = [
  helpCommand,
  checkApplicantRequirementsCommand,
  acceptApplicationCommand
];
