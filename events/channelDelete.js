const ticketDB = require('../utils/ticketDB');

module.exports = {
    name: 'channelDelete',
    async execute(channel) {
        const allTickets = ticketDB.all();
        const ticket = allTickets.find(t => t.channelId === channel.id);

        if (ticket) {
            console.log(`🗑 Ticket-Kanal gelöscht: Entferne Eintrag für User ${ticket.userId}`);
            ticketDB.delete(ticket.userId);
        }
    }
};