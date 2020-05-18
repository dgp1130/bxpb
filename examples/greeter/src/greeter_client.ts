/** This file will eventually be auto-generated, but for now is hand-written. */

import { ProtoClient, rpc } from 'bxpb-runtime/dist/client';
import { GreetRequest, GreetResponse } from '../proto/foo/bar/greeter_pb';
import { greeterService } from './greeter_service';

/** Client for calling the `Greeter` service. */
export class GreeterClient extends ProtoClient {
    async Greet(req: GreetRequest): Promise<GreetResponse> {
        return await rpc(this.sendMessage, greeterService, greeterService.methods.Greet, req) as GreetResponse;
    }
}