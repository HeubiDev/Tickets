async function saveTranscript(channel, client) {
  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    let transcript = `Transcript for #${channel.name} (ID: ${channel.id})\n`;
    transcript += `Generated at: ${new Date().toISOString()}\n\n`;

    for (const message of sorted.values()) {
      const time = new Date(message.createdTimestamp).toISOString();
      const author = message.author.tag;
      const content = message.content || '[embed/attachment]';
      transcript += `[${time}] ${author}: ${content}\n`;
    }

    const buffer = Buffer.from(transcript, 'utf-8');
    const transcriptChannelId = process.env.TRANSCRIPT_CHANNEL_ID;
    
    if (!transcriptChannelId) {
      console.warn('No transcript channel ID configured');
      return;
    }

    const transcriptChannel = await client.channels.fetch(transcriptChannelId);

    if (transcriptChannel && transcriptChannel.isTextBased()) {
      await transcriptChannel.send({
        content: `📋 Ticket transcript for **${channel.name}**`,
        files: [{ attachment: buffer, name: `${channel.name}-transcript.txt` }],
      });
    }
  } catch (error) {
    console.error('Error saving transcript:', error);
  }
}

module.exports = {
  saveTranscript
};