#!/usr/bin/node

import { compile } from './plugin';

// Do all the meaningful work in other files which can be more easily tested.
compile().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});