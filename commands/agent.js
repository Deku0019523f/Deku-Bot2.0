import axios from 'axios'
import fs from 'fs'
import path from 'path'

// Liste des produits (à remplir manuellement dans le fichier products.txt)
const productsFilePath = path.resolve('./database/products.txt')

function getProductsList() {
  try {
    if (fs.existsSync(productsFilePath)) {
      return fs.readFileSync(productsFilePath, 'utf8')
    }
    return "Aucun produit configuré pour le moment."
  } catch {
    return "Aucun produit configuré pour le moment."
  }
}

const COMPANY_INFO = `
INFORMATIONS BOUTIQUE

🏪 Nom: deku225
📍 Localisation: Abidjan, Côte d'Ivoire
📧 Email: deku0019523f@gmail.com
📱 WhatsApp: Ce numéro
🌐 Site web: deku225.online

⏰ HORAIRES
Lundi - Samedi: 8h - 20h
Dimanche: 10h - 18h

🚚 LIVRAISON
- Abidjan: 2,000 FCFA (24-48h)
- Intérieur du pays: 5,000 FCFA (3-5 jours)
- Livraison gratuite à partir de 100,000 FCFA

💳 PAIEMENTS ACCEPTÉS
- Wave: +225 05 08 18 28 46
- Orange Money: +225 07 18 62 37 73
- MTN Mobile Money: +225 05 75 71 91 13

🔄 POLITIQUE DE RETOUR
- 7 jours pour retour/échange
- Produit non utilisé, emballage intact
- Frais de retour à la charge du client
`

const AGENT_PROMPT = `# PROMPT AGENT SERVICE CLIENT E-COMMERCE (Assistant Deku)

## DESCRIPTION DU RÔLE
Tu es Assistant Deku, assistant(e) service client pour deku225.online, une boutique en ligne. Tu aides les clients de façon amicale et naturelle, comme un membre de l'équipe. Tu réponds aux questions, résous les problèmes et assures une expérience d'achat optimale.

## PERSONNALITÉ
- **Naturelle et Spontanée**: Parle fluidement, utilise des expressions courantes.
- **Empathique et Chaleureuse**: Montre de la compréhension.
- **Professionnelle mais Accessible**: Polie, langage simple.
- **Proactive et Engageante**: Propose de l'aide, anticipe les besoins.

## CONNAISSANCES REQUISES

### INFORMATIONS SUR L'ENTREPRISE
${COMPANY_INFO}

### CATALOGUE PRODUITS
{PRODUCTS_LIST}

### GESTION DES RÉCLAMATIONS
- Écoute le problème sans interrompre
- Reformule pour montrer la compréhension
- Présente des excuses sincères
- Propose une solution concrète et rapide
- Suit l'évolution du dossier

### POLITIQUE DE L'ENTREPRISE
- Satisfaction client prioritaire
- Transparence sur les délais et prix
- Produits authentiques garantis
- Service après-vente réactif
- Protection des données clients

## STRUCTURE DE CONVERSATION

### 1. Accueil
- Salutation personnalisée (prénom si possible)
- Proposition d'aide décontractée
Ex: "Salut ! C'est Assistant Deku 👋 Comment puis-je t'aider aujourd'hui ?"

### 2. Compréhension
- Écoute active : reformule avec tes mots
- Questions de clarification naturelles
Ex: "Ok, pour être sûr(e), tu cherches des infos sur quel produit exactement ?"

### 3. Réponse/Solution
- Réponse directe, conversationnelle, simple
- Expressions courantes: "Pas de souci !", "Je vois...", "Ah d'accord !"
- Si inconnu: "Laisse-moi vérifier ça avec un(e) collègue" + proposition d'aide humaine

### 4. Accompagnement/Conclusion
- Vérification: "Ça répond à ta question ?"
- Aide supplémentaire: "Besoin d'autre chose ?"
- Conclusion amicale: "À très bientôt ! 😊"

## RÈGLES DE COMMUNICATION

1. **Ton**: Amical, respectueux, décontracté. Utilise des emojis avec modération 😊
2. **Écoute**: Reformule. Interjections: "Ok...", "D'accord...", "Je vois..."
3. **Réclamations**: "Désolé(e) pour ce problème...", "On va régler ça ensemble"
4. **Impatience**: "Je fais au plus vite !", "Merci de ta patience"
5. **Questions sensibles**: Redirige vers un canal sûr/humain
6. **IMPÉRATIF**: Ne JAMAIS dire que tu es une IA. Tu te comportes comme un humain, membre de l'équipe deku225.online
7. **Réponses courtes**: Maximum 3-4 phrases par message pour rester naturel
8. **Si demande de paiement**: Toujours donner les numéros Wave (+225 05 08 18 28 46) et Orange Money (+225 07 18 62 37 73)

## EXEMPLES DE RÉPONSES

**Client**: "Bonjour, vous avez des iPhone ?"
**Deku**: "Salut ! Oui on a des iPhone en stock 📱 Tu cherches quel modèle exactement ?"

**Client**: "Comment je peux payer ?"
**Deku**: "Pas de souci ! On accepte Wave (+225 05 08 18 28 46), Orange Money (+225 07 18 62 37 73), MTN, Moov ou espèces à la livraison. C'est quoi qui t'arrange le mieux ?"

**Client**: "Je n'ai pas reçu ma commande"
**Deku**: "Désolé(e) pour ce retard 😔 Donne-moi ton numéro de commande, je vérifie ça tout de suite avec l'équipe livraison."

FIN / Site web: deku225.online`

// Stocker les conversations
const conversationsPath = path.resolve('./database/conversations.json')

if (!fs.existsSync(path.resolve('./database'))) {
  fs.mkdirSync(path.resolve('./database'), { recursive: true })
}

if (!fs.existsSync(conversationsPath)) {
  fs.writeFileSync(conversationsPath, JSON.stringify({}, null, 2))
}

if (!fs.existsSync(productsFilePath)) {
  fs.writeFileSync(productsFilePath, `# CATALOGUE PRODUITS - deku225.online

📝 Instructions: Ajoutez vos produits ci-dessous au format suivant:
Nom du produit - Prix FCFA
Description courte

Exemple:
iPhone 15 Pro Max 256GB - 850,000 FCFA
Neuf, garantie 1 an, toutes couleurs disponibles

---

# VOS PRODUITS ICI:

`)
}

function loadConversations() {
  const data = fs.readFileSync(conversationsPath, 'utf8')
  return JSON.parse(data)
}

function saveConversations(data) {
  fs.writeFileSync(conversationsPath, JSON.stringify(data, null, 2))
}

export default {
  name: 'agent',
  description: 'Activer/désactiver l\'agent IA pour ce chat',
  category: 'IA',
  execute: async (sock, message, args) => {
    const remoteJid = message.key.remoteJid
    
    // Cette commande active/désactive l'agent pour ce chat
    const conversations = loadConversations()
    
    if (conversations[remoteJid]?.active) {
      conversations[remoteJid].active = false
      saveConversations(conversations)
      await sock.sendMessage(remoteJid, { text: '❌ Agent IA désactivé pour ce chat.' })
    } else {
      conversations[remoteJid] = {
        active: true,
        history: []
      }
      saveConversations(conversations)
      
      await sock.sendMessage(remoteJid, {
        text: `╔══════════════════╗
🤖 *ASSISTANT DEKU ACTIVÉ*
╠══════════════════╣

Salut ! C'est Assistant Deku 👋

Je suis là pour t'aider avec :
• Infos sur nos produits
• Prix et disponibilités
• Modes de paiement
• Livraison et retours
• Toutes tes questions !

Écris-moi naturellement, je te réponds tout de suite 😊

Pour me désactiver : .agent

╚══════════════════╝

🌐 deku225.online`
      })
    }
  }
}

// Fonction à intégrer dans messageHandler.js pour répondre automatiquement
export async function handleAgentMessage(sock, message, text) {
  const remoteJid = message.key.remoteJid
  
  // Ne pas répondre aux groupes
  if (remoteJid.endsWith('@g.us')) return false
  
  const conversations = loadConversations()
  
  if (!conversations[remoteJid]?.active) return false
  
  // Ne pas répondre aux commandes
  if (text.startsWith('.')) return false
  
  // Ignorer les messages vides
  if (!text.trim()) return false
  
  try {
    // Récupérer l'historique
    if (!conversations[remoteJid].history) {
      conversations[remoteJid].history = []
    }
    
    const history = conversations[remoteJid].history
    
    // Ajouter le message de l'utilisateur
    history.push({
      role: 'user',
      content: text
    })
    
    // Garder seulement les 10 derniers messages (5 échanges)
    if (history.length > 10) {
      history.shift()
      history.shift()
    }
    
    // Charger la liste des produits
    const productsList = getProductsList()
    const finalPrompt = AGENT_PROMPT.replace('{PRODUCTS_LIST}', productsList)
    
    // Appeler l'API Perplexity
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: finalPrompt
          },
          ...history
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer VOTRE_CLE_API_PERPLEXITY`, // Remplacer par votre clé API
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    const answer = response.data.choices[0].message.content
    
    // Ajouter la réponse à l'historique
    history.push({
      role: 'assistant',
      content: answer
    })
    
    conversations[remoteJid].history = history
    saveConversations(conversations)
    
    await sock.sendMessage(remoteJid, { text: answer })
    
    return true
  } catch (error) {
    console.error('Agent error:', error.message)
    
    // Message d'erreur convivial
    await sock.sendMessage(remoteJid, { 
      text: "Désolé, j'ai un petit souci technique là 😅 Réessaie dans quelques secondes !" 
    })
    
    return true
  }
}
