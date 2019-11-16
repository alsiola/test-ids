#!/usr/bin/env node

import * as fs from "fs-extra";
import * as glob from "glob";
import * as path from "path";
import commander from "commander";
import { globTestIds } from "./glob-test-ids";

const program = new commander.Command("glob-test-ids");

const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "package.json")).toString()
);

program.version(packageJson.version);

program
    .requiredOption("-i, --ids-location <location>", "glob pattern of id files")
    .requiredOption("-o, --output <output>", "Output file");

program.parse(process.argv);

try {
    globTestIds({ fs, glob, path })({
        idsLocation: program.idsLocation,
        output: program.output
    });
    process.exit(0);
} catch (e) {
    console.error(e);
    process.exit(1);
}
