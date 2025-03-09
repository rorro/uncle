import {
    ChatInputCommandInteraction,
    Client,
    ApplicationCommandType,
    ApplicationCommandOptionType,
    EmbedBuilder
} from 'discord.js';
import { Command } from '../types';
import { getSheetData } from '../api/googleHandler';
import config from '../config';
import { getCa, getRank } from '../utils';

export const playerStatsCommand: Command = {
    name: 'playerstats',
    description: 'Get information about a clan member',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'username',
            description: `In-game name.`,
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    run: async (client: Client, interaction: ChatInputCommandInteraction) => {
        const username = interaction.options.getString('username', true);

        const data = await getSheetData(config.googleDrive.newSplitsSheet, "New Summary!1:1000", "FORMATTED_VALUE")
        if (data === undefined || data === null) {
            await interaction.reply({
                content: `Something went wrong while fetching data from splits sheet.`,
                ephemeral: true
            });
            return;
        }

        const headers = data[0];

        const playerData = data.slice(1).find(p => p[0].toLowerCase() === username.toLowerCase());

        if (!playerData) {
            await interaction.reply({
                content: `\`${username}\` was not found in the splits sheet. They are either not a member of the clan or have changed their name. Please contact a staff member for further help.`,
                ephemeral: true
            });
            return
        }

        const [
            name, diaryRank, currentSpeedRank, totalPoints,
            pointsTilNextRank, nextSpeedRank, , splits,
            pointsFromSplits, eventsAttended, pointsFromEvents,
            , mCa, gmCa, ehb, pointsFromEhb, kc2Inferno, kc5Colosseum,
            kc1kCombinedRaids, kc100CoxTobToaExp,
            kc200CoxTobToaExp, kc100CmHm
        ] = playerData as string[]

        let description = `Current rank: ${getRank(diaryRank)} ${diaryRank}\n`
            + `Total points: ${totalPoints}\n`
            + `Points til next rank: ${pointsTilNextRank}\n\n`
            + `**Point Summary**\n`
            + `Points from splits (${splits}): ${pointsFromSplits}\n`
            + `Points from events (${eventsAttended}): ${pointsFromEvents}\n`
            + `Points from EHB (${ehb}): ${pointsFromEhb}\n\n`
            + `**Speed Rank**\n`
            + `Current: ${getRank(currentSpeedRank)} ${currentSpeedRank} | Next: ${getRank(nextSpeedRank)} ${nextSpeedRank}\n\n`
            + `**KC Achievements**\n`
            + `${hasAchieved(kc2Inferno)} 2kc Inferno\n`
            + `${hasAchieved(kc5Colosseum)} 5kc Colosseum\n`
            + `${hasAchieved(kc1kCombinedRaids)} 1k Combined Raids kc\n`
            + `${hasAchieved(kc100CoxTobToaExp)} 100kc CoX & ToB & ToA Exp\n`
            + `${hasAchieved(kc200CoxTobToaExp)} 200kc CoX & ToB & ToA Exp\n`
            + `${hasAchieved(kc100CmHm)} 100kc CM & HM`;

        const title = `${getCa(gmCa === 'Yes' ? 'grandmaster' : mCa === 'Yes' ? 'master' : '')} ${name}`

        const result = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description);



        await interaction.reply({
            embeds: [result],
            ephemeral: true
        });
    }
};

function hasAchieved(achievement: string): string {
    return achievement === 'Yes' ? ':white_check_mark:' : ':x:';
}