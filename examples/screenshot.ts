import { Client } from 'fapi-client';

import { writeFileSync } from 'fs';

const client = new Client.Client({ auth: 'exampleKey' }); // You can get a key at fapi.dreadful.tech

// Run our script in an async context

(async () => {
  const [website, wait, allowNSFW] = ['https://google.com', 500 /* ms */, false];

  const result = await client.screenshot(website, { wait, allowNSFW });
  writeFileSync('./screenshot.png', result);
  return 0;
})();
