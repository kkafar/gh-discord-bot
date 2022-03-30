import Discord from 'discord.io'
import GithubDataProvider, { PullRequestMetaData } from './ghdataprovider.js'
import logger from 'winston'
import authInfo from './authinfo.js'

class DiscordBot {
	bot: Discord.Client
	githubDataProvider: GithubDataProvider
	timeInterval: number
	currentMessage?: string
	registeredChannels: Array<string>

	constructor(githubDataProvider: GithubDataProvider, timeInterval?: number) {
		this.timeInterval = timeInterval || 1000 * 60 * 60 * 12 // 12h default
		this.githubDataProvider = githubDataProvider
		this.bot = new Discord.Client({
			token: authInfo.discordToken,
			autorun: true
		})
		this.registeredChannels = []
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
			return `#${pr.number} ${pr.title} by @${pr.user.login} --> ${pr.html_url}`
		}).join('\n')
		return message
	}

	async _updateDataAsync() {
		const data = await this.githubDataProvider.fetchPRDataAndGetAsync()
		this.currentMessage = this._parseDataToMessage(data)
	}

	async _fetchDataAndNotifyChannelsAsync(channels?: string | string[]) {
		await this._updateDataAsync();

		if (this.currentMessage != null) {
			const messageToSend = 'These PRs require your attention:\n' + this.currentMessage
			if (Array.isArray(channels)) {
				channels.forEach(channelId => {
					this.bot.sendMessage({
						to: channelId,
						message: messageToSend
					})
				})
			} else {
				this.bot.sendMessage({
					to: channels || discordServerInfo.channelId,
					message: messageToSend
				})
			}
		} else {
			logger.warn("Null data returned from github manager")
		}
	}

	start() {
		this.bot.on('ready', () => {
			logger.info('Bot is ready')
			this._fetchDataAndNotifyChannelsAsync()
		})

		this.bot.on('message', (user, userID, channelID, message, event) => {
			logger.info("Notified on message: " + message)
			logger.info("ChannelID: " + channelID)

			if (message.startsWith("!")) {
				const fullCommand = message.substring(1, message.length)
				const splitedCommand = fullCommand.split(":", 2)
				
				if (splitedCommand.length >= 2 && splitedCommand[0] == "ghm") {
					const command = splitedCommand[1]
					let args = null

					if (splitedCommand.length > 2) {
						args = splitedCommand.slice(2, splitedCommand.length)
					}

					if (command == "update") {
						logger.info("Recognized command: " + command)

						if (args != null && args.length >= 2 && args[0] == "all" && args[1] == process.env.ADMIN_PASS) {
							this._fetchDataAndNotifyChannelsAsync(this.registeredChannels)
						} else {
							this._fetchDataAndNotifyChannelsAsync(channelID)	
						}

					} else if (command == "registerChannel") {
						// todo: enable setting custom time interval for notifications

						if (!this.registeredChannels.includes(channelID)) {
							this.registeredChannels.push(channelID)
						}
					} else {
						logger.info("Unrecognized command")
					}

				}
			}
		}) 
		
		setInterval(async () => {
			this._fetchDataAndNotifyChannelsAsync(this.registeredChannels)
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
	1000 * 60 * 60 * 4 // 4h
)

discortBot.start()
