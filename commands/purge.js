const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { handleError, handleTimeout } = require('../utils/interactionHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Löscht Nachrichten (Nur Admins)')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Was soll gelöscht werden?')
                .setRequired(true)
                .addChoices(
                    { name: 'Bestimmte Anzahl', value: 'amount' },
                    { name: 'Alle Nachrichten im Channel', value: 'all' },
                    { name: 'Alle von einem User', value: 'all_user' }
                )
        )
        .addIntegerOption(option =>
            option.setName('anzahl')
                .setDescription('Anzahl der Nachrichten (1-1000)')
                .setMinValue(1)
                .setMaxValue(1000)
                .setRequired(false)
        )
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Welcher User soll gelöscht werden?')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        const timeout = handleTimeout(interaction);
        
        try {
            // 1. Sofortige Antwort senden
            await interaction.reply({ content: '⏳ Nachrichten werden gelöscht...', ephemeral: true });

            // 2. Admin-Rollen-Check
            const ADMIN_ROLE = process.env.ADMIN_ROLE_ID;
            if (!interaction.member.roles.cache.has(ADMIN_ROLE)) {
                return await interaction.editReply({ content: '❌ Dieser Befehl ist nur für Admins!' });
            }

            // 3. Optionen auslesen
            const type = interaction.options.getString('type');
            const amount = interaction.options.getInteger('anzahl');
            const user = interaction.options.getUser('user');
            const channel = interaction.channel;

            let deletedCount = 0;

            // 4. Nachrichten löschen
            if (type === 'all') {
                let messages;
                do {
                    messages = await channel.messages.fetch({ limit: 100 });
                    if (messages.size === 0) break;
                    
                    const deletable = messages.filter(m => !m.pinned);
                    if (deletable.size > 0) {
                        await channel.bulkDelete(deletable);
                        deletedCount += deletable.size;
                    }
                } while (messages.size >= 2);
            }
            else if (type === 'all_user') {
                if (!user) {
                    return await interaction.editReply({ content: '❌ Bitte gib einen User an!' });
                }

                let messages;
                do {
                    messages = await channel.messages.fetch({ limit: 100 });
                    if (messages.size === 0) break;
                    
                    const userMessages = messages.filter(m => m.author.id === user.id && !m.pinned);
                    if (userMessages.size > 0) {
                        await channel.bulkDelete(userMessages);
                        deletedCount += userMessages.size;
                    }
                } while (messages.size >= 2);
            }
            else {
                if (!amount) {
                    return await interaction.editReply({ content: '❌ Bitte gib eine Anzahl an!' });
                }

                const messages = await channel.messages.fetch({ limit: amount });
                const toDelete = user 
                    ? messages.filter(m => m.author.id === user.id && !m.pinned)
                    : messages.filter(m => !m.pinned);

                if (toDelete.size > 0) {
                    await channel.bulkDelete(toDelete);
                    deletedCount = toDelete.size;
                }
            }

            // 5. Erfolgsmeldung
            await interaction.editReply({
                content: `✅ ${deletedCount} Nachrichten wurden gelöscht!` +
                        (type === 'all' ? ' (Alle im Channel)' : '') +
                        (type === 'all_user' ? ` (Alle von ${user?.tag})` : '')
            });

            // 6. Logging
            await this.sendLog(interaction, deletedCount, user, type);
        } catch (error) {
            console.error('Purge Command Error:', error);
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ 
                        content: '❌ Fehler beim Löschen der Nachrichten',
                        ephemeral: true 
                    });
                } else {
                    await interaction.reply({ 
                        content: '❌ Fehler beim Löschen der Nachrichten',
                        ephemeral: true 
                    });
                }
            } catch (err) {
                console.error('Failed to send error message:', err);
            }
        } finally {
            clearTimeout(timeout);
        }
    },

    async sendLog(interaction, count, user, type) {
        try {
            const logChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
            if (!logChannel) return;

            const executor = interaction.member;
            const highestRole = executor.roles.highest;

            const logEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('🗑️ Admin Nachrichten-Löschung')
                .addFields(
                    { name: 'Admin', value: `${executor.user.tag} (${executor.user.id})`, inline: true },
                    { name: 'Rolle', value: `${highestRole.name}`, inline: true },
                    { name: 'Typ', value: this.getTypeDescription(type), inline: true },
                    { name: 'Anzahl', value: `${count}`, inline: true },
                    { name: 'Channel', value: `${interaction.channel.name} (${interaction.channel.id})`, inline: true },
                    { name: 'Zeit', value: new Date().toLocaleString('de-DE'), inline: true }
                );

            if (user) {
                logEmbed.addFields(
                    { name: 'Betroffener User', value: `${user.tag} (${user.id})`, inline: true }
                );
            }

            await logChannel.send({ embeds: [logEmbed] });
        } catch (error) {
            console.error('Failed to send log:', error);
        }
    },

    getTypeDescription(type) {
        switch(type) {
            case 'all': return 'Alle Nachrichten im Channel';
            case 'all_user': return 'Alle von einem User';
            default: return 'Bestimmte Anzahl';
        }
    }
};