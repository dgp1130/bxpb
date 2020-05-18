import { GreeterClient } from './greeter_client';
import { GreetRequest } from '../proto/foo/bar/greeter_pb';

(async () => {
    // Make an example request to the `Greeter` service.
    const client = new GreeterClient(chrome.runtime.sendMessage);
    const req = new GreetRequest();
    req.setName('Dave');
    const res = await client.Greet(req);
    console.log(res.getMessage());
})();