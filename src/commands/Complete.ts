import {
  ChatInputCommandInteraction,
  Client,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  MessageFlags
} from 'discord.js';
import { Command } from '../types';
import { combinations } from '../utils';

export const completeCommand: Command = {
  name: 'complete',
  description: 'Calculate the amount of rolls needed to complete a set of items',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'drop_rates',
      description: `Format: 1/50 3;1/300`,
      type: ApplicationCommandOptionType.String,
      required: true
    },
    {
      name: 'decimals',
      description: 'The amount of decimal points to round to.',
      type: ApplicationCommandOptionType.Number
    }
  ],
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const input = interaction.options.getString('drop_rates', true);

    const fractionRegex = new RegExp(
      '^(?:\\d+\\/\\d+|\\d+;\\d+\\/\\d+)(?:\\s+(?:\\d+\\/\\d+|\\d+;\\d+\\/\\d+))*$'
    );
    if (!fractionRegex.test(input)) {
      await interaction.reply({
        content: `The given format was wrong. Please use the following format: amount;numerator/denominator. For example 3;1/150 1/500 5;1/100.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const decimals = interaction.options.getNumber('decimals');
    const roundTo = decimals ? decimals : 0;

    let avg = 0;
    let sign = 1;
    const probs = parseInput(input);

    for (let i = 0; i < probs.length; i++) {
      let innerSum = 0;
      const combs = combinations(probs, i + 1);

      for (const c of combs) {
        innerSum += 1 / c.reduce((sum, curr) => sum + curr, 0);
      }
      avg += sign * innerSum;
      sign *= -1;
    }

    await interaction.reply({
      content: `${avg.toFixed(roundTo)} rolls needed on average to get all items.`,
      flags: MessageFlags.Ephemeral
    });
  }
};

function parseInput(input: string): number[] {
  let result: number[] = [];
  const splitInput = input.split(' ');

  for (const item of splitInput) {
    let amount,
      rate = '';
    if (item.includes(';')) {
      [amount, rate] = item.split(';');
    } else {
      rate = item;
    }

    const [numerator, denominator] = rate.split('/').map(x => parseInt(x));
    result.push(...new Array(amount ? parseInt(amount) : 1).fill(numerator / denominator));
  }

  return result;
}
