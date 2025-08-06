const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    // Substituir o Set respondedUsers por um objeto para armazenar timestamps
    const respondedUsersTimestamps = {};

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
                const now = Date.now();
                const lastResponse = respondedUsersTimestamps[userJid];
                const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
                if (!lastResponse || (now - lastResponse) >= threeDaysMs) {
                    await sock.sendMessage(msg.key.remoteJid, { text: 'Olá, tudo bem? \nPara eu lhe informar valores da casa, me diga:\n\n- Qual data de entrada?\n\n- Qual data de saída?\n\n- Quantas pessoas?' });
                    // Marcar conversa como não lida após responder
                    await sock.chatModify(
                        { markRead: false, lastMessages: [msg] },
                        msg.key.remoteJid
                    );
                    respondedUsersTimestamps[userJid] = now;
                }
            }
        }
    });
}

startBot();