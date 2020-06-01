# Browser Extension Protocol Buffer

Browser extension often have JavaScript code running in many different contexts: a popup window, a
background script, a content script, a DevTools window, etc. Certain APIs are only available in
certain contexts, which means cross-communication is quite common and difficult to implement. This
project aims to enable developers to create client/service style code using Google's
[Protocol Buffers](https://developers.google.com/protocol-buffers) IDL, much like a developer would
create a tranditional web client. This enables easy communication between the different contexts.

![Node.js CI](https://github.com/dgp1130/bxpb/workflows/Node.js%20CI/badge.svg?branch=master)

## Prototype

A rough prototype exists in this
[gist](https://gist.github.com/dgp1130/c4932d048eb3293c503c1acd7cf8f763), which was able to sanity
check the approach.

## Expected API

A developer would be able to define a service using the protobuf language:

```proto
// greeter.proto

syntax = "proto3";

message HelloRequest {
  string name = 1;
}

message HelloResponse {
  string message = 1;
}

service Greeter {
  rpc Greet(HelloRequest) returns (HelloResponse) { }
}
```

They would compile it with the `bxpb-protoc-plugin`:

```shell
protoc --plugin=node_modules/.bin/bxpb-protoc-plugin --ts_out=protos/
```

This would generate `protos/greeter_bx.ts`, with client and service stubs. Then the service
could implemented in a Chrome extension like so:

```typescript
// service.ts

import { servePort } from 'bxpb-runtime';
import { GreeterService } from './protos/greeter_bx'; // Generated service.
import { HelloRequest, HelloResponse } from './protos/greeter_pb';

// Listen for requests with chrome.runtime.onMessage and handle them.
servePort(chrome.runtime.onMessage, GreeterService, {
    async greet(req: HelloRequest): Promise<HelloResponse> {
        const res = new HelloResponse();
        res.setMessage(`Hello, ${req.getName()}!`);
        return res;
    },
});
```

Any message passing API would be able to be used, so a client/service could be implemented between
any two endpoints in a browser extension. A client would then call this from a different context
using:

```typescript
// client.ts

import { GreeterClient } from './protos/greeter_bx'; // Generated service.
import { HelloRequest } from './protos/greeter_pb';

(async () => {
    const client = new GreeterClient(chrome.runtime.sendMessage);
    const request = new HelloRequest();
    request.setName(nameEl.value);

    const response = await client.greet(request);

    console.log(response.getMessage());
})();
```

Eventually, APIs would support request and response streaming (implemented async iterators) and
canonical errors.

## Architecture

The architecture will consist of a few packages:

*   `bxpb-protoc-compiler`: A plugin for `protoc` which generates TypeScript client/service stubs
    for a given protobuf service.
*   `bxpb-runtime`: A runtime to be included that performs the real work of communicating between
    the client and service in a generic fashion.
    *   This will include client and service stubs, rather than splitting them across multiple
        packages. This is to keep the number of packages down as much as possible.
