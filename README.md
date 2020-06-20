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

## API

A developer can define a service using the protobuf language:

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

They can then compile by adding the `@bxpb/protoc-plugin` to an existing `protoc` installation.
`--js_out=` is necessary to build JavaScript (using CommonJS) and the `protoc-gen-ts` plugin is
needed to generate TypeScript definitions. See
[Getting Started](https://github.com/dgp1130/bxpb/wiki/Getting-Started#building-protos-with-bxpb) for more info.

```shell
npm install @bxpb/protoc-plugin@1.0.0 grpc_tools_node_protoc_ts@4.0.0 --save-dev
protoc --js_out=import_style=commonjs,binary:proto/ \
    --plugin=protoc-gen-ts=node_modules/.bin/protoc-gen-ts --ts_out=proto/
    --plugin=protoc-gen-bxpb=node_modules/.bin/bxpb-protoc-plugin --bxpb_out=proto/ \
    greeter.proto
```

This generates `proto/greeter_bxclients.ts` and `proto/greeter_bxservices.ts`, containing
client and service stubs. Then the service can be implemented in a Chrome extension like so:

```typescript
// service.ts

import { servePort } from '@bxpb/runtime';
import { GreeterService } from './proto/greeter_bxservices'; // Generated service.
import { HelloRequest, HelloResponse } from './proto/greeter_pb';

// Listen for requests with chrome.runtime.onMessage and handle them.
servePort(chrome.runtime.onMessage, GreeterService, {
    // Type inference enforces service contract.
    async greet(req: HelloRequest): Promise<HelloResponse> {
        const res = new HelloResponse();
        res.setMessage(`Hello, ${req.getName()}!`);
        return res;
    },
});
```

Any message passing API which fits the contract of `chrome.runtime.sendMessage()` can be used on the
client, while a corresponding API fitting the contract of `chrome.runtime.onMessage` can be used on
the service (for example: `chrome.runtime.sendMessageExternal()` and
`chrome.runtime.onMessageExternal`). A client/service interaction can be implemented between any two
endpoints in a browser extension. A client calls this service from a different context using:

```typescript
// client.ts

import { GreeterClient } from './proto/greeter_bxclients'; // Generated service.
import { HelloRequest } from './proto/greeter_pb';

(async () => {
    const client = new GreeterClient(chrome.runtime.sendMessage);
    const request = new HelloRequest();
    request.setName(nameEl.value);

    const response = await client.greet(request);

    console.log(response.getMessage());
})();
```

## Architecture

The architecture consists of a few packages:

*   `@bxpb/protoc-plugin`: A plugin for `protoc` which generates TypeScript client/service stubs
    for a given protobuf service.
*   `@bxpb/runtime`: A runtime included that performs the real work of communicating between the
    client and service in a generic fashion.
    *   This will include client and service stubs, rather than splitting them across multiple
        packages. This is to keep the number of packages down as much as possible.

## Internal Docs

Some additional docs only useful for development purposes:

* [Release](doc/release.md) - How to release a new version of BXPB.