import fs from 'fs'
import path from 'path'

const welcomeFilePath = path.resolve('./database/welcome.json')

// Créer le fichier s'il n'existe pas
if (!fs.existsSync(welcomeFilePath)) {
  fs.writeFileSync(welcomeFilePath, JSON.stringify({ groups: {} }, null, 2))
}

function loadWelcomeData() {
  const data = fs.readFileSync(welcomeFilePath, 'utf8')
  return JSON.parse(data)
}

function saveWelcomeData(data) {
  fs.writeFileSync(welcomeFilePath, JSON.stringify(data, null, 2))
}

export default {
  name: 'welcome',
  description: 'Activer/désactiver les messages de bienvenue',
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

      const welcomeData = loadWelcomeData()
      
      // Si pas d'arguments, afficher le statut
      if (!args[0]) {
        const status = welcomeData.groups[remoteJid]?.enabled ? 'activé ✅' : 'désactivé ❌'
        const currentMsg = welcomeData.groups[remoteJid]?.message || 'Message par défaut'
        
        await sock.sendMessage(remoteJid, {
          text: `╔══════════════════╗
🎉 *PARAMÈTRES BIENVENUE*
╠══════════════════╣

Statut : ${status}

Message actuel :
${currentMsg}

╚══════════════════╝

**Commandes disponibles:**
• .welcome on - Activer
• .welcome off - Désactiver
• .welcome set [message] - Personnaliser

**Variables disponibles:**
• @user - Mention du nouveau membre
• {name} - Nom du membre
• {group} - Nom du groupe
• {count} - Nombre de membres`
        })
        return
      }

      const action = args[0].toLowerCase()

      switch (action) {
        case 'on':
          if (!welcomeData.groups[remoteJid]) {
            welcomeData.groups[remoteJid] = {
              enabled: true,
              message: `Bienvenue @user ! 🎉\n\nNous sommes ravis de t'accueillir dans {group} !\n\nNous sommes maintenant {count} membres 🎊`
            }
          } else {
            welcomeData.groups[remoteJid].enabled = true
          }
          saveWelcomeData(welcomeData)
          await sock.sendMessage(remoteJid, { text: '✅ Messages de bienvenue activés !' })
          break

        case 'off':
          if (welcomeData.groups[remoteJid]) {
            welcomeData.groups[remoteJid].enabled = false
            saveWelcomeData(welcomeData)
          }
          await sock.sendMessage(remoteJid, { text: '❌ Messages de bienvenue désactivés.' })
          break

        case 'set':
          const customMessage = args.slice(1).join(' ')
          
          if (!customMessage) {
            await sock.sendMessage(remoteJid, { 
              text: '❌ Veuillez fournir un message.\n\nUtilisation : .welcome set [message]\n\nExemple :\n.welcome set Salut @user ! Bienvenue dans notre groupe 🎉' 
            })
            return
          }

          if (!welcomeData.groups[remoteJid]) {
            welcomeData.groups[remoteJid] = { enabled: true }
          }
          
          welcomeData.groups[remoteJid].message = customMessage
          saveWelcomeData(welcomeData)
          
          await sock.sendMessage(remoteJid, { 
            text: `✅ Message de bienvenue personnalisé !\n\nAperçu :\n${customMessage.replace('@user', '@exemple').replace('{name}', 'Exemple').replace('{group}', groupMetadata.subject).replace('{count}', participants.length)}` 
          })
          break

        case 'reset':
          if (welcomeData.groups[remoteJid]) {
            welcomeData.groups[remoteJid].message = `Bienvenue @user ! 🎉\n\nNous sommes ravis de t'accueillir dans {group} !\n\nNous sommes maintenant {count} membres 🎊`
            saveWelcomeData(welcomeData)
          }
          await sock.sendMessage(remoteJid, { text: '✅ Message de bienvenue réinitialisé par défaut.' })
          break

        default:
          await sock.sendMessage(remoteJid, {
            text: `❌ Action inconnue.\n\n**Commandes disponibles:**
• .welcome on - Activer
• .welcome off - Désactiver
• .welcome set [message] - Personnaliser
• .welcome reset - Réinitialiser
• .welcome - Voir le statut`
          })
      }
      
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Erreur : ${error.message}` })
    }
  }
}

// Fonction à exporter pour gérer les nouveaux membres
export async function handleNewMember(sock, update) {
  try {
    const remoteJid = update.id
    
    if (!remoteJid.endsWith('@g.us')) return
    
    const welcomeData = loadWelcomeData()
    const groupSettings = welcomeData.groups[remoteJid]
    
    // Vérifier si les messages de bienvenue sont activés
    if (!groupSettings || !groupSettings.enabled) return
    
    // Récupérer les participants ajoutés
    const addedParticipants = update.participants || []
    
    if (addedParticipants.length === 0) return
    
    // Récupérer les métadonnées du groupe
    const groupMetadata = await sock.groupMetadata(remoteJid)
    
    // Pour chaque nouveau membre
    for (const participantJid of addedParticipants) {
      const memberName = participantJid.split('@')[0]
      
      // Remplacer les variables dans le message
      let welcomeMessage = groupSettings.message
        .replace('{name}', memberName)
        .replace('{group}', groupMetadata.subject)
        .replace('{count}', groupMetadata.participants.length)
      
      // Envoyer le message avec mention
      await sock.sendMessage(remoteJid, {
        text: welcomeMessage,
        mentions: [participantJid]
      })
      
      // Petit délai entre chaque message si plusieurs nouveaux membres
      if (addedParticipants.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
  } catch (error) {
    console.error('Erreur dans handleNewMember:', error.message)
  }
}
