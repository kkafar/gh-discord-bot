import Discord from 'discord.io'
import GithubDataProvider, { PullRequestMetaData } from './ghdataprovider.js'
import logger from 'winston'
import authInfo from './authinfo.js'

class DiscordBot {
	bot: Discord.Client
	githubDataProvider: GithubDataProvider
	timeInterval: number

	constructor(githubDataProvider: GithubDataProvider, timeInterval?: number) {
		this.timeInterval = timeInterval || 1000 * 60 * 60 * 12 // 12h default
		this.githubDataProvider = githubDataProvider
		this.bot = new Discord.Client({
			token: authInfo.discordToken,
			autorun: true
		})
	}

	_parseDataToMessage(data: Array<PullRequestMetaData>): string | null {
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

	async _fetchDataAndNotifyAsync(channelId?: string) {
		const data = await this.githubDataProvider.fetchPRDataAndGetAsync()
		if (data != null) {
			const mess = this._parseDataToMessage(data)
			if (mess) {
				this.bot.sendMessage({
					to: channelId || discordServerInfo.channelId,
					message: 'These PRs require your attention:\n' + mess
				})
			} else {
				logger.error("Null message returned from parser")
			}
		} else {
			logger.warn("Null data returned from github manager")
		}
	}

	start() {
		this.bot.on('ready', () => {
			logger.info('Bot is ready')
			this._fetchDataAndNotifyAsync()
		})

		this.bot.on('message', (user, userID, channelID, message, event) => {
			logger.info("Notified on message: " + message)
			logger.info("ChannelID: " + channelID)

			if (message.startsWith("!")) {
				const command = message.substring(1, message.length)

				if (command == "repoupdate") {
					logger.info("Recognized command: " + command)
					this._fetchDataAndNotifyAsync()	
				} else {
					logger.info("Unrecognized command")
				}
			}
		}) 
		
		setInterval(async () => {
			this._fetchDataAndNotifyAsync()
		}, this.timeInterval)
	}
}

logger.add(new logger.transports.Console)

const discordServerInfo = {
	channelId: process.env.BOT_TEST_CHANNEL_ID
}

if (!authInfo.githubToken) {
	logger.error("Null github token")
}

const discortBot = new DiscordBot(
	new GithubDataProvider(authInfo.githubToken),
	12 * 60 * 60 * 1000
)

discortBot.start()
