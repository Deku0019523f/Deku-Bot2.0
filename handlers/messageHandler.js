import commands from '../utils/commandLoader.js'
import config from '../config.js'
import configmanager from '../utils/configmanager.js'
import { handleAgentMessage } from '../commands/agent.js'

export default async function messageHandler(sock, msg) {
    const message = msg.messages?.[0]
    if (!message?.message || !message.key?.remoteJid) return

    const text =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        message.message.imageMessage?.caption ||
        message.message.videoMessage?.caption ||
        ''

    // Vérifier si l'agent IA doit répondre (avant de vérifier le préfixe)
    const agentHandled = await handleAgentMessage(sock, message, text)
    if (agentHandled) return

    if (!text.startsWith(config.prefix)) return

    const [name, ...args] = text.slice(config.prefix.length).trim().split(/\s+/)
    const command = commands.get(name)
    if (!command) return

    const sender = message.key.remoteJid.replace('@s.whatsapp.net', '')

    // Vérifier si l'utilisateur est banni
    const bannedData = await checkBanned(message.key.remoteJid)
    if (bannedData) {
        await sock.sendMessage(message.key.remoteJid, {
            text: `🚫 Vous êtes banni du bot.\nRaison : ${bannedData.reason}`
        })
        return
    }

    // Vérifier si l'utilisateur est mute
    const muteData = await checkMuted(message.key.remoteJid)
    if (muteData) {
        const remaining = Math.ceil((muteData.until - Date.now()) / 60000)
        await sock.sendMessage(message.key.remoteJid, {
            text: `🔇 Vous êtes en sourdine pour encore ${remaining} minutes.`
        })
        return
    }

    if (command.premium) {
        const isPremium = configmanager.premiums.premiumUser[sender]
        if (!isPremium) {
            await sock.sendMessage(message.key.remoteJid, {
                text: '❌ Cette commande est réservée aux utilisateurs premium.'
            })
            return
        }
    }

    try {
        await sock.sendMessage(message.key.remoteJid, {
            react: {
                text: '🎯',
                key: message.key
            }
        })
    } catch {}

    try {
        await command.execute(sock, message, args)
    } catch (error) {
        console.error(`Erreur dans la commande ${name}:`, error)
        await sock.sendMessage(message.key.remoteJid, {
            text: `❌ Une erreur s'est produite lors de l'exécution de la commande.\n${error.message}`
        })
    }
}

// Fonction pour vérifier si un utilisateur est banni
async function checkBanned(jid) {
    try {
        const fs = await import('fs')
        const path = await import('path')
        const banFilePath = path.resolve('./database/banned.json')
        
        if (!fs.existsSync(banFilePath)) return null
        
        const data = JSON.parse(fs.readFileSync(banFilePath, 'utf8'))
        return data.banned[jid] || null
    } catch {
        return null
    }
}

// Fonction pour vérifier si un utilisateur est mute
async function checkMuted(jid) {
    try {
        const fs = await import('fs')
        const path = await import('path')
        const muteFilePath = path.resolve('./database/muted.json')
        
        if (!fs.existsSync(muteFilePath)) return null
        
        const data = JSON.parse(fs.readFileSync(muteFilePath, 'utf8'))
        const muteData = data.muted[jid]
        
        if (!muteData) return null
        
        // Vérifier si le mute a expiré
        if (Date.now() > muteData.until) {
            delete data.muted[jid]
            fs.writeFileSync(muteFilePath, JSON.stringify(data, null, 2))
            return null
        }
        
        return muteData
    } catch {
        return null
    }
}
