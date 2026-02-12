import axios from 'axios'

export default {
  name: 'image',
  description: 'Générer une image avec l\'IA',
  category: 'IA',
  execute: async (sock, message, args) => {
    const remoteJid = message.key.remoteJid
    
    if (!args.length) {
      await sock.sendMessage(remoteJid, { text: '❌ Veuillez décrire l\'image.\nUtilisation : .image [description]' })
      return
    }

    const prompt = args.join(' ')
    
    await sock.sendMessage(remoteJid, { text: '🎨 Génération de l\'image...' })

    try {
      // Utiliser une API de génération d'images (exemple avec Pollinations.ai - gratuit)
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      })

      await sock.sendMessage(remoteJid, {
        image: Buffer.from(response.data),
        caption: `✅ Image générée !\n\n📝 Prompt : ${prompt}`
      })
      
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Erreur : ${error.message}` })
    }
  }
}
