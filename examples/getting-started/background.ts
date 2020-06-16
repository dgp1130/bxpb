// Runs in a background context.

import { serveGreeter } from './proto/greeter_bxservices';
import { GreetRequest, GreetResponse } from './proto/greeter_pb';

console.log('I am the background script!');

// Run `Greeter`, listening for requests using the `onMessage` event.
serveGreeter(chrome.runtime.onMessage, {
    // Handle a client request for the `Greet()` method.
    async Greet(req: GreetRequest): Promise<GreetResponse> {
        console.log(`Received request for name: "${req.getName()}"`);

        const res = new GreetResponse();
        res.setMessage(`Hello, ${req.getName()}!`);
        return res;
    },
});