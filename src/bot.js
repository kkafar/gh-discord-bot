import Discord from "discord.io";
import logger from 'winston';

logger.remove(logger.transports.Console)
logger.add(new logger.transports.Console, { colorize: true })
logger.level = 'debug'

const authorizationInfo = {
	token: process.env.BOT_TOKEN,
}

const bot = new Discord.Client({
	token: authorizationInfo.token,
	autorun: true,
})

bot.on('ready', function(event) {
	logger.info("Connectd & Logged in as: " + bot.username + " - " + bot.id)
})

bot.on('message', function(user, userID, channelID, message, event) {
	if (message.startsWith('!', 0)) {
		const command = message.slice(1, message.length);
		logger.info("Received command: " + command)

		switch (command) {
			case 'ping':
				bot.sendMessage({
					to: channelID,
					message: "Pong!"
				})
				break;
			default:
				logger.info("Invalid command")
		}
	}
})
