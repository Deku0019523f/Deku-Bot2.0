export default {
    name: 'ping',
    description: 'Calcule le temps de réponse du bot',
    category: 'Fun',
    execute: async (sock, message, args) => {
        const start = Date.now()
        await sock.sendMessage(message.key.remoteJid, { text: '🏓 Pong...' })
        const end = Date.now()
        const ping = end - start
        await sock.sendMessage(message.key.remoteJid, { text: `🏓 Pong !\n⏱️ Temps de réponse : ${ping} ms` })
    }
}