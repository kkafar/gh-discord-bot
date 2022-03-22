import axios from "axios"
import logger from 'winston'

export default class GithubManager {
	constructor() {
		this.token = process.env.BOT_GITHUB_TOKEN
		this.githubEndpoints = {
			rpgio: {
				pulls: 'https://api.github.com/repos/RPG-IO/rpg-io/pulls'
			}
		}
		this.config = {
			headers: {
				authorization: "token " + this.token
			}
		}
		this.data = []
	}

	async updateData() {
		logger.info("Updating gh data")
		const response = await this.fetchData()
		this.data = response.data.filter(pr => {
			return pr.state == 'open' && pr.locked == false
		}).map(pr => {
			return {
				url: pr.url,
				number: pr.number,
				title: pr.title,
				user: pr.user.login,
			}
		})
		return this.data
	}

	async fetchData() {
		return axios.get(this.githubEndpoints.rpgio.pulls, this.config)
	}

	analyzeResponse(response) {
		if (!Array.isArray(response)) {
			logger.error("Expected response to be an array")
			return null
		}

		const openPRs = response.filter(pr => {
			return pr.state == 'open' && pr.locked == false
		})

		console.log("List of open PRs")
		console.log(openPRs)
	}
}