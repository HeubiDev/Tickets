const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getNextTicketNumber, addTicket, removeTicket, getTicketByChannel, getTicketByUser } = require('../database/database');
const { saveTranscript } = require('../services/transcript-service');

async function handleTicketButton(interaction, client) {
  const guild = interaction.guild;
  const user = interaction.user;

  const existingTicket = getTicketByUser(guild.id, user.id);
  if (existingTicket) {
    return interaction.reply({ 
      content: '❌ You already have an open ticket! Please close your existing ticket before opening a new one.', 
      ephemeral: true 
    });
  }

  const ticketNumber = getNextTicketNumber(guild.id);
  const channelName = `ticket-${String(ticketNumber).padStart(4, '0')}`;
  const ticketCategoryId = process.env.TICKET_CATEGORY_ID;

  try {
    const channel = await guild.channels.create({
      name: channelName,
      type: 0,
      parent: ticketCategoryId,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles
          ]
        }
      ],
    });

    addTicket(guild.id, channel.id, user.id);

    const embed = {
      title: '🎫 Support Ticket',
      description: `Hello ${user}! Thank you for creating a support ticket.\n\n` +
                  `**Ticket #${ticketNumber}**\n` +
                  `A staff member will be with you shortly. Please describe your issue in detail.\n\n` +
                  `To close this ticket, click the **Close Ticket** button below.`,
      color: 0x00ff00,
      timestamp: new Date().toISOString(),
      footer: {
        text: `Ticket #${ticketNumber} • ${guild.name}`,
        icon_url: guild.iconURL()
      }
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close-ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒')
    );

    await interaction.reply({ 
      content: `✅ Your ticket has been created: ${channel}`, 
      ephemeral: true 
    });

    await channel.send({ 
      embeds: [embed], 
      components: [row] 
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    await interaction.reply({ 
      content: '❌ Failed to create ticket. Please contact an administrator.', 
      ephemeral: true 
    });
  }
}

async function handleCloseTicket(interaction, client) {
  const channel = interaction.channel;
  const ticket = getTicketByChannel(channel.id);

  if (!ticket) {
    return interaction.reply({ 
      content: '❌ This channel is not a ticket.', 
      ephemeral: true 
    });
  }

  const user = interaction.user;
  const member = interaction.member;
  const isTicketOwner = ticket.user_id === user.id;
  const hasManageChannels = member.permissions.has(PermissionFlagsBits.ManageChannels);

  if (!isTicketOwner && !hasManageChannels) {
    return interaction.reply({
      content: '❌ You can only close your own tickets or you need Manage Channels permission.',
      ephemeral: true
    });
  }

  try {
    await interaction.reply('🔄 Closing ticket and saving transcript...');

    await saveTranscript(channel, client);

    removeTicket(channel.id);

    setTimeout(async () => {
      try {
        await channel.delete('Ticket closed');
      } catch (error) {
        console.error('Error deleting ticket channel:', error);
      }
    }, 3000);

  } catch (error) {
    console.error('Error closing ticket:', error);
    await interaction.followUp({ 
      content: '❌ An error occurred while closing the ticket.', 
      ephemeral: true 
    });
  }
}

module.exports = {
  handleTicketButton,
  handleCloseTicket
};