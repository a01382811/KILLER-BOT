const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const Pino = require('pino');
const config = require('./config');

let startTime = Date.now();

async function startBot() {
    console.log('\n🔪 KILLER-BOT - Démarrage... (Niger 🇳🇪)\n');
    
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: Pino({ level: 'silent' }),
        browser: ['KILLER-BOT', 'Chrome', '120.0.0.0']
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', (update) => {
        if (update.qr) {
            console.log('📱 Scannez ce QR code avec WhatsApp');
        }
        if (update.connection === 'open') {
            console.log('✅ KILLER-BOT CONNECTÉ !');
        }
        if (update.connection === 'close') {
            console.log('🔄 Reconnexion...');
            startBot();
        }
    });
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        if (!text.startsWith(config.prefix)) return;
        
        const command = text.slice(config.prefix.length).trim().toLowerCase();
        
        if (command === 'alive') {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🔪 KILLER-BOT est en ligne ! (Niger 🇳🇪)' 
            });
        }
        else if (command === 'ping') {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🏓 Pong!' 
            });
        }
        else if (command === 'menu') {
            const menu = `╔══════════════════════════╗
║    🔪 KILLER-BOT 🔪    ║
║   MADE BY KILLER       ║
║   NIGER 🇳🇪            ║
╠══════════════════════════╣
║ 📁 COMMANDES            ║
║   .alive - État        ║
║   .ping - Latence      ║
║   .menu - Ce menu      ║
╚══════════════════════════╝`;
            await sock.sendMessage(msg.key.remoteJid, { text: menu });
        }
    });
}

startBot();
