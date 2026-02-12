import fs from 'fs'
import path from 'path'

const banFilePath = path.resolve('./database/banned.json')

// Créer le fichier s'il n'existe pas
if (!fs.existsSync(banFilePath)) {
  fs.writeFileSync(banFilePath, JSON.stringify({ banned: {} }, null, 2))
}

function loadBanned() {
  const data = fs.readFileSync(banFilePath, 'utf8')
  return JSON.parse(data)
}

function saveBanned(data) {
  fs.writeFileSync(banFilePath, JSON.stringify(data, null, 2))
}

export default {
  name: 'ban',
  description: 'Bannir un utilisateur du bot',
  category: 'Modération',
  execute: async (sock, message, args) => {
    const remoteJid = message.key.remoteJid
    const sender = message.key.participant || message.key.remoteJid
    
    // Vérifier si c'est le propriétaire (à configurer)
    const isOwner = sender.startsWith('YOUR_NUMBER') // Remplacer par votre numéro
    
    if (!isOwner) {
      await sock.sendMessage(remoteJid, { text: '❌ Seul le propriétaire peut utiliser cette commande.' })
      return
    }

    const mentionedJid = message.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    
    if (!mentionedJid) {
      await sock.sendMessage(remoteJid, { text: '❌ Veuillez mentionner un utilisateur.\nUtilisation : .ban @utilisateur [raison]' })
      return
    }

    const reason = args.join(' ') || 'Aucune raison spécifiée'
    const bannedData = loadBanned()
    
    bannedData.banned[mentionedJid] = {
      reason: reason,
      date: new Date().toISOString(),
      by: sender
    }
    
    saveBanned(bannedData)
    
    await sock.sendMessage(remoteJid, {
      text: `🚫 @${mentionedJid.split('@')[0]} a été banni du bot.\nRaison : ${reason}`,
      mentions: [mentionedJid]
    })
  }
}
