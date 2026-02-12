import commands from '../utils/commandLoader.js'
import config from '../config.js'
import configmanager from '../utils/configmanager.js'

export default async function messageHandler(sock, msg) {
    const message = msg.messages?.[0]
    if (!message?.message || !message.key?.remoteJid) return

    const text =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        message.message.imageMessage?.caption ||
        message.message.videoMessage?.caption ||
        ''

    if (!text.startsWith(config.prefix)) return

    const [name, ...args] = text.slice(config.prefix.length).trim().split(/\s+/)
    const command = commands.get(name)
    if (!command) return

    const sender = message.key.remoteJid.replace('@s.whatsapp.net', '')

    if (command.premium) {
        const isPremium = configmanager.premiums.premiumUser[sender]
        if (!isPremium) {
            await sock.sendMessage(message.key.remoteJid, {
                text: '❌ Cette commande est réservée aux utilisateurs premium.'
            })
            return
        }
    }

    try {
        await sock.sendMessage(message.key.remoteJid, {
            react: {
                text: '🎯',
                key: message.key
            }
        })
    } catch {}

    await command.execute(sock, message, args)
}