import * as _glob from "glob";
import * as _path from "path";
import * as _fs from "fs-extra";

export const globTestIds = ({ fs = _fs, glob = _glob, path = _path }) => ({
    idsLocation,
    output,
    cwd
}: {
    idsLocation: string;
    output: string;
    cwd: string;
}): void => {
    const allIds = glob
        .sync(path.join(cwd, idsLocation))
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

    const outFile = path.join(cwd, output);

    fs.writeFileSync(outFile, JSON.stringify(allIds, null, 2));
    console.log(`${Object.keys(allIds).length} test ids written to ${outFile}`);
};
