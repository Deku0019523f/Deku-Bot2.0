export default {
  name: 'kick',
  description: 'Expulser un membre du groupe',
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
        await sock.sendMessage(remoteJid, { text: '❌ Veuillez mentionner un utilisateur.\nUtilisation : .kick @utilisateur' })
        return
      }

      const targetIsAdmin = participants.find(p => p.id === mentionedJid)?.admin
      
      if (targetIsAdmin) {
        await sock.sendMessage(remoteJid, { text: '⚠️ Impossible d\'expulser un administrateur.' })
        return
      }

      await sock.groupParticipantsUpdate(remoteJid, [mentionedJid], 'remove')
      
      await sock.sendMessage(remoteJid, {
        text: `👋 @${mentionedJid.split('@')[0]} a été expulsé du groupe.`,
        mentions: [mentionedJid]
      })
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Erreur : ${error.message}` })
    }
  }
}
