# graph-gitleaks-findings

This is a local/unmanaged integration that executes Gitleaks and ingest its
findings into JupiterOne.

## Building the Docker image

Execute: `docker build . -t gitleaks-ingest`

## Running the Docker container

Create a `.env` file with the following values:

```bash
BITBUCKET_OAUTH_KEY=<your secret here>
BITBUCKET_OAUTH_SECRET=<your secret here>
BITBUCKET_SSH_PRIVATE_KEY=<your secret here>
BITBUCKET_ORGS_CSV=comma,separated,org-names
GITHUB_ORGS_CSV=comma,separated,org-names
J1_ACCESS_TOKEN=<your secret here>
J1_ACCOUNT=<your J1 account name here>
```

NOTE: the SSH private key secret must be base64-encoded, and may be generated via a command like:
`cat ~/.ssh/id_rsa | base64 -w 0` (non-wrapping output)

This SSH key must have read access to all Bitbucket repos, and should not
require a passphrase (Gitleaks does not support SSH keys requiring passphrases).

With this file in place, run:

`docker run --rm --env-file ./.env gitleaks-ingest`

## Assumptions and Limitations

The current version only supports running Gitleaks scan on

- public Github repos
- private Bitbucket repos
- repos that are part of an organization

## Optional Environment Vars

You may optionally specify the following in your `.env`:

```bash
BITBUCKET_REPOS_TO_SKIP_CSV=comma,separated,repo-names
```

## Query JupiterOne Findings

Once ingested, you may view the findings via a queries like:

```j1ql
Find gitleaks_finding
```

```j1ql
Find gitleaks_finding with coderepo_type="github_repo" and severity!="low"
```

```j1ql
Find gitleaks_finding with coderepo_type="bitbucket_repo" as f
return f.rule, f.webLink, f.line, f.commit, f.file, f.author
```

Additionally, you may find it useful to construct an Insights Dashboard "chart" widget with a query like:

```j1ql
Find gitleaks_finding with severity != 'low' as leak
return leak.repo as x, count(leak) as y
order by y desc limit 10
```
