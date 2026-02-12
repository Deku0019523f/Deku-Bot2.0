import fs from 'fs'
import path from 'path'

const warnFilePath = path.resolve('./database/warnings.json')

if (!fs.existsSync(warnFilePath)) {
  fs.writeFileSync(warnFilePath, JSON.stringify({ warnings: {} }, null, 2))
}

function loadWarnings() {
  const data = fs.readFileSync(warnFilePath, 'utf8')
  return JSON.parse(data)
}

function saveWarnings(data) {
  fs.writeFileSync(warnFilePath, JSON.stringify(data, null, 2))
}

export default {
  name: 'warn',
  description: 'Avertir un membre (3 avertissements = expulsion)',
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
        await sock.sendMessage(remoteJid, { text: '❌ Veuillez mentionner un utilisateur.\nUtilisation : .warn @utilisateur [raison]' })
        return
      }

      const reason = args.join(' ') || 'Aucune raison spécifiée'
      const warningsData = loadWarnings()
      
      if (!warningsData.warnings[remoteJid]) {
        warningsData.warnings[remoteJid] = {}
      }
      
      if (!warningsData.warnings[remoteJid][mentionedJid]) {
        warningsData.warnings[remoteJid][mentionedJid] = []
      }
      
      warningsData.warnings[remoteJid][mentionedJid].push({
        reason: reason,
        date: new Date().toISOString(),
        by: sender
      })
      
      const warnCount = warningsData.warnings[remoteJid][mentionedJid].length
      
      saveWarnings(warningsData)
      
      if (warnCount >= 3) {
        await sock.groupParticipantsUpdate(remoteJid, [mentionedJid], 'remove')
        await sock.sendMessage(remoteJid, {
          text: `⚠️ @${mentionedJid.split('@')[0]} a reçu 3 avertissements et a été expulsé !\nDernier avertissement : ${reason}`,
          mentions: [mentionedJid]
        })
        delete warningsData.warnings[remoteJid][mentionedJid]
        saveWarnings(warningsData)
      } else {
        await sock.sendMessage(remoteJid, {
          text: `⚠️ Avertissement ${warnCount}/3 pour @${mentionedJid.split('@')[0]}\nRaison : ${reason}`,
          mentions: [mentionedJid]
        })
      }
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Erreur : ${error.message}` })
    }
  }
}
