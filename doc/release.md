# Release

This document describes how to test and release a new version of BXPB.

## Release a Canary

First, re-install dependencies with exact versions and then run Lerna's publish script:

```shell
npm ci
npm run -- lerna publish --canary
```

This should ask what new version to publish and then update the version, install, build, and test
all the packages before publishing them to NPM. It will likely ask for a one-time password (OTP) if
two-factor auth is enabled.

The most recent release will be tagged in NPM as `canary` and can be installed with
`npm install @bxpb/my-package@canary`. It will also commit the version increment, `git tag` it, and
push the tag to `origin`.

## Release to Production

Once the canary is tested and ready, it can be pushed to production by running:

```shell
npm ci # Reset Lerna in case in changed after canary.
npm run -- lerna publish
```

This should push to NPM with the tag `latest` and also update Git with the new versions. After this,
all BXPB packages should be available at the new version for production users.