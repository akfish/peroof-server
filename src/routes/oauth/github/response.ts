export interface GitHubAccessToken {
    token_type: string
    scope: string
    access_token: string
}

export interface GitHubErrorResponse {
    error: string
    error_description: string
    error_uri: string
}

export type GitHubResponse = GitHubAccessToken | GitHubErrorResponse

export function isGitHubAccessToken(res: any): res is GitHubAccessToken {
    return typeof res === 'object'
        && typeof res.token_type === 'string'
        && typeof res.scope === 'string'
        && typeof res.access_token === 'string'
}

export function isGitHubErrorResponse(res: any): res is GitHubErrorResponse {
    return typeof res === 'object'
        && typeof res.error === 'string'
        && typeof res.error_description === 'string'
        && typeof res.error_uri === 'string'
}

