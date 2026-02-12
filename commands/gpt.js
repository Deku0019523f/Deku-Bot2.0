import axios from 'axios'

export default {
  name: 'gpt',
  description: 'Discuter avec l\'IA Perplexity',
  category: 'IA',
  execute: async (sock, message, args) => {
    const remoteJid = message.key.remoteJid
    
    if (!args.length) {
      await sock.sendMessage(remoteJid, { text: '❌ Veuillez poser une question.\nUtilisation : .gpt [votre question]' })
      return
    }

    const question = args.join(' ')
    
    await sock.sendMessage(remoteJid, { text: '🤖 Réflexion en cours...' })

    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant IA utile et concis qui répond en français.'
            },
            {
              role: 'user',
              content: question
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer VOTRE_CLE_API_PERPLEXITY`, // Remplacer par votre clé API
            'Content-Type': 'application/json'
          }
        }
      )

      const answer = response.data.choices[0].message.content
      
      await sock.sendMessage(remoteJid, {
        text: `╔══════════════════╗
🤖 *PERPLEXITY AI*
╠══════════════════╣

${answer}

╚══════════════════╝`
      })
      
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Erreur API : ${error.message}` })
    }
  }
}
