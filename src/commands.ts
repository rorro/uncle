import { Command } from './types';
import { helpCommand } from './commands/Help';
import { checkApplicantRequirementsCommand } from './commands/CheckApplicantRequirements';

export const commands: Command[] = [helpCommand, checkApplicantRequirementsCommand];
