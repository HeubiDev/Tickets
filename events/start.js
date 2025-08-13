const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    // Konfiguration
    const developerId = '1280117351488159796';
    const logChannelId = '1399510908723663001';
    const scanDirectory = './';

    // Holt die 3 zuletzt bearbeiteten Dateien
    function getLastModifiedFiles() {
        try {
            return fs.readdirSync(scanDirectory)
                .filter(file => fs.statSync(path.join(scanDirectory, file)).isFile())
                .map(file => ({
                    name: file,
                    mtime: fs.statSync(path.join(scanDirectory, file)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime)
                .slice(0, 3)
                .map(file => `• ${file.name} (${file.mtime.toLocaleString()})`);
        } catch (error) {
            console.error('Fehler beim Lesen der Dateien:', error);
            return ['Fehler beim Abrufen der Dateiliste'];
        }
    }

    // Bot-Start-Log
    client.once('ready', async () => {
        const channel = client.channels.cache.get(logChannelId);
        if (!channel) return console.error('Log-Channel nicht gefunden!');

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🚀 Bot gestartet')
            .setDescription(`Startzeit: <t:${Math.floor(Date.now() / 1000)}:R>`)
            .addFields(
                { 
                    name: '👨‍💻 Developer', 
                    value: `\n<@${developerId}>`,
                    inline: true 
                },
                { 
                    name: '📝 Letzte Änderungen', 
                    value: getLastModifiedFiles().join('\n') || 'Keine Änderungen erkannt',
                    inline: false 
                }
            )
            .setTimestamp();

        channel.send({ embeds: [embed] }).catch(console.error);
    });
};