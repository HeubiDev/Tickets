const Database = require('better-sqlite3');

const path = require('path');
const db = new Database(path.join(__dirname, 'tickets.db'));

function setupDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_counters (
      guild_id TEXT PRIMARY KEY,
      last_ticket_number INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (guild_id) REFERENCES ticket_counters (guild_id)
    );
  `);
}

function getNextTicketNumber(guildId) {
  const row = db
    .prepare("SELECT last_ticket_number FROM ticket_counters WHERE guild_id = ?")
    .get(guildId);
  
  if (!row) {
    db.prepare("INSERT INTO ticket_counters (guild_id, last_ticket_number) VALUES (?, 1)")
      .run(guildId);
    return 1;
  } else {
    const nextNum = row.last_ticket_number + 1;
    db.prepare("UPDATE ticket_counters SET last_ticket_number = ? WHERE guild_id = ?")
      .run(nextNum, guildId);
    return nextNum;
  }
}

function addTicket(guildId, channelId, userId) {
  const now = Date.now();
  db.prepare("INSERT INTO tickets (guild_id, channel_id, user_id, created_at) VALUES (?, ?, ?, ?)")
    .run(guildId, channelId, userId, now);
}

function removeTicket(channelId) {
  db.prepare("DELETE FROM tickets WHERE channel_id = ?").run(channelId);
}

function getTicketByChannel(channelId) {
  return db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(channelId);
}

function getTicketByUser(guildId, userId) {
  return db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND user_id = ?").get(guildId, userId);
}

module.exports = {
  setupDatabase,
  getNextTicketNumber,
  addTicket,
  removeTicket,
  getTicketByChannel,
  getTicketByUser
};