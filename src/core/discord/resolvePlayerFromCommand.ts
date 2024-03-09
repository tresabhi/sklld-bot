import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import markdownEscape from 'markdown-escape';
import { Region } from '../../constants/regions';
import { UserError } from '../../hooks/userError';
import searchPlayersAcrossRegions from '../blitz/searchPlayersAcrossRegions';
import { getBlitzFromDiscord } from '../blitzkrieg/discordBlitz';
import { translator } from '../localization/translator';

export const serverAndIdPattern = /(com|eu|asia)\/[0-9]+/;

export interface ResolvedPlayer {
  region: Region;
  id: number;
}

export default async function resolvePlayerFromCommand(
  interaction: ChatInputCommandInteraction<CacheType>,
) {
  const { t, translate } = translator(interaction.locale);
  const commandUsername = interaction.options.getString('username');

  if (commandUsername) {
    if (serverAndIdPattern.test(commandUsername)) {
      const [server, accountId] = commandUsername.split('/');

      return {
        region: server as Region,
        id: Number(accountId),
      } satisfies ResolvedPlayer;
    } else {
      const accounts = await searchPlayersAcrossRegions(commandUsername);

      if (accounts[0]) {
        return {
          region: accounts[0].region,
          id: accounts[0].account_id,
        } satisfies ResolvedPlayer;
      } else {
        throw new UserError(
          translate('bot.common.errors.player_not_found', [
            markdownEscape(commandUsername),
          ]),
        );
      }
    }
  } else {
    const account = await getBlitzFromDiscord(parseInt(interaction.user.id));

    if (account) {
      return { region: account.region, id: account.blitz };
    } else {
      throw new UserError(t`bot.common.errors.player_not_linked`);
    }
  }
}
