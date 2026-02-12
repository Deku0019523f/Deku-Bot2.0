export default {
    name: 'uptime',
    description: 'Affiche depuis combien de temps le bot tourne',
    category: 'Utilitaires',
    execute: async (sock, message, args) => {
        const seconds = process.uptime()
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = Math.floor(seconds % 60)

        const uptimeText = `⏱️ Uptime : ${hours}h ${minutes}m ${secs}s`
        await sock.sendMessage(message.key.remoteJid, { text: uptimeText })
    }
}