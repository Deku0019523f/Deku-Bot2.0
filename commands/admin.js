export default {
  name: 'admin',
  description: 'Promouvoir un membre en tant qu\'administrateur',
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

      // Récupérer l'utilisateur mentionné
      const mentionedJid = message.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      
      if (!mentionedJid) {
        await sock.sendMessage(remoteJid, { text: '❌ Veuillez mentionner un utilisateur.\nUtilisation : .admin @utilisateur' })
        return
      }

      const targetIsAdmin = participants.find(p => p.id === mentionedJid)?.admin
      
      if (targetIsAdmin) {
        await sock.sendMessage(remoteJid, { text: '⚠️ Cet utilisateur est déjà administrateur.' })
        return
      }

      await sock.groupParticipantsUpdate(remoteJid, [mentionedJid], 'promote')
      
      await sock.sendMessage(remoteJid, {
        text: `✅ @${mentionedJid.split('@')[0]} a été promu administrateur !`,
        mentions: [mentionedJid]
      })
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Erreur : ${error.message}` })
    }
  }
}
