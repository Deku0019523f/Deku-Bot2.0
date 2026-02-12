import fs from 'fs'
import path from 'path'

const muteFilePath = path.resolve('./database/muted.json')

if (!fs.existsSync(muteFilePath)) {
  fs.writeFileSync(muteFilePath, JSON.stringify({ muted: {} }, null, 2))
}

function loadMuted() {
  const data = fs.readFileSync(muteFilePath, 'utf8')
  return JSON.parse(data)
}

function saveMuted(data) {
  fs.writeFileSync(muteFilePath, JSON.stringify(data, null, 2))
}

export default {
  name: 'mute',
  description: 'Empêcher un utilisateur d\'utiliser le bot temporairement',
  category: 'Modération',
  execute: async (sock, message, args) => {
    const remoteJid = message.key.remoteJid
    
    if (!remoteJid.endsWith('@g.us')) {
      await sock.sendMessage(remoteJid, { text: '❌ Cette commande est réservée aux groupes.' })
      return
    }

    try {
      const groupMetadata = await sock.groupMetadata(remoteJid)
      const participants = groupMetadata.participants
      const sender = message.key.participant || message.key.remoteJid
      const senderIsAdmin = participants.find(p => p.id === sender)?.admin
      
      if (!senderIsAdmin) {
        await sock.sendMessage(remoteJid, { text: '❌ Seuls les admins peuvent utiliser cette commande.' })
        return
      }

      const mentionedJid = message.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      
      if (!mentionedJid) {
        await sock.sendMessage(remoteJid, { text: '❌ Veuillez mentionner un utilisateur.\nUtilisation : .mute @utilisateur [durée_minutes]' })
        return
      }

      const duration = parseInt(args[0]) || 30 // 30 minutes par défaut
      const mutedData = loadMuted()
      
      mutedData.muted[mentionedJid] = {
        until: Date.now() + (duration * 60 * 1000),
        group: remoteJid,
        by: sender
      }
      
      saveMuted(mutedData)
      
      await sock.sendMessage(remoteJid, {
        text: `🔇 @${mentionedJid.split('@')[0]} a été mis en sourdine pour ${duration} minutes.`,
        mentions: [mentionedJid]
      })
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Erreur : ${error.message}` })
    }
  }
}
