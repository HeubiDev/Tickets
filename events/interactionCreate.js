const ticketDB = require('../utils/ticketDB');
const logSystem = require('../utils/log');
const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (command) await command.execute(interaction, client);
            return;
        }

        // Ticket erstellen
        if (interaction.isButton() && interaction.customId === 'create_ticket') {
            const existingTicket = ticketDB.get(interaction.user.id);
            if (existingTicket) {
                const existsEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Du hast bereits ein Ticket')
                    .setDescription(`Bitte benutze dein bestehendes Ticket: <#${existingTicket.channelId}>`)
                    .setColor('Yellow');
                return interaction.reply({ embeds: [existsEmbed], flags: MessageFlags.Ephemeral });
            }

            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: 0,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                    },
                    {
                        id: interaction.client.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                    }
                ]
            });

            ticketDB.set(
                interaction.user.id,
                ticketChannel.id,
                ticketChannel.name,
                interaction.user.username
            );

            const closeButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`close_ticket_${interaction.user.id}`)
                    .setLabel('🔒 Ticket schließen')
                    .setStyle(ButtonStyle.Danger)
            );

            const ticketEmbed = new EmbedBuilder()
                .setTitle('🎫 Ticket erstellt')
                .setDescription(`Hallo ${interaction.user}, bitte beschreibe hier dein Anliegen.\nEin Teammitglied wird dir bald antworten.`)
                .setColor('Green');

            await ticketChannel.send({ embeds: [ticketEmbed], components: [closeButton] });

            const confirmEmbed = new EmbedBuilder()
                .setTitle('✅ Ticket erstellt')
                .setDescription(`Dein Ticket wurde erstellt: ${ticketChannel}`)
                .setColor('Green');

            // Logging
            await logSystem.logAction(client, 'ticket_create', {
                userId: interaction.user.id,
                channelId: ticketChannel.id
            });

            return interaction.reply({ embeds: [confirmEmbed], flags: MessageFlags.Ephemeral });
        }

        // Ticket claimen
        if (interaction.isButton() && interaction.customId.startsWith('claim_ticket_')) {
            const channelId = interaction.customId.replace('claim_ticket_', '');
            const ticket = ticketDB.getByChannelId(channelId);

            if (!ticket) {
                return interaction.reply({
                    content: '❌ Ticket nicht gefunden!',
                    ephemeral: true
                });
            }

            if (ticket.claimedBy) {
                return interaction.reply({
                    content: `❌ Ticket bereits geclaimt von <@${ticket.claimedBy}>!`,
                    ephemeral: true
                });
            }

            // Ticket claimen
            ticketDB.claimTicket(channelId, interaction.user.id);

            // Prioritäts-Auswahl erstellen
            const prioritySelect = new StringSelectMenuBuilder()
                .setCustomId(`set_priority_${channelId}`)
                .setPlaceholder('Priorität auswählen')
                .addOptions(
                    {
                        label: '🔴 Hoch',
                        description: 'Dringende Probleme (z.B. Zahlungsfehler)',
                        value: 'high'
                    },
                    {
                        label: '🟡 Mittel',
                        description: 'Normale Support-Anfragen',
                        value: 'medium'
                    },
                    {
                        label: '🟢 Niedrig',
                        description: 'Allgemeine Fragen',
                        value: 'low'
                    }
                );

            const priorityRow = new ActionRowBuilder().addComponents(prioritySelect);

            // Nachricht mit Prioritätsauswahl senden
            await interaction.reply({
                content: '✅ Ticket geclaimt. Bitte Priorität auswählen:',
                components: [priorityRow],
                ephemeral: true
            });

            // Benachrichtigung im Ticket-Channel
            const ticketChannel = await interaction.client.channels.fetch(channelId);
            if (ticketChannel) {
                const claimEmbed = new EmbedBuilder()
                    .setTitle('🙋 Ticket geclaimt')
                    .setDescription(`<@${interaction.user.id}> kümmert sich nun um dieses Ticket.\n**Status:** Priorität wird ausgewählt...`)
                    .setColor(0xffff00);

                await ticketChannel.send({ embeds: [claimEmbed] });
            }

            // Logging des Claims (ohne Priorität)
            await logSystem.logAction(client, 'ticket_claim', {
                channelId,
                claimerId: interaction.user.id,
                userId: ticket.userId
            });
        }

        // Prioritäts-Handling
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('set_priority_')) {
            const channelId = interaction.customId.replace('set_priority_', '');
            const priority = interaction.values[0];
            const ticket = ticketDB.getByChannelId(channelId);

            if (!ticket) {
                return interaction.reply({
                    content: '❌ Ticket nicht gefunden!',
                    ephemeral: true
                });
            }

            // Emoji und Farbe basierend auf Priorität
            const priorityData = {
                high: { emoji: '🔴', color: 0xff0000, name: 'Hoch' },
                medium: { emoji: '🟡', color: 0xffff00, name: 'Mittel' },
                low: { emoji: '🟢', color: 0x00ff00, name: 'Niedrig' }
            };

            // Channel umbennen
            const ticketChannel = await interaction.client.channels.fetch(channelId);
            if (ticketChannel) {
                const newName = ticketChannel.name.replace(/^[🔴🟡🟢]-?/, '') + priorityData[priority].emoji;
                await ticketChannel.setName(newName).catch(console.error);
            }

            // Datenbank aktualisieren
            ticketDB.setPriority(channelId, priority);

            // Embed für Ticket-Channel
            const priorityEmbed = new EmbedBuilder()
                .setTitle(`📌 Priorität gesetzt: ${priorityData[priority].name}`)
                .setDescription(`Bearbeiter: <@${interaction.user.id}>`)
                .setColor(priorityData[priority].color)
                .setFooter({ text: 'Ticket-System' });

            await ticketChannel.send({ embeds: [priorityEmbed] });

            // Logging mit Priorität
            await logSystem.logAction(client, 'ticket_priority', {
                channelId,
                claimerId: interaction.user.id,
                priority: priority,
                userId: ticket.userId
            });

            // Bestätigung an den Bearbeiter
            await interaction.update({
                content: `✅ Priorität auf "${priorityData[priority].name}" gesetzt!`,
                components: []
            });
        }

        // Ticket schließen
        if ((interaction.isButton() && interaction.customId.startsWith('close_ticket_')) || 
            (interaction.isChatInputCommand() && interaction.commandName === 'close')) {
            
            let ticketData;
            if (interaction.isButton()) {
                const userId = interaction.customId.replace('close_ticket_', '');
                ticketData = ticketDB.get(userId);
            } else {
                ticketData = ticketDB.getByChannelId(interaction.channel.id);
            }

            if (!ticketData) {
                return interaction.reply({ 
                    content: '❌ Kein Ticket für diesen Channel gefunden.', 
                    flags: MessageFlags.Ephemeral
                });
            }

            // Nachrichten sammeln
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const transcript = messages
                .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
                .map(msg => `[${new Date(msg.createdTimestamp).toLocaleString()}] ${msg.author.tag}: ${msg.content}`)
                .join('\n');

            // Embed erstellen
            const embed = new EmbedBuilder()
                .setTitle(`Ticket-Transkript: ${ticketData.channelName}`)
                .setDescription(`Ticket von ${ticketData.username}`)
                .addFields(
                    { name: 'Erstellt am', value: new Date(ticketData.createdAt).toLocaleString(), inline: true },
                    { name: 'Ersteller', value: `<@${ticketData.userId}>`, inline: true },
                    { name: 'Transkript', value: transcript.slice(0, 1024) || 'Keine Nachrichten.' }
                )
                .setColor(0x00AE86)
                .setFooter({ text: `Ticket ID: ${ticketData.channelId}` });

            // Transkript an User senden
            try {
                const user = await interaction.client.users.fetch(ticketData.userId);
                await user.send({ embeds: [embed] });
            } catch (err) {
                console.error('Konnte Transkript nicht an User senden:', err);
            }

            // Logging
            await logSystem.logAction(client, 'ticket_close', {
                channelName: ticketData.channelName,
                closerId: interaction.user.id,
                duration: this.calculateDuration(ticketData.createdAt)
            });

            // Ticket aus Datenbank entfernen
            ticketDB.delete(ticketData.userId);

            // Antwort senden
            await interaction.reply({ 
                content: 'Ticket geschlossen. Transkript wurde versendet.', 
                flags: MessageFlags.Ephemeral
            });

            // Channel löschen
            setTimeout(() => {
                interaction.channel.delete().catch(console.error);
            }, 3000);
        }
    },

    calculateDuration(createdAt) {
        const created = new Date(createdAt);
        const now = new Date();
        const diff = now - created;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        return `${days} Tage, ${hours.toFixed(1)} Stunden`;
    }
};