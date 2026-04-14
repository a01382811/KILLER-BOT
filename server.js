const express = require('express');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const Pino = require('pino');
const config = require('./config');

const app = express();
const port = process.env.PORT || 3000;

let qrCode = null;
let isConnected = false;

app.get('/', (req, res) => {
    if (isConnected) {
        res.send(`
            <html>
                <head><title>KILLER-BOT</title></head>
                <body style="text-align:center;font-family:Arial;padding:50px;">
                    <h1>🔪 KILLER-BOT</h1>
                    <p>✅ Bot déjà connecté !</p>
                    <p>👑 Propriétaire: ${config.ownerName}</p>
                    <p>📱 WhatsApp: ${config.ownerNumber.split('@')[0]}</p>
                </body>
            </html>
        `);
    } else if (qrCode) {
        res.send(`
            <html>
                <head><title>KILLER-BOT - QR Code</title></head>
                <body style="text-align:center;font-family:Arial;padding:50px;">
                    <h1>🔪 KILLER-BOT</h1>
                    <p>📱 Scannez ce QR code avec WhatsApp :</p>
                    <img src="${qrCode}" style="max-width:300px;"/>
                    <p>📌 Paramètres WhatsApp > Appareils liés > Lier un appareil</p>
                </body>
            </html>
        `);
    } else {
        res.send(`
            <html>
                <head><title>KILLER-BOT</title></head>
                <body style="text-align:center;font-family:Arial;padding:50px;">
                    <h1>🔪 KILLER-BOT</h1>
                    <p>⏳ Génération du QR code en cours...</p>
                    <p>🔄 Rafraîchissez dans quelques secondes</p>
                </body>
            </html>
        `);
    }
});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: Pino({ level: 'silent' }),
        browser: ['KILLER-BOT', 'Chrome', '120.0.0.0']
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', (update) => {
        const { qr, connection } = update;
        
        if (qr) {
            const QRCode = require('qrcode');
            QRCode.toDataURL(qr, (err, url) => {
                if (!err) qrCode = url;
            });
            console.log('📱 Nouveau QR code généré');
        }
        
        if (connection === 'open') {
            isConnected = true;
            console.log('✅ KILLER-BOT CONNECTÉ !');
        }
    });
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        if (!text.startsWith(config.prefix)) return;
        
        const command = text.slice(config.prefix.length).trim().toLowerCase();
        
        if (command === 'alive') {
            await sock.sendMessage(msg.key.remoteJid, { text: '🔪 KILLER-BOT en ligne !' });
        }
        else if (command === 'ping') {
            await sock.sendMessage(msg.key.remoteJid, { text: '🏓 Pong!' });
        }
        else if (command === 'menu') {
            const menu = `🔪 KILLER-BOT 🔪
━━━━━━━━━━━━━━━━━━━━━━
.alive - État du bot
.ping - Latence
.menu - Ce menu
━━━━━━━━━━━━━━━━━━━━━━
Niger 🇳🇪 | KILLER`;
            await sock.sendMessage(msg.key.remoteJid, { text: menu });
        }
    });
}

app.listen(port, () => {
    console.log(`🌐 Interface QR code: http://localhost:${port}`);
    startBot();
});
