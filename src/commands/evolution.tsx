import { SlashCommandBuilder } from 'discord.js';
import { CYCLIC_API } from '../constants/cyclic.js';
import getWargamingResponse from '../core/blitz/getWargamingResponse.js';
import resolveTankId from '../core/blitz/resolveTankId.js';
import addStatTypeSubCommandGroups from '../core/discord/addStatTypeSubCommandGroups.js';
import autocompleteTanks from '../core/discord/autocompleteTanks.js';
import autocompleteUsername from '../core/discord/autocompleteUsername.js';
import interactionToURL from '../core/discord/interactionToURL.js';
import linkButton from '../core/discord/linkButton.js';
import primaryButton from '../core/discord/primaryButton.js';
import resolvePeriodFromButton from '../core/discord/resolvePeriodFromButton.js';
import resolvePeriodFromCommand from '../core/discord/resolvePeriodFromCommand.js';
import resolvePlayerFromButton from '../core/discord/resolvePlayerFromButton.js';
import resolvePlayerFromCommand from '../core/discord/resolvePlayerFromCommand.js';
import { WARGAMING_APPLICATION_ID } from '../core/node/arguments.js';
import { CommandRegistry } from '../events/interactionCreate/index.js';
import evolution from '../renderers/evolution.js';
import { StatType } from '../renderers/statsfull.js';
import { AccountInfo } from '../types/accountInfo.js';

export const evolutionCommand: CommandRegistry = {
  inProduction: true,
  inDevelopment: true,
  inPublic: true,

  command: addStatTypeSubCommandGroups(
    new SlashCommandBuilder()
      .setName('evolution')
      .setDescription('Evolution of statistics'),
  ),

  async handler(interaction) {
    const commandGroup = interaction.options.getSubcommandGroup(
      true,
    ) as StatType;
    const player = await resolvePlayerFromCommand(interaction);
    const period = resolvePeriodFromCommand(interaction);
    const tankIdRaw = interaction.options.getString('tank')!;
    const tankId = commandGroup === 'tank' ? resolveTankId(tankIdRaw) : null;
    const start = interaction.options.getInteger('start');
    const end = interaction.options.getInteger('end');
    const { nickname } = (
      await getWargamingResponse<AccountInfo>(
        `https://api.wotblitz.${player.server}/wotb/account/info/?application_id=${WARGAMING_APPLICATION_ID}&account_id=${player.id}`,
      )
    )[player.id];
    const path = interactionToURL(interaction, {
      ...player,
      tankId,
      start,
      end,
    });

    return [
      await evolution(commandGroup, period, player, tankId),
      primaryButton(path, 'Refresh'),
      // linkButton(`${CYCLIC_API}/${path}`, 'Embed'),
      linkButton(
        `https://www.blitzstars.com/player/${player.server}/${nickname}${
          commandGroup === 'tank' ? `/tank/${tankId!}` : ''
        }`,
        'BlitzStars',
      ),
    ];
  },

  autocomplete: (interaction) => {
    autocompleteUsername(interaction);
    autocompleteTanks(interaction);
  },

  async button(interaction) {
    const url = new URL(`${CYCLIC_API}/${interaction.customId}`);
    const path = url.pathname.split('/').filter(Boolean);
    const commandGroup = path[1] as StatType;
    const period = resolvePeriodFromButton(interaction);
    const player = await resolvePlayerFromButton(interaction);

    return await evolution(
      commandGroup,
      period,
      player,
      parseInt(url.searchParams.get('tankId')!),
    );
  },
};
