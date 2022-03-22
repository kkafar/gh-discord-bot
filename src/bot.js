import { Client, Intents } from 'discord.js'
import axios from 'axios'

const authInfo = {
	discordToken: process.env.BOT_DISCORD_TOKEN,
	githubToken: process.env.BOT_GITHUB_TOKEN
}

const client = new Client({
	intents: [Intents.FLAGS.GUILDS]
})

client.once('ready', async () => {
	console.log("Bot is ready!")
})

client.login(authInfo.discordToken)

const config = {
	headers: {
		authorization: "token " + authInfo.githubToken
	}
}

// const url = 'https://api.github.com/orgs/RPG-IO/repos'
const url = 'https://api.github.com/repos/RPG-IO/rpg-io/pulls'

const response = await axios.get(url, config)

console.log(await response)