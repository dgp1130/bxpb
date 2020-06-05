# `@bxpb/runtime`

Implements the runtime for clients and services using BXPB.

Note: All currently exported APIs are considered "private" to BXPB generated code and are not fit to
be called directly by user code. In the future, publically avilable APIs may be added here.

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