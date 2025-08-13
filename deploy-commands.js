const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Erweiterte Fehlerbehandlung
process.on('unhandledRejection', error => {
    console.error('Unhandled Promise Rejection:', error);
});

// Command-Loader mit besseren Fehlermeldungen
async function loadCommands() {
    const commands = [];
    const commandPath = path.join(__dirname, 'commands');
    
    try {
        const commandFiles = fs.readdirSync(commandPath)
            .filter(file => file.endsWith('.js') && !file.startsWith('_'));

        for (const file of commandFiles) {
            try {
                const command = require(path.join(commandPath, file));
                
                if (!command.data) {
                    console.warn(`⚠️ Command ${file} hat keine data property!`);
                    continue;
                }

                // Flexibles JSON-Handling
                const commandData = command.data.toJSON?.() || command.data;
                commands.push(commandData);
                
            } catch (fileError) {
                console.error(`❌ Fehler beim Laden von ${file}:`, fileError);
            }
        }
        
        return commands;
    } catch (dirError) {
        console.error('❌ Fehler beim Lesen des Command-Ordners:', dirError);
        process.exit(1);
    }
}

// Hauptfunktion
(async () => {
    try {
        const commands = await loadCommands();
        
        if (commands.length === 0) {
            console.warn('⚠️ Keine Commands gefunden!');
            return;
        }

        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
        
        console.log(`🚀 Starte Upload von ${commands.length} Commands...`);

        // Deployment mit Fortschrittsanzeige
        const startTime = Date.now();
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );

        console.log(`✅ ${data.length} Slash-Commands erfolgreich in ${((Date.now() - startTime) / 1000).toFixed(2)}s hochgeladen.`);
        
    } catch (error) {
        console.error('❌ Kritischer Fehler beim Deployment:', error);
        
        // Detaillierte Fehleranalyse
        if (error.code === 50001) {
            console.error('Fehler: Bot hat keine Zugriffsberechtigungen');
        } else if (error.code === 40041) {
            console.error('Fehler: Ungültige Command-Daten');
        }
        
        process.exit(1);
    }
})();