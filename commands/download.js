import axios from 'axios'

export default {
  name: 'download',
  description: 'Télécharger une vidéo/audio depuis un lien',
  category: 'Utilitaires',
  execute: async (sock, message, args) => {
    const remoteJid = message.key.remoteJid
    
    if (!args[0]) {
      await sock.sendMessage(remoteJid, { text: '❌ Veuillez fournir un lien.\nUtilisation : .download [lien]' })
      return
    }

    const url = args[0]
    
    // Vérifier si c'est un lien valide
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      await sock.sendMessage(remoteJid, { text: '❌ Lien invalide. Utilisez un lien HTTP ou HTTPS.' })
      return
    }

    await sock.sendMessage(remoteJid, { text: '⏳ Téléchargement en cours...' })

    try {
      // Note: Pour YouTube, Instagram, etc., vous devrez utiliser des APIs spécifiques
      // Ceci est un exemple basique pour les fichiers directs
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        maxContentLength: 50 * 1024 * 1024, // 50MB max
        timeout: 60000
      })

      const contentType = response.headers['content-type']
      
      if (contentType.includes('video')) {
        await sock.sendMessage(remoteJid, {
          video: Buffer.from(response.data),
          caption: '✅ Vidéo téléchargée avec succès !'
        })
      } else if (contentType.includes('audio')) {
        await sock.sendMessage(remoteJid, {
          audio: Buffer.from(response.data),
          mimetype: 'audio/mp4'
        })
      } else if (contentType.includes('image')) {
        await sock.sendMessage(remoteJid, {
          image: Buffer.from(response.data),
          caption: '✅ Image téléchargée avec succès !'
        })
      } else {
        await sock.sendMessage(remoteJid, { text: '❌ Type de fichier non supporté.' })
      }
      
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Erreur lors du téléchargement : ${error.message}` })
    }
  }
}
