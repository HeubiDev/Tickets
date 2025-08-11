const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { setupDatabase } = require('./database/database');
const { registerButtonHandlers } = require('./handlers/button-handler');
const { handleMessage } = require('./handlers/message-handler');
const { handleInteraction } = require('./handlers/interaction-handler');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

setupDatabase();

client.buttonHandlers = new Collection();
registerButtonHandlers(client);

client.once('ready', () => {
  console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
});

client.on('messageCreate', async message => {
  await handleMessage(message);
});

client.on('interactionCreate', async interaction => {
  await handleInteraction(interaction, client);
});

client.login(process.env.DISCORD_TOKEN);