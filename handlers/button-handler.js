const { handleTicketButton, handleCloseTicket } = require('./ticket-handler');

function registerButtonHandlers(client) {
  client.buttonHandlers.set('open-ticket', handleTicketButton);
  client.buttonHandlers.set('close-ticket', handleCloseTicket);
}

module.exports = {
  registerButtonHandlers
};