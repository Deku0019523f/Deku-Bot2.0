import os from 'os'
import fs from 'fs'
import path from 'path'

export default {
  name: 'stats',
  description: 'Afficher les statistiques du bot',
  category: 'Utilitaires',
  execute: async (sock, message, args) => {
    const remoteJid = message.key.remoteJid
    
    try {
      const commandsPath = path.resolve('./commands')
      const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))
      
      const uptime = process.uptime()
      const hours = Math.floor(uptime / 3600)
      const minutes = Math.floor((uptime % 3600) / 60)
      const seconds = Math.floor(uptime % 60)
      
      const usedMemory = Math.floor(process.memoryUsage().rss / 1024 / 1024)
      const totalMemory = Math.floor(os.totalmem() / 1024 / 1024)
      const freeMemory = Math.floor(os.freemem() / 1024 / 1024)
      
      const cpuUsage = process.cpuUsage()
      const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2)
      
      const text = `╔══════════════════╗
📊 *STATISTIQUES BOT*
╠══════════════════╣

⏱️ *Uptime*
${hours}h ${minutes}m ${seconds}s

💾 *Mémoire*
• Utilisée : ${usedMemory} MB
• Totale : ${totalMemory} MB
• Libre : ${freeMemory} MB

⚙️ *Système*
• CPU : ${cpuPercent}s
• Plateforme : ${os.platform()}
• Architecture : ${os.arch()}
• Node.js : ${process.version}

📝 *Bot*
• Commandes : ${commandFiles.length}
• Préfixe : .
• Version : 1.0.0

╚══════════════════╝`

      await sock.sendMessage(remoteJid, { text: text })
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Erreur : ${error.message}` })
    }
  }
}
