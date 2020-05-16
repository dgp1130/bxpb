# Greeter Example Service

This "Hello World" example shows a simple bxpb client and service communicating across different
contexts in a browser extension.

## Build the extension

To build the extension, run the following command **from the repository root**:

```shell
npm run -- lerna run build --stream --scope greeter --include-dependencies
```

This will build the Chrome extension unpacked and place the output in the `dist/` directory.

## Install the extension

To install the built extension in Chrome:

1. Open Chrome to [`chrome://extensions`](chrome://extensions).
1. Check the "Developer mode" button in the top-right.
1. Click the new "Load unpacked" button in the lop-left.
1. Select the `dist/` directory.

The extension is now installed (no need to restart Chrome)! You should see "Greeter" in the list of
extensions. When you're done you can click "Remove" on the "Greeter" extension to uninstall it.