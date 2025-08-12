module.exports = {
  data: {
    name: 'ping',
    description: 'Antwortet mit Pong!',
    toJSON() {
      return { name: this.name, description: this.description };
    }
  },
  async execute(interaction) {
    await interaction.reply('Pong!');
  }
};

