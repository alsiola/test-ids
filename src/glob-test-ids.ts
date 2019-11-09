import * as glob from "glob";
import * as path from "path";
import * as fs from "fs-extra";

export const globTestIds = ({
    idsLocation,
    output
}: {
    idsLocation: string;
    output: string;
}) => {
    try {
        const allIds = glob
            .sync(path.join(process.cwd(), idsLocation))
            .map(filename => ({
                filename,
                file: fs.readFileSync(filename, "utf8")
            }))
            .map(({ filename, file }) => ({
                filename,
                file: JSON.parse(file) as string[]
            }))
            .reduce((ids, { filename, file }) => {
                file.forEach(testId => {
                    if (testId in ids) {
                        throw new Error(
                            `Duplicate test id ${testId} in ${filename}`
                        );
                    }
                    ids[testId] = testId;
                });
                return ids;
            }, {} as Record<string, string>);

        fs.mkdirpSync(path.dirname(output));

        const outFile = path.join(process.cwd(), output);

        fs.writeFileSync(outFile, JSON.stringify(allIds, null, 2));
        console.log(
            `${Object.keys(allIds).length} test ids written to ${outFile}`
        );
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
