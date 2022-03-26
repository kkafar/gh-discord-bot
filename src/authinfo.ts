const authInfo: {
	discordToken?: string,
	githubToken?: string,
} = {
	discordToken: process.env.BOT_DISCORD_TOKEN,
	githubToken: process.env.BOT_GITHUB_TOKEN
}

export default authInfo;
