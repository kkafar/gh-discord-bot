// import { Channel, Client, Intents, TextChannel } from 'discord.js'
import Discord from 'discord.io'
import axios from 'axios'
import GithubManager from './ghmanager.js'
import logger from 'winston'

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
}, 5000)



discordBot.on('message', function(user, userID, channelID, message, event) {
	logger.info("Notified on message: " + message)
	logger.info("ChannelID: " + channelID)
}) 

