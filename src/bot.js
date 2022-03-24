// import { Channel, Client, Intents, TextChannel } from 'discord.js'
import Discord from 'discord.io'
import axios from 'axios'
import GithubManager from './ghmanager.js'
import logger from 'winston'
import express from 'express'

const server = express()

logger.add(new logger.transports.Console)

function parseDataToMessage(data) {
	if (data == null) {
		logger.error("Null data passed to parser")
		return null
	} else if (!Array.isArray(data)) {
		logger.error("Invalid data format (array check)")
		return null
	}
	console.log(data)
	// const message = data.map(pr => {
	// 	return `[#${pr.number}: ${pr.title}](${pr.url}) by @${pr.user}`
	// })

	const message = data.map(pr => {
		return `#${pr.number} ${pr.title} by @${pr.user} --> ${pr.url}`
	}).join('\n')

	// const message = data.map(pr => {
	// 	return {
	// 		name: `#${pr.number} ${pr.title} -- by @${pr.user}`,
	// 		value: `${pr.url}`,
	// 		inline: false
	// 	}
	// })

	// console.log(message)
	return message
}

const authInfo = {
	discordToken: process.env.BOT_DISCORD_TOKEN,
	githubToken: process.env.BOT_GITHUB_TOKEN
}

const discordServerInfo = {
	channelId: process.env.BOT_TEST_CHANNEL_ID
}

console.log("Discord server info from env")
console.log(discordServerInfo.channelId);

const discordBot = new Discord.Client({
	token: authInfo.discordToken,
	autorun: true
})


discordBot.on('ready', function() {
	logger.info('Bot is ready')
})

const githubManager = new GithubManager()

setInterval(async () => {
	const data = await githubManager.updateData()
	if (data != null) {
		const mess = parseDataToMessage(data)
		if (mess) {
			discordBot.sendMessage({
				to: discordServerInfo.channelId,
				message: 'These PRs require your attention:\n' + mess
				// embed: {
				// 	title: "These PRs require your attention",
				// 	fields: mess
				// }
			})
		} else {
			logger.error("Null message returned from parser")
		}
	} else {
		logger.warn("Null data returned from github manager")
	}
}, 1000 * 60 * 60 * 12) // every 12h


discordBot.on('message', function(user, userID, channelID, message, event) {
	logger.info("Notified on message: " + message)
	logger.info("ChannelID: " + channelID)

	if (message.startsWith("!")) {
		const command = message.substring(1, message.length)

		logger.info("Recognized command: " + command)

		if (command == "repoupdate") {
			const data = await githubManager.updateData()
			if (data != null)	{
				const mess = parseDataToMessage(data)
				if (mess) {
					discordBot.sendMessage({
						to: discordServerInfo.channelId,
						message: 'These PRs require your attention:\n' + mess
					})
				} else {
					logger.error("Null message returned from parser")
				}
			} else {
				logger.warn("Null data returned from github manager")
			}
		} else {
			logger.info("Unrecognized command")
		}
	}
}) 

const serverConfig = {
	port: process.env.PORT
}

server.get('/', (req, res) => {
	res.send("Bot")
})

server.listen(serverConfig.port, async () => {
	logger.info("Express server started")
});
