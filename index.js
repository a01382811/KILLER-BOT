const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const Pino = require('pino');
const config = require('./config');
const QRCode = require('qrcode-terminal');

let startTime = Date.now();

async function startBot() {
    console.log('\n🔪 KILLER-BOT - Démarrage... (Niger 🇳🇪)\n');
    
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: Pino({ level: 'silent' }),
        browser: ['KILLER-BOT', 'Chrome', '120.0.0.0']
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', (update) => {
        const { qr, connection } = update;
        
        if (qr) {
            console.log('📱 SCANNEZ CE QR CODE AVEC WHATSAPP :\n');
            QRCode.generate(qr, { small: true });
            console.log('\n');
        }
        
        if (connection === 'open') {
            console.log('\n✅ KILLER-BOT CONNECTÉ AVEC SUCCÈS !\n');
            console.log(`👑 Propriétaire: ${config.ownerName}`);
            console.log(`📱 Numéro: ${config.ownerNumber.split('@')[0]}`);
            console.log(`⚙️ Préfixe: ${config.prefix}\n`);
        }
        
        if (connection === 'close') {
            console.log('🔄 Connexion perdue, redémarrage...');
            startBot();
        }
    });
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const sender = msg.key.participant || msg.key.remoteJid;
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
