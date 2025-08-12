const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');

// Função para carregar usuários do arquivo JSON
function loadUserTimestamps() {
    const filePath = path.join(__dirname, 'user_timestamps.json');
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Erro ao carregar timestamps:', error);
    }
    return {};
}

// Função para salvar usuários no arquivo JSON
function saveUserTimestamps(timestamps) {
    const filePath = path.join(__dirname, 'user_timestamps.json');
    try {
        fs.writeFileSync(filePath, JSON.stringify(timestamps, null, 2));
    } catch (error) {
        console.error('Erro ao salvar timestamps:', error);
    }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    // Carregar timestamps do arquivo ao iniciar
    const respondedUsersTimestamps = loadUserTimestamps();
    console.log(`Carregados ${Object.keys(respondedUsersTimestamps).length} usuários do arquivo`);

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
                const userJid = msg.key.participant || msg.key.remoteJid;
                const now = Date.now();
                const lastResponse = respondedUsersTimestamps[userJid];
                const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
                
                if (!lastResponse || (now - lastResponse) >= threeDaysMs) {
                    await sock.sendMessage(msg.key.remoteJid, { text: 'Olá, tudo bem? \nPara eu lhe informar valores da casa, me diga:\n\n- Qual data de entrada?\n\n- Qual data de saída?\n\n- Quantas pessoas?' });
                    
                    await sock.chatModify(
                        { markRead: false, lastMessages: [msg] },
                        msg.key.remoteJid
                    );
                    
                    // Atualizar timestamp e salvar no arquivo
                    respondedUsersTimestamps[userJid] = now;
                    saveUserTimestamps(respondedUsersTimestamps);
                }
            }
        }
    });
}

startBot();