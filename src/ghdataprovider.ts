import axios from "axios"
import logger from 'winston'

export type GithubEndpoints = {
	rpgio: {
		pulls?: string,
		issues?: string,
	}
}

type GithubHttpHeaders = {
	headers: {
		authorization: string
	}
}

export type GithubUser = {
	login: string,
	id: number,
	url: string,
	html_url: string,
	followers_url: string,
	following_url: string,
	gists_url: string,
	starred_url: string,
	subscriptions_url: string,
	organizations_url: string,
	repos_url: string,
	events_url: string,
	type: string,
	site_admin: boolean
}

export type PullRequestMetaData = {
	url: string,
	id: number,
	html_url: string,
	diff_url: string,
	patch_url: string,
	issue_url: string,
	number: number,
	state: string,
	locked: boolean,
	title: string,
	user: GithubUser,
	body: string,
	created_at: string,
	updated_at: string,
	closed_at?: string,
	merged_at?: string,
	merge_commit_sha: string,
	assignee?: GithubUser,
	assignees?: Array<GithubUser>
	requested_reviewers?: Array<GithubUser>,
	labels?: any,
}

export default class GithubDataProvider {
	_token: string
	githubEndpoints: GithubEndpoints
	_githubHttpHeaders: GithubHttpHeaders
	pullRequestsData: Array<PullRequestMetaData>

	constructor(authToken: string) {
		this._token = authToken
		this.githubEndpoints = {
			rpgio: {
				pulls: 'https://api.github.com/repos/RPG-IO/rpg-io/pulls'
			}
		}
		this._githubHttpHeaders = {
			headers: {
				authorization: "token " + this._token
			}
		}
		this.pullRequestsData = []
	}

	async fetchPRDataAndGetAsync(): Promise<Array<PullRequestMetaData>> {
		logger.info("Updating gh data")
		await this.fetchPRDataAsync()
		return this.pullRequestsData
	}

	async fetchPRDataAsync() {
		const response = await axios.get(this.githubEndpoints.rpgio.pulls, this._githubHttpHeaders)
		this.pullRequestsData = await response.data
	}
}
