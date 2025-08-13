const { MessageFlags } = require('discord.js');

// Timeout-Handler
function handleTimeout(interaction, timeoutMs = 10000) {
    return setTimeout(async () => {
        if (!interaction.replied && !interaction.deferred) {
            try {
                await interaction.reply({
                    content: '⌛ Die Interaktion ist abgelaufen. Bitte versuche es erneut.',
                    flags: MessageFlags.Flags.Ephemeral
                });
            } catch (error) {
                console.error('Timeout Error:', error);
            }
        }
    }, timeoutMs);
}

// Sichere Antwort-Methode
async function safeReply(interaction, options) {
    try {
        if (interaction.replied) {
            return await interaction.followUp({
                ...options,
                flags: options.ephemeral ? MessageFlags.Flags.Ephemeral : undefined
            });
        } else if (interaction.deferred) {
            return await interaction.editReply(options);
        } else {
            return await interaction.reply({
                ...options,
                flags: options.ephemeral ? MessageFlags.Flags.Ephemeral : undefined
            });
        }
    } catch (error) {
        console.error('Reply Error:', error);
        throw error;
    }
}

// Fehler-Handler
async function handleError(interaction, error, commandName) {
    console.error(`[ERROR] Command ${commandName}:`, error);
    
    try {
        const errorMessage = {
            content: '❌ Ein Fehler ist aufgetreten! Bitte versuche es später erneut.',
            flags: MessageFlags.Flags.Ephemeral
        };

        if (interaction.replied) {
            await interaction.followUp(errorMessage).catch(console.error);
        } else if (interaction.deferred) {
            await interaction.editReply(errorMessage).catch(console.error);
        } else {
            await interaction.reply(errorMessage).catch(console.error);
        }
    } catch (err) {
        console.error('[CRITICAL] Failed to send error message:', err);
    }
}

module.exports = {
    handleError,
    handleTimeout,
    safeReply
};