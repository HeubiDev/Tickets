const ticketDB = require('./ticketDB');

async function cleanupTickets(client) {
    console.log('🔍 Überprüfe gespeicherte Tickets...');
    const allTickets = ticketDB.all();

    for (const ticket of allTickets) {
        const channel = client.channels.cache.get(ticket.channelId);
        if (!channel) {
            console.log(`🗑 Entferne verwaisten Eintrag: ticket_${ticket.userId}`);
            ticketDB.delete(ticket.userId);
        }
    }

    console.log('✅ Ticket-Überprüfung abgeschlossen.');
}

module.exports = cleanupTickets;