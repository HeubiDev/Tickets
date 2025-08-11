async function handleInteraction(interaction, client) {
  if (!interaction.isButton()) return;

  const handler = client.buttonHandlers.get(interaction.customId);
  if (!handler) return;

  try {
    await handler(interaction, client);
  } catch (error) {
    console.error('Error handling button interaction:', error);
    if (!interaction.replied) {
      await interaction.reply({ 
        content: '❌ An error occurred while processing your request.', 
        ephemeral: true 
      });
    }
  }
}

module.exports = {
  handleInteraction
};