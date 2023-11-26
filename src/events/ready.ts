import { ActivityType, Client } from 'discord.js';

export default function ready(client: Client<true>) {
  console.log(`🟢 Launched bot ${client.shard?.ids[0] ?? 'default'}`);

  const activities: (() => string)[] = [
    () => `Living in ${client.guilds.cache.size.toLocaleString()} servers`,
    () =>
      `Serving ${client.guilds.cache
        .reduce((accumulator, guild) => accumulator + guild.memberCount, 0)
        .toLocaleString()} users`,
    () => `Observing ${client.channels.cache.size.toLocaleString()} channels`,
  ];

  client.user.setPresence({
    activities: [
      {
        type: ActivityType.Custom,
        name: activities[Math.floor(Math.random() * activities.length)](),
      },
    ],
  });
}
