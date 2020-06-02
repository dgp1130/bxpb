# `@bxpb/runtime`

Implements the runtime for clients and services using `bxpb`.

## Usage

Services should use `serve()` to listen to a message passing API and run a service on it.

```typescript
import { serve } from '@bxpb/runtime/service';
import { GreeterService } from 'protos/greeter_bx';
import { HelloRequest, HelloResponse } from 'protos/greeter_pb';

serve(chrome.runtime.onMessage, MyProtoService, {
    // Implement methods of the service.
    async greet(req: HelloRequest): Promise<HelloResponse> {
        const res = new HelloResponse();
        res.setMessage(`Hello, ${req.getName()}!`);
        return res;
    },
});
```

Clients should extend `ProtoClient` for a given service they want to call.

```typescript
import { ProtoClient } from '@bxpb/runtime/client';
import { GreeterService } from 'protos/greeter_bx';
import { HelloRequest, HelloResponse } from 'protos/greeter_pb';

class GreeterClient extends ProtoClient {
    async greet(req: HelloRequest): Promise<HelloResponse> {
        return await this.makeRpc(GreeterService, GreeterService.methods.greet, req);
    }
}

(async () => {
    const req = new HelloRequest();
    req.setName('Dave');

    const client = new GreeterClient(chrome.runtime.sendMessage);
    const res = await client.greet(req);

    console.log(res.getMessage()); // 'Hello, Dave!'
})();
```

Client classes are typically generated by `bxpb-protoc-plugin` and not hand-written.

## Local Development

### Build

To build this package, run from the repository root:

```shell
npm run -- lerna run build --stream --scope @bxpb/runtime --include-dependencies
```

Output files are stored in the `dist/` directory.

### Test

Build and run unit tests with this command (run from the repository root):

```shell
npm run -- lerna run build --stream --scope @bxpb/runtime --include-dependencies &&
    npm run -- lerna run test --stream --scope @bxpb/runtime
```

You can debug tests by running:

```shell
npm run -- lerna run build --stream --scope @bxpb/runtime --include-dependencies &&
    npm run -- lerna run test:debug --stream --scope @bxpb/runtime
```

This will start Karma on port 9876, open a browser to http://localhost:9876/debug.html to start
debugging. Sourcemaps should work out of the box and are available under the `/base` directory in
DevTools.

Karma will live reload and incorpate any changes from the package without requiring a restart.
However this only works for changes within `@bxpb/runtime`. If any dependent packages are modified,
this will likely require a full rebuild.