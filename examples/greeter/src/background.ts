import { GreetRequest, GreetResponse } from '../proto/foo/bar/greeter_pb';
import { serve } from 'bxpb-runtime/dist/service';
import { greeterService } from './greeter_service';

// Run and implement GreeterService.
serve(chrome.runtime.onMessage, greeterService, {
    async Greet(req: GreetRequest): Promise<GreetResponse> {
        const res = new GreetResponse();
        res.setMessage(`Hello, ${req.getName()}!`);
        return res;
    }
});