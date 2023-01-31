import {
  ChatInputCommandInteraction,
  Client,
  InteractionReplyOptions,
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ChannelType
} from 'discord.js';
import { Command, ScheduledMessage } from '../types';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import { hasRole, DATE_FORMAT } from '../utils';
import config from '../config';
import KnexDB from '../database/knex';
import { ScheduledMessageType } from '../types';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

export const scheduleCommand: Command = {
  name: 'schedule',
  description: 'Schedules a message in UTC time',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'view',
      description: 'View all the scheduled messages'
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'embed',
      description: 'Schedule an embed',
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
          description: `How to format the message: https://discordjs.guide/popular-topics/embeds.html#using-an-embed-object`,
          type: ApplicationCommandOptionType.String,
          required: true
        }
      ]
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'simple',
      description: 'Schedule an simple message',
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
      ]
    }
  ],

  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.inCachedGuild() || !interaction.isCommand()) return;

    if (!hasRole(interaction.member, config.guild.roles.staff)) {
      await interaction.reply({
        ephemeral: true,
        content: 'You need to be a staff member to use this command!'
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const subCommand = interaction.options.getSubcommand();

    if (subCommand === 'view') {
      const URL = config.API.url;
      const PORT = config.API.port;
      interaction.followUp({
        content: `You can find all the scheduled messages here: ${URL}:${PORT}/messages`
      });
      return;
    }

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
      )} UTC\` in ${channel}.\n\n`
    };

    switch (subCommand) {
      case 'embed':
        try {
          const jsonMessage = JSON.parse(message);
          const embedData = jsonMessage['embed'];

          if (!embedData) throw new Error();

          const embed = new EmbedBuilder(embedData);
          const content = jsonMessage['content'] ? jsonMessage['content'] : '';

          messageToSchedule.type = 'embed';
          messageToSchedule.embed = embed.toJSON();
          messageToSchedule.content = content;

          options.embeds = [embed];
          options.content += content;
        } catch {
          interaction.followUp({
            content:
              'Something is wrong with the way you formatted the EmbedBuilderOptions. Here is how to format them: https://discordjs.guide/popular-topics/embeds.html#using-an-embed-object'
          });
          return;
        }
        break;
      case 'simple':
        options.content += message;
        messageToSchedule.content = message;
        break;
    }

    await scheduleMessage(messageToSchedule);
    await interaction.followUp(options);
  }
};

async function scheduleMessage(messageToSchedule: ScheduledMessage) {
  const messageType = messageToSchedule.embed ? ScheduledMessageType.Embed : ScheduledMessageType.Simple;
  const newMessage = {
    content: messageToSchedule.content,
    embed: messageToSchedule.embed
  };
  KnexDB.insertScheduledMessage({
    message: JSON.stringify(newMessage),
    date: messageToSchedule.date,
    channel: messageToSchedule.channel,
    type: messageType
  });
}
