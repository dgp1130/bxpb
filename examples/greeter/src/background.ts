import { GreetRequest, GreetResponse } from '../proto/foo/bar/greeter_pb';
import { serve } from 'bxpb-runtime/dist/service';
import { GreeterService } from '../proto/foo/bar/greeter_bxdescriptors';

// Run and implement GreeterService.
serve(chrome.runtime.onMessage, GreeterService, {
    async Greet(req: GreetRequest): Promise<GreetResponse> {
        const res = new GreetResponse();
        res.setMessage(`Hello ${req.getName()}, from the background script!`);
        return res;
    }
});