# `@bxpb/protoc-plugin`

The compiler plugin for `protoc` which generates client and service TypeScript code for `bxpb`.

## Usage

Start by
[installing `protoc`](https://github.com/protocolbuffers/protobuf#protocol-compiler-installation).
You can use `grpc_tools_node_protoc` from [`grpc-tools`](https://www.npmjs.com/package/grpc-tools)
if you want something installable from NPM.

Then run (replace `protoc` with `grpc_tools_node_protoc` if necessary):

```shell
protoc --plugin=protoc-gen-bxpb=node_modules/.bin/bxpb-protoc-plugin --bxpb_out=generated/ greeter.proto
```

This will compile `greeter.proto` in the current directory and generate TypeScript definitions for BXPB
under the `generated/` directory. This will output:

```
generated/greeter_bxpb_service.d.ts
generated/greeter_bxpb_service.js
generated/greeter_bxpb_client.d.ts
generated/greeter_bxpb_client.js
```

The first two files contain definitions to run the proto service, while the last two files contain
definitions to call the service.

## Local Development

### Build and Run

To build this package, run from the repository root:

```shell
npm run -- lerna run build --stream --scope @bxpb/protoc-plugin --include-dependencies
```

Output files are in the `dist/` directory, while the binary can be invoked with:

```shell
npm run -- lerna run start --stream --scope @bxpb/protoc-plugin
```

### Test

Build and run unit tests with this command (run from the repository root):

```shell
npm run -- lerna run build --stream --scope @bxpb/protoc-plugin --include-dependencies &&
    npm run -- lerna run test --stream --scope @bxpb/protoc-plugin
```

You can debug tests in VSCode with the
["@bxpb/protoc-plugin - Test Debug" launch configuration](/.vscode/launch.json).

Sourcemaps seem to work fine, though breakpoints are finicky; sometimes they trigger and sometimes
not. The `debugger;` statement is the most reliable way to break in the file.

You can also test with any other Node inspector by using:

```shell
npm run -- lerna run build --stream --scope @bxpb/protoc-plugin --include-dependencies &&
    npm run -- lerna run test:debug --stream --scope @bxpb/protoc-plugin
```

And then connecting to Node debug port exposed in your preferred debugger. For Chrome, this is done
by visiting [`chrome://inspect`](chrome://inspect) and clicking "Open dedicated DevTools for Node".

Place a `debugger;` statement at the top of the file you are interested in, and then hit "continue"
until you reach that file. You should then be able to place and use breakpoints as desired.