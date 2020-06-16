// Runs in a popup context.

import { GreeterClient } from './proto/greeter_bxclients';
import { GreetRequest } from './proto/greeter_pb';

console.log('I am the popup!');

// An immediately-invoked function expression (IIFE) to get an asynchronous context to use `await`.
(async () => {
    // Create a client which sends a message that will trigger `chrome.runtime.onMessage`.
    const client = new GreeterClient(chrome.runtime.sendMessage);

    const req = new GreetRequest();
    req.setName('Dave');
    
    // Send the RPC and get the response.
    const res = await client.Greet(req);

    console.log(`Message from background script: "${res.getMessage()}"`);
})();