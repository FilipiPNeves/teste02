const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    // Set para guardar os usuários já respondidos
    const respondedUsers = new Set();

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('QR code:', qr);
        }
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = new Boom(lastDisconnect?.error))?.output?.statusCode !== DisconnectReason.loggedOut;
            if(shouldReconnect) {
                startBot();
            }
        } else if(connection === 'open') {
            console.log('Bot conectado!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if(type === 'notify') {
            const msg = messages[0];
            if(!msg.key.fromMe && msg.message) {
                // Para grupos, use participant; para privado, use remoteJid
                const userJid = msg.key.participant || msg.key.remoteJid;
                if (!respondedUsers.has(userJid)) {
                    await sock.sendMessage(msg.key.remoteJid, { text: 'Olá, tudo bem? \nPara eu lhe informar valores, me diga:\n\n- Qual data de entrada?\n\n- Qual data de saída?\n\n- Quantas pessoas?' });
                    respondedUsers.add(userJid);
                }
            }
        }
    });
}

startBot();