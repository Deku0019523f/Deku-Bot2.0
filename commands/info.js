export default {
  name: 'info',
  description: 'Afficher les informations d\'un utilisateur ou du groupe',
  category: 'Utilitaires',
  execute: async (sock, message, args) => {
    const remoteJid = message.key.remoteJid
    
    try {
      if (remoteJid.endsWith('@g.us')) {
        // Informations du groupe
        const groupMetadata = await sock.groupMetadata(remoteJid)
        
        const text = `╔══════════════════╗
📊 *INFO GROUPE*
╠══════════════════╣

• Nom : ${groupMetadata.subject}
• ID : ${groupMetadata.id}
• Créé le : ${new Date(groupMetadata.creation * 1000).toLocaleDateString('fr-FR')}
• Propriétaire : @${groupMetadata.owner.split('@')[0]}
• Participants : ${groupMetadata.participants.length}
• Admins : ${groupMetadata.participants.filter(p => p.admin).length}
• Description : 
${groupMetadata.desc || 'Aucune description'}

╚══════════════════╝`

        await sock.sendMessage(remoteJid, {
          text: text,
          mentions: [groupMetadata.owner]
        })
      } else {
        // Informations de l'utilisateur
        const mentionedJid = message.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || remoteJid
        
        const text = `╔══════════════════╗
👤 *INFO UTILISATEUR*
╠══════════════════╣

• Numéro : @${mentionedJid.split('@')[0]}
• JID : ${mentionedJid}
• Nom : ${message.pushName || 'Non disponible'}

╚══════════════════╝`

        await sock.sendMessage(remoteJid, {
          text: text,
          mentions: [mentionedJid]
        })
      }
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Erreur : ${error.message}` })
    }
  }
}
