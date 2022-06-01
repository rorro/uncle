import { BaseCommandInteraction, Client, Guild } from 'discord.js';
import { ApplicationCommandOptionTypes, ChannelTypes } from 'discord.js/typings/enums';
import config from '../config';
import { Command } from 'src/types';
import { formatMessage, hasRole, parseMessage, sendMessageInChannel } from '../utils';

export const messageCommand: Command = {
  name: 'message',
  description: 'Send, edit or delete a message',
  type: 'CHAT_INPUT',
  options: [
    {
      type: ApplicationCommandOptionTypes.SUB_COMMAND,
      name: 'send',
      description: 'Send a message in a channel',
      options: [
        {
          type: ApplicationCommandOptionTypes.CHANNEL,
          name: 'channel',
          description: 'The channel to send the message in',
          required: true,
          channelTypes: [ChannelTypes.GUILD_TEXT]
        },
        {
          type: ApplicationCommandOptionTypes.STRING,
          name: 'message',
          description: 'Message to send',
          required: true
        }
      ]
    },
    {
      type: ApplicationCommandOptionTypes.SUB_COMMAND,
      name: 'edit',
      description: 'Edit a message',
      options: [
        {
          type: ApplicationCommandOptionTypes.STRING,
          name: 'message_id',
          description: 'The message id of the message you want to edit',
          required: true
        },
        {
          type: ApplicationCommandOptionTypes.CHANNEL,
          name: 'channel',
          description: 'The channel where the message to edit is',
          required: true,
          channelTypes: [ChannelTypes.GUILD_TEXT]
        },
        {
          type: ApplicationCommandOptionTypes.STRING,
          name: 'message',
          description: 'The new message',
          required: true
        }
      ]
    },
    {
      type: ApplicationCommandOptionTypes.SUB_COMMAND,
      name: 'delete',
      description: 'Delete a message',
      options: [
        {
          type: ApplicationCommandOptionTypes.STRING,
          name: 'message_id',
          description: 'The message id of the message you want to delete',
          required: true
        },
        {
          type: ApplicationCommandOptionTypes.CHANNEL,
          name: 'channel',
          description: 'The channel where the message to delete is',
          required: true,
          channelTypes: [ChannelTypes.GUILD_TEXT]
        }
      ]
    },
    {
      type: ApplicationCommandOptionTypes.SUB_COMMAND,
      name: 'copy',
      description: 'Display a message including the formatting',
      options: [
        {
          type: ApplicationCommandOptionTypes.STRING,
          name: 'message_id',
          description: 'The message id of the message you want to copy',
          required: true
        },
        {
          type: ApplicationCommandOptionTypes.CHANNEL,
          name: 'channel',
          description: 'The channel where the message to copy is',
          required: true,
          channelTypes: [ChannelTypes.GUILD_TEXT]
        }
      ]
    }
  ],
  run: async (client: Client, interaction: BaseCommandInteraction) => {
    if (!interaction.inCachedGuild() || !interaction.isCommand()) return;

    await interaction.deferReply({ ephemeral: true });
    if (!hasRole(interaction.member, config.guild.roles.staff)) {
      await interaction.reply({
        ephemeral: true,
        content: 'You need to be a staff member to use this command!'
      });
      return;
    }
    if (!interaction.isCommand()) return;

    const subCommand = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel('channel', true);
    if (!channel.isText()) return;

    try {
      let response = 'Successfully ';
      switch (subCommand) {
        case 'send':
          const sendMessage = interaction.options.getString('message', true);
          const parsedSend = parseMessage(sendMessage);

          await sendMessageInChannel(client, channel.id, parsedSend);
          response += 'sent message.';
          break;
        case 'edit':
          const editMessageId = interaction.options.getString('message_id', true);
          const editMessage = interaction.options.getString('message', true);
          const parsedEdit = parseMessage(editMessage);

          await channel.messages.edit(editMessageId, { content: parsedEdit });
          response += 'edited message.';
          break;
        case 'delete':
          const deleteMessageId = interaction.options.getString('message_id', true);

          await channel.messages.delete(deleteMessageId);
          response += 'deleted message.';
          break;
        case 'copy':
          const copyMessageId = interaction.options.getString('message_id', true);
          const msg = await channel.messages.fetch(copyMessageId);
          response = formatMessage(msg.content);
          //console.log(response);
          break;
      }
      await interaction.followUp({
        content: response
      });
    } catch (e) {
      await interaction.followUp({
        content: `Oops, something went wrong. Make sure the message id is correct.\nError: ${e}`
      });
    }
  }
};
