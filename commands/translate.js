import axios from 'axios'

export default {
  name: 'translate',
  description: 'Traduire un texte',
  category: 'IA',
  execute: async (sock, message, args) => {
    const remoteJid = message.key.remoteJid
    
    if (args.length < 2) {
      await sock.sendMessage(remoteJid, { text: '❌ Usage incorrect.\nUtilisation : .translate [langue] [texte]\nExemple : .translate en Bonjour' })
      return
    }

    const targetLang = args[0].toLowerCase()
    const text = args.slice(1).join(' ')
    
    await sock.sendMessage(remoteJid, { text: '🌐 Traduction en cours...' })

    try {
      // Utiliser MyMemory API (gratuit)
      const response = await axios.get(`https://api.mymemory.translated.net/get`, {
        params: {
          q: text,
          langpair: `auto|${targetLang}`
        }
      })

      const translation = response.data.responseData.translatedText
      
      await sock.sendMessage(remoteJid, {
        text: `╔══════════════════╗
🌐 *TRADUCTION*
╠══════════════════╣

📝 Original :
${text}

🔄 Traduit (${targetLang}) :
${translation}

╚══════════════════╝`
      })
      
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Erreur : ${error.message}` })
    }
  }
}
