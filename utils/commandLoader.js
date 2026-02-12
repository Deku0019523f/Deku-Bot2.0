import fs from 'fs'
import path from 'path'

const commands = new Map()
const commandsPath = path.resolve('./commands')

export async function loadCommands() {
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))

    for (const file of files) {
        const { default: cmd } = await import(`file://${path.join(commandsPath, file)}`)
        commands.set(cmd.name, cmd)
    }
}

export default commands