import { Client } from 'fapi-client';

import { writeFileSync } from 'fs';

const client = new Client.Client({ auth: 'exampleKey' }); // You can get a key at fapi.dreadful.tech

client.on('response', (event) => {
  console.log(`Response recieved: ${event.response.body}`);
});

// Run our script in an async context
(async () => {
  const imageUrl = 'https://fapi.dreadful.tech/images/logo.png';

  const result = await client.lego(imageUrl, { resolution: 10 });
  writeFileSync('./output.png', result);
  return 0;
})();
