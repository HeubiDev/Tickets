const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();
const cleanupTickets = require('./utils/cleanupTickets');
require('dotenv').config();
const token = process.env.DISCORD_TOKEN;

// Bot-Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// ----------------------------
// 1️⃣ Commands laden
// ----------------------------
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(JSON.parse(JSON.stringify(command.data)));
}

// ----------------------------
// 2️⃣ Commands automatisch registrieren
// ----------------------------
async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(token);

    try {
        console.log(`🚀 Lade ${commands.length} Slash-Commands zu Discord hoch...`);
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('✅ Slash-Commands erfolgreich registriert.');
    } catch (error) {
        console.error('❌ Fehler beim Registrieren der Commands:', error);
    }
}

// ----------------------------
// 3️⃣ Events laden
// ----------------------------
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// ----------------------------
// 4️⃣ Bot Start
// ----------------------------
client.once('ready', async () => {
    console.log(`✅ Eingeloggt als ${client.user.tag}`);
    await registerCommands(); // Slash-Commands beim Start hochladen
    await cleanupTickets(client); // Ticket-Bereinigung
});

console.log('Commands:', commands);

client.login(token);