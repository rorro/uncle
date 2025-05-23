import {
  ChatInputCommandInteraction,
  Client,
  InteractionReplyOptions,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ChannelType,
  MessageFlags
} from 'discord.js';
import { Command, ScheduledMessage } from '../types';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import { DATE_FORMAT, isStaff } from '../utils';
import { ScheduledMessageType } from '../types';
import db from '../database/operations';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

export const scheduleCommand: Command = {
  name: 'schedule',
  description: 'Schedules a message in UTC time',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'date',
      description: `What time to send the message at. Formatted ${DATE_FORMAT}.`,
      type: ApplicationCommandOptionType.String,
      required: true
    },
    {
      name: 'channel',
      description: 'What channel to send the message in',
      type: ApplicationCommandOptionType.Channel,
      required: true,
      channelTypes: [ChannelType.GuildText]
    },
    {
      name: 'message',
      description: `Message to send`,
      type: ApplicationCommandOptionType.String,
      required: true
    }
  ],

  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.inCachedGuild() || !interaction.isCommand()) return;

    if (!isStaff(interaction.member)) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: 'You need to be a staff member to use this command!'
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const date = interaction.options.getString('date', true);
    const validFormat = dayjs(date, DATE_FORMAT, true).utc().isValid();

    if (!validFormat) {
      await interaction.followUp(
        `Given date is formatted wrong. It should be formatted like this: ${DATE_FORMAT}.`
      );
      return;
    }

    const scheduledDate = dayjs.utc(date);

    if (scheduledDate.diff(dayjs().utc().format(DATE_FORMAT), 'minute') <= 0) {
      await interaction.followUp(`Given date has already passed.`);
      return;
    }

    const channel = interaction.options.getChannel('channel', true);
    const message = interaction.options.getString('message', true);

    const messageToSchedule: ScheduledMessage = {
      date: date,
      channel: channel.id,
      type: 'simple'
    };

    const options: InteractionReplyOptions = {
      content: `The following message has been scheduled for \`${scheduledDate.format(
        DATE_FORMAT
      )} UTC\` in ${channel}.\n\`\`\` \`\`\``
    };

    options.content +=
      message + '``` ```If you want to view of edit the message, please visit the bot dashboard.';
    messageToSchedule.content = message;
    messageToSchedule.embed = {};

    await scheduleMessage(messageToSchedule);
    await interaction.followUp(options);
  }
};

async function scheduleMessage(messageToSchedule: ScheduledMessage) {
  const newMessage = {
    content: messageToSchedule.content,
    embed: messageToSchedule.embed
  };
  db.insertScheduledMessage({
    message: JSON.stringify(newMessage),
    date: messageToSchedule.date,
    channel: messageToSchedule.channel,
    type: ScheduledMessageType.Embed
  });
}
