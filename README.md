# Archived

This project is now archived because fAPI is no longer available.

# fClient

**A REST client that wraps the fAPI image manipulation API.**

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Jacherr_fClient&metric=alert_status)](https://sonarcloud.io/dashboard?id=Jacherr_fClient) <br>
[![gh_pages](https://img.shields.io/github/deployments/jacherr/fclient/github-pages?label=gh-pages)](https://jacherr.github.io/fClient) ![deps](https://img.shields.io/david/jacherr/fclient.svg) <br>
[![npm_version](https://img.shields.io/npm/v/fapi-client)](https://www.npmjs.com/package/fapi-client/access) ![npm_downloads](https://img.shields.io/npm/dt/fapi-client) <br>
[![discord](https://discordapp.com/api/guilds/691713541262147687/embed.png)](https://discord.gg/vCJCc82)

## Install:
`npm i fapi-client`

## Examples:

### TypeScript: 
```ts
import { Client } from 'fapi-client/JS/src/client'

import { writeFileSync } from 'fs';

const client = new Client({ auth: 'exampleKey' });

(async () => {
    const result = await client.keemstar('https://fapi.dreadful.tech/images/logo.png');
    writeFileSync('./output.png', result)
    return 0
})()
```

### JavaScript:
```js
const Client = require('fapi-client/JS/src/client').Client

const writeFileSync = require('fs').writeFileSync

const client = new Client({ auth: 'exampleKey' });

(async () => {
    const result = await client.keemstar2('https://fapi.dreadful.tech/images/logo.png');
    writeFileSync('./output.png', result)
    return 0
})()
```

## Contributing
To contribute, open a PR with your requested changes. All changes should point to the `dev` branch - all PRs pointing to `master` will be closed.

## Support
For support with this wrapper and fAPI in general, you can join the Discord server [here](https://discord.gg/6kJGveU).
