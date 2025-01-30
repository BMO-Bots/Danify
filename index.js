const express = require('express');
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = process.env.WEBHOOK;
const BOT_TOKEN = process.env.TOKEN;

// Funzione per inviare i log al webhook
function sendLogToWebhook(message) {
    if (!WEBHOOK_URL) {
        console.error('Webhook URL not set in .env');
        return;
    }
    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message })
    }).catch(err => console.error('Failed to send log to webhook:', err));
}

// Web server per Uptime Robot
app.get('/', (req, res) => {
    res.send('<h1>Vivo</h1>');  // Mostra la scritta "Vivo"
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Bot code (resta invariato)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
    ],
});

client.once('ready', async () => {
    console.log('Bot is online!');
    sendLogToWebhook('Daniel Online');
    updateBotStatus();
});

async function updateBotStatus() {
    try {
        const guild = client.guilds.cache.first();
        await guild.members.fetch();
        const memberCount = guild.memberCount;
        client.user.setPresence({
            activities: [{
                name: `${memberCount} Daniels | jes.is-a.dev`,
                type: 1,
                url: 'https://www.twitch.tv/tashawty',
            }],
            status: 'online',
        });
        console.log(`Updated bot status to: ${memberCount} members`);
    } catch (error) {
        console.error('Error updating bot status:', error);
        sendLogToWebhook(`Error updating: ${error.message}`);
    }
}

client.on('guildMemberAdd', async member => {
    console.log(`Member joined: ${member.user.tag}`);
    updateBotStatus();
});

client.on('guildMemberRemove', async member => {
    console.log(`Member left: ${member.user.tag}`);
    updateBotStatus();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const { commandName, options } = interaction;

    if (commandName === 'danify') {
        await interaction.deferReply();

        const attachment = options.getAttachment('image');
        let emoji = options.getString('emoji');
        let style = options.getString('style') || 'apple';

        if (!attachment || !attachment.contentType.startsWith('image')) {
            return interaction.editReply('Please upload a valid image file.');
        }

        if (emoji) {
            emoji = emoji.split(' ')[0];
        }

        try {
            const image = await loadImage(attachment.url);
            const barHeight = Math.floor(image.height * 0.13);
            const canvas = createCanvas(image.width, image.height + barHeight);
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, barHeight);
            ctx.drawImage(image, 0, barHeight);

            ctx.fillStyle = '#000000';
            ctx.font = 'bold 80px Arial';
            let text = 'daniel';
            let textWidth = ctx.measureText(text).width;
            let textX;
            let emojiPadding = 10;
            let emojiSize = 80;
            let textY = barHeight / 2 + 30;

            if (emoji) {
                let emojiUrl = `https://emojicdn.elk.sh/${encodeURIComponent(emoji)}`;
                if (style === 'ios') {
                    emojiUrl += '?style=apple';
                } else if (style === 'android') {
                    emojiUrl += '?style=google';
                }

                const emojiImage = await loadImage(emojiUrl);
                const totalWidth = textWidth + emojiSize + emojiPadding;
                textX = (canvas.width - totalWidth) / 2;

                const emojiX = textX + textWidth + emojiPadding;
                const emojiY = textY - 60;

                ctx.drawImage(emojiImage, emojiX, emojiY, emojiSize, emojiSize);
            } else {
                textX = (canvas.width - textWidth) / 2;
            }

            ctx.fillText(text, textX, textY);

            const buffer = canvas.toBuffer('image/png');
            const resultAttachment = new AttachmentBuilder(buffer, { name: 'danified.png' });
            await interaction.editReply({ files: [resultAttachment] });
        } catch (error) {
            console.error(error);
            sendLogToWebhook(`Error using danify: ${error.message}`);
            await interaction.editReply('You probably used more than one emoji, just don\'t do that.');
        }
    }
});

client.login(BOT_TOKEN);
