import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import pino from 'pino'
import fs from 'fs'
import config from './config.js'
import configmanager from './utils/configmanager.js'
import { loadCommands } from './utils/commandLoader.js'
import messageHandler from './handlers/messageHandler.js'
import { handleNewMember } from './commands/welcome.js'

const data = './database/sessionData'

async function connect() {
    await loadCommands()

    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(data)

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        keepAliveIntervalMs: 10000
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async update => {
        const { connection, lastDisconnect } = update

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            const reason = lastDisconnect?.error?.toString() || 'unknown'
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut && reason !== 'unknown'
            if (shouldReconnect) {
                console.log('🔄 Reconnecting in 5s...')
                setTimeout(connect, 5000)
            } else {
                console.log('🚫 Logged out. Re-pair manually.')
            }
        } else if (connection === 'open') {
            console.log('✅ WhatsApp connected')

            try {
                await sock.newsletterFollow('l\\'id de ta chaîne@newsletter')
                await sock.newsletterFollow('l\\' id de ta chaîne@newsletter')
            } catch {}

            const ownerJid = config.ownerNumber + '@s.whatsapp.net'
            const text = `
╔══════════════════╗
    𓆩 𝐃ARKDEKU225 𓆪
╠══════════════════╣
▣ DEKU225 X connecté
▣ Modules chargés
▣ Réseau stable

> "Dans le monde numérique, créer c'est exister."
╚══════════════════╝
            `
            const imagePath = './database/connect.jpg'
            if (fs.existsSync(imagePath)) {
                await sock.sendMessage(ownerJid, {
                    image: { url: imagePath },
                    caption: text
                })
            } else {
                await sock.sendMessage(ownerJid, { text })
            }

            // Gestion des messages
            sock.ev.on('messages.upsert', async msg => {
                if (!msg.messages || !msg.messages[0]) return
                if (msg.type !== 'notify' && msg.type !== 'append') return

                await messageHandler(sock, msg)
            })

            // Gestion des nouveaux membres dans les groupes (welcome)
            sock.ev.on('group-participants.update', async update => {
                try {
                    if (update.action === 'add') {
                        await handleNewMember(sock, update)
                    }
                } catch (error) {
                    console.error('Erreur group-participants.update:', error.message)
                }
            })
        }
    })

    setTimeout(async () => {
        if (!state.creds.registered) {
            const number = config.ownerNumber

            configmanager.config.users[number] = {
                sudoList: [number + '@s.whatsapp.net'],
                prefix: config.prefix,
                publicMode: false
            }

            configmanager.save()

            try {
                const code = await sock.requestPairingCode(number, config.pairingName)
                console.log('📲 Pairing code:', code)
            } catch (e) {
                console.error('❌ Error requesting pairing code:', e)
            }
        }
    }, 5000)
}

connect()
