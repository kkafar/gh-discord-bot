import Discord from 'discord.io'
import GithubManager from './ghmanager.js'
import logger from 'winston'
import authInfo from './authinfo'

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

	const message = data.map(pr => {
		return `#${pr.number} ${pr.title} by @${pr.user} --> ${pr.url}`
	}).join('\n')
	return message
}

const discordServerInfo = {
	channelId: process.env.BOT_TEST_CHANNEL_ID
}

const discordBot = new Discord.Client({
	token: authInfo.discordToken,
	autorun: true
})

discordBot.on('ready', function() {
	logger.info('Bot is ready')
})

const githubManager = new GithubManager()

async function handleUpdateAsync(channelID) {
	const channel = channelID || discordServerInfo.channelId
	const data = await githubManager.updateDataAsync()
	if (data != null)	{
		const mess = parseDataToMessage(data)
		if (mess) {
			discordBot.sendMessage({
				to: channel,
				message: 'These PRs require your attention:\n' + mess
			})
		} else {
			logger.error("Null message returned from parser")
		}
	} else {
		logger.warn("Null data returned from github manager")
	}
}

setInterval(async () => {
	const data = await githubManager.updateDataAsync()
	if (data != null) {
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
}, 1000 * 60 * 60 * 12) // every 12h


discordBot.on('message', function(user, userID, channelID, message, event) {
	logger.info("Notified on message: " + message)
	logger.info("ChannelID: " + channelID)

	if (message.startsWith("!")) {
		const command = message.substring(1, message.length)

		logger.info("Recognized command: " + command)

		if (command == "repoupdate") {
			handleUpdate(channelID)
		} else {
			logger.info("Unrecognized command")
		}
	}
}) 
