import { GreetRequest, GreetResponse } from '../proto/foo/bar/greeter_pb';
import { serveGreeter } from '../proto/foo/bar/greeter_bxservices';

// Run and implement GreeterService.
serveGreeter(chrome.runtime.onMessage, {
    async Greet(req: GreetRequest): Promise<GreetResponse> {
        const res = new GreetResponse();
        res.setMessage(`Hello ${req.getName()}, from the background script!`);
        return res;
    }
});