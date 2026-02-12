import { downloadMediaMessage } from '@whiskeysockets/baileys'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

export default {
  name: 'sticker',
  description: 'Convertir une image/vidéo en sticker',
  category: 'Utilitaires',
  execute: async (sock, message, args) => {
    const remoteJid = message.key.remoteJid
    
    try {
      const quotedMessage = message.message.extendedTextMessage?.contextInfo?.quotedMessage
      const imageMessage = message.message.imageMessage || quotedMessage?.imageMessage
      const videoMessage = message.message.videoMessage || quotedMessage?.videoMessage
      
      if (!imageMessage && !videoMessage) {
        await sock.sendMessage(remoteJid, { text: '❌ Veuillez envoyer/répondre à une image ou vidéo.\nUtilisation : .sticker (avec image/vidéo)' })
        return
      }

      await sock.sendMessage(remoteJid, { text: '⏳ Création du sticker...' })

      const buffer = await downloadMediaMessage(
        { message: quotedMessage || message.message },
        'buffer',
        {}
      )

      const tempPath = path.resolve(`./temp/temp_${Date.now()}.${imageMessage ? 'jpg' : 'mp4'}`)
      const outputPath = path.resolve(`./temp/sticker_${Date.now()}.webp`)
      
      fs.writeFileSync(tempPath, buffer)

      // Convertir en webp avec ffmpeg (nécessite ffmpeg installé)
      if (imageMessage) {
        await execPromise(`ffmpeg -i ${tempPath} -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2" ${outputPath}`)
      } else {
        await execPromise(`ffmpeg -i ${tempPath} -t 5 -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2,fps=15" ${outputPath}`)
      }

      await sock.sendMessage(remoteJid, {
        sticker: fs.readFileSync(outputPath)
      })

      // Nettoyer les fichiers temporaires
      fs.unlinkSync(tempPath)
      fs.unlinkSync(outputPath)
      
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Erreur : ${error.message}\n\nNote: Cette commande nécessite ffmpeg installé.` })
    }
  }
}
