import fs from 'fs'
import path from 'path'
import os from 'os'

const commandsPath = path.resolve('./commands')

function formatDate() {
    const now = new Date()
    const day = now.toLocaleDateString('fr-FR', { weekday: 'long' })
    const date = now.toLocaleDateString('fr-FR')
    return { date, day }
}

function formatUptime() {
    const seconds = process.uptime()
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours}h ${minutes}m ${secs}s`
}

function stylizedChar(text) {
    return text.split('').join(' ')
}

export default {
    name: 'menu',
    description: 'Affiche toutes les commandes disponibles',
    category: 'Info',
    execute: async (sock, message) => {
        const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))
        const categories = {}

        for (const file of files) {
            const { default: cmd } = await import(`file://${path.join(commandsPath, file)}`)
            const cat = cmd.category || 'Autres'
            if (!categories[cat]) categories[cat] = []
            categories[cat].push(cmd.name)
        }

        const { date, day } = formatDate()
        const uptime = formatUptime()
        const usedRam = Math.floor((process.memoryUsage().rss / 1024 / 1024))
        const totalRam = Math.floor(os.totalmem() / 1024 / 1024)
        const platform = os.platform()
        const userName = message.pushName || 'Utilisateur'
        const prefix = '.'

        let text = `
╔══════════════════╗
     DigiX Crew 🎯
╠══════════════════╣
• Prefix   : ${prefix}
• User     : ${stylizedChar(userName)}
• Version  : 1.0.0
• Uptime   : ${uptime}
• RAM      : ${usedRam}/${totalRam} MB
• Platform : ${platform}
• Date     : ${date} - ${stylizedChar(day)}
╚══════════════════╝
`

        for (const [cat, cmds] of Object.entries(categories)) {
            text += `┏━━━ ${stylizedChar(cat.toUpperCase())} ━━━\n`
            cmds.forEach(c => {
                text += `┃   › ${stylizedChar(c)}\n`
            })
            text += `┗━━━━━━━━━━━━━━━\n\n`
        }

        text += '╰─ DigiX Bot ⚡'

        await sock.sendMessage(
            message.key.remoteJid,
            {
                image: { url: 'https://files.catbox.moe/eg0fq1.jpg' },
                caption: text
            }
        )
    }
}