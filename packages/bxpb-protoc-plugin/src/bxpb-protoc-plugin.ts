#!/usr/bin/node

import { execute } from './plugin';

// Do all the meaningful work in other files which can be more easily tested.
execute().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});