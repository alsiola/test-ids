#!/usr/bin/env node

import * as fs from "fs-extra";
import * as glob from "glob";
import * as path from "path";
import commander from "commander";

const program = new commander.Command("glob-test-ids");

const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "package.json")).toString()
);

program.version(packageJson.version);

program
    .requiredOption("-i, --ids-location <location>", "glob pattern of id files")
    .requiredOption("-o, --output <output>", "Output file");

program.parse(process.argv);

function globTestIds() {
    try {
        const allIds = glob
            .sync(path.join(process.cwd(), program.idsLocation))
            .map(filename => ({
                filename,
                file: fs.readFileSync(filename, "utf8")
            }))
            .map(({ filename, file }) => ({
                filename,
                file: JSON.parse(file) as string[]
            }))
            .reduce(
                (ids, { filename, file }) => {
                    file.forEach(testId => {
                        if (testId in ids) {
                            throw new Error(
                                `Duplicate test id ${testId} in ${filename}`
                            );
                        }
                        ids[testId] = testId;
                    });
                    return ids;
                },
                {} as Record<string, string>
            );

        fs.mkdirpSync(path.dirname(program.output));

        const outFile = path.join(process.cwd(), program.output);

        fs.writeFileSync(outFile, JSON.stringify(allIds, null, 2));
        console.log(
            `${Object.keys(allIds).length} test ids written to ${outFile}`
        );
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

globTestIds();
