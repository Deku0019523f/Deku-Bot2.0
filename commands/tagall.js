export default {
  name: 'tagall',
  description: 'Mentionne tous les membres du groupe',
  category: 'Modération',
  execute: async (sock, message, args) => {
    const remoteJid = message.key.remoteJid
    
    // Vérifier si c'est un groupe
    if (!remoteJid.endsWith('@g.us')) {
      await sock.sendMessage(remoteJid, { text: '❌ Cette commande est réservée aux groupes.' })
      return
    }

    try {
      // Récupérer les métadonnées du groupe
      const groupMetadata = await sock.groupMetadata(remoteJid)
      const participants = groupMetadata.participants
      
      // Vérifier si l'utilisateur est admin
      const sender = message.key.participant || message.key.remoteJid
      const senderIsAdmin = participants.find(p => p.id === sender)?.admin
      
      if (!senderIsAdmin) {
        await sock.sendMessage(remoteJid, { text: '❌ Seuls les admins peuvent utiliser cette commande.' })
        return
      }

      const messageText = args.join(' ') || 'Notification du groupe !'
      const mentions = participants.map(p => p.id)
      
      const text = `╔══════════════════╗
📢 *ANNONCE GROUPE*
╠══════════════════╣

${messageText}

╚══════════════════╝

${participants.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`).join('\n')}`

      await sock.sendMessage(remoteJid, {
        text: text,
        mentions: mentions
      })
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Erreur : ${error.message}` })
    }
  }
}
