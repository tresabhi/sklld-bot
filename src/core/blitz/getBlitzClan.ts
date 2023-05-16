import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { BlitzServer } from '../../constants/servers.js';
import errorEmbed from '../interaction/errorEmbed.js';
import { serverAndIdPattern } from './getBlitzAccount.js';
import listClansPanServer from './listClansPanServer.js';

export default async function getBlitzClan(
  interaction: ChatInputCommandInteraction<CacheType>,
  clan: string,
): Promise<{ server: BlitzServer; id: number } | null> {
  if (serverAndIdPattern.test(clan)) {
    const [server, accountId] = clan.split('/');
    return { server: server as BlitzServer, id: Number(accountId) };
  } else {
    const accounts = await listClansPanServer(clan);

    if (accounts[0]) {
      return { server: accounts[0].server, id: accounts[0].clan_id };
    } else {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Could not find user',
            `I couldn't find clan \`${clan}\`. Try selecting a username from the search result.`,
          ),
        ],
      });

      return null;
    }
  }
}
