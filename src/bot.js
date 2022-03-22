import { Client, Intents } from 'discord.js'

const authInfo = {
	token: process.env.BOT_TOKEN
}

const client = new Client({
	intents: [Intents.FLAGS.GUILDS]
})

client.once('ready', () => {
	console.log("Bot is ready!")
})

client.login(authInfo.token)
