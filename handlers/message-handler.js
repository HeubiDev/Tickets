const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

async function handleMessage(message) {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (commandName === 'setuptickets') {
    await handleSetupTicketsCommand(message);
  }
}

async function handleSetupTicketsCommand(message) {
  if (!message.member.permissions.has('Administrator')) {
    return message.reply('❌ You need Administrator permission to run this command.');
  }

  if (process.env.BOT_OWNER_ID && message.author.id !== process.env.BOT_OWNER_ID) {
    return message.reply('⛔ You are not allowed to use this command.');
  }

  const embed = new EmbedBuilder()
    .setTitle('🎟️ Support Tickets')
    .setDescription(
      '**Need help?** Click the button below to create a support ticket.\n\n' +
      '• Our staff team will assist you as soon as possible\n' +
      '• Please be patient and provide detailed information\n' +
      '• One ticket per user at a time'
    )
    .setColor('Blurple')
    .setThumbnail(message.guild.iconURL())
    .setFooter({
      text: `${message.guild.name} Support`,
      iconURL: message.guild.iconURL()
    })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open-ticket')
      .setLabel('Create Ticket')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎫')
  );

  try {
    await message.channel.send({ embeds: [embed], components: [row] });
    await message.react('✅');
  } catch (error) {
    console.error('Error sending ticket panel:', error);
    message.reply('❌ Failed to setup ticket panel. Please check bot permissions.');
  }
}

module.exports = {
  handleMessage
};