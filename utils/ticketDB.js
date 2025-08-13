const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'tickets.json');

// Hilfsfunktionen
function loadDB() {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
    // Bestehende Methoden
    get(userId) {
        const db = loadDB();
        return Object.values(db).find(t => t.userId === userId) || null;
    },
    
    set(userId, channelId, channelName, username) {
        const db = loadDB();
        db[channelId] = {
            userId,
            channelId,
            channelName,
            username,
            createdAt: new Date().toISOString(),
            claimedBy: null,
            claimedAt: null,
            priority: null, // Neu: Prioritätsfeld
            lastMessage: null,
            status: 'open' // Neu: Status-Tracking
        };
        saveDB(db);
    },
    
    delete(userId) {
        const db = loadDB();
        const entry = Object.entries(db).find(([_, data]) => data.userId === userId);
        if (entry) {
            delete db[entry[0]];
            saveDB(db);
        }
    },
    
    getByChannelId(channelId) {
        const db = loadDB();
        return db[channelId] || null;
    },
    
    all() {
        const db = loadDB();
        return Object.values(db);
    },
    
    // Claim-Methoden
    claimTicket(channelId, claimerId) {
        const db = loadDB();
        if (db[channelId]) {
            db[channelId].claimedBy = claimerId;
            db[channelId].claimedAt = new Date().toISOString();
            db[channelId].status = 'claimed';
            saveDB(db);
            return true;
        }
        return false;
    },
    
    unclaimTicket(channelId) {
        const db = loadDB();
        if (db[channelId]) {
            db[channelId].claimedBy = null;
            db[channelId].claimedAt = null;
            db[channelId].status = 'open';
            saveDB(db);
            return true;
        }
        return false;
    },
    
    // Neue Priority-Methoden
    setPriority(channelId, priority) {
        const db = loadDB();
        if (db[channelId]) {
            db[channelId].priority = priority;
            db[channelId].status = 'in_progress';
            saveDB(db);
            return true;
        }
        return false;
    },
    
    getByPriority(priority) {
        const db = loadDB();
        return Object.values(db).filter(t => t.priority === priority);
    },
    
    // Nachrichten-Handling
    updateLastMessage(channelId, messageData) {
        const db = loadDB();
        if (db[channelId]) {
            db[channelId].lastMessage = {
                authorId: messageData.authorId,
                content: messageData.content,
                timestamp: new Date().toISOString()
            };
            saveDB(db);
        }
    },
    
    // Statistik-Methoden
    getStats() {
        const db = loadDB();
        const tickets = Object.values(db);
        return {
            total: tickets.length,
            open: tickets.filter(t => t.status === 'open').length,
            claimed: tickets.filter(t => t.status === 'claimed').length,
            inProgress: tickets.filter(t => t.status === 'in_progress').length,
            byPriority: {
                high: tickets.filter(t => t.priority === 'high').length,
                medium: tickets.filter(t => t.priority === 'medium').length,
                low: tickets.filter(t => t.priority === 'low').length
            }
        };
    },
    
    // Suchfunktionen
    findByClaimer(claimerId) {
        const db = loadDB();
        return Object.values(db).filter(t => t.claimedBy === claimerId);
    },
    
    searchByUsername(query) {
        const db = loadDB();
        return Object.values(db).filter(t => 
            t.username.toLowerCase().includes(query.toLowerCase())
        );
    }
};

// Beispielaufrufe wie gewünscht
// Priorität setzen
module.exports.setPriority('123456789', 'high');

// Statistik abfragen
const stats = module.exports.getStats();
console.log(`Aktive Tickets: ${stats.inProgress}/${stats.total}`);

// Alle High-Prio Tickets
const urgentTickets = module.exports.getByPriority('high');