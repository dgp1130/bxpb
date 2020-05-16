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
extensions.

As you make local changes, re-run the build command and then click the ⟳ to reload the extension
and incorporate the changes. You don't need to restart Chrome, but you do need to close any frames
which are using the extension (such as the popup window) and reopen them.

When you're done you can click "Remove" on the "Greeter" extension to uninstall it.

## Use the extension

Click on the "G" icon just right of the URL bar to show the extension popup and use it!

## Debugging

You can inspect element on the popup window and debug as you would any other web page. You can also
click on the `background.html` link in the "Greeter" extension in
[`chrome://extensions`](chrome://extensions) to inspect the background page. Sourcemaps should be
enabled by default and allow for easy debugging.