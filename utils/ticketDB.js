const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'tickets.json');

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
            lastMessage: null
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
    
    claimTicket(channelId, claimerId) {
        const db = loadDB();
        if (db[channelId]) {
            db[channelId].claimedBy = claimerId;
            saveDB(db);
            return true;
        }
        return false;
    },
    
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
    }
};