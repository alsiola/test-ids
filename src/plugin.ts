import * as babel from "@babel/core";
import * as fsextra from "fs-extra";
import * as path from "path";

const generateOutputFilename = (
    extractTo: string,
    // In test env then opts.file isn't available
    filename = "test.jsx"
): string => {
    const basename = path.basename(filename, path.extname(filename));

    // Make sure the relative path is "absolute" before
    // joining it with the `messagesDir`.
    let relativePath = path.join(
        path.sep,
        path.relative(process.cwd(), filename)
    );
    // Solve when the window user has symlink on the directory, because
    // process.cwd on windows returns the symlink root,
    // and filename (from babel) returns the original root
    if (process.platform === "win32") {
        const { name } = path.parse(process.cwd());
        if (relativePath.includes(name)) {
            relativePath = relativePath.slice(
                relativePath.indexOf(name) + name.length
            );
        }
    }

    return path.join(extractTo, path.dirname(relativePath), basename + ".json");
};

const TEST_IDS = Symbol("TEST_IDS");

const DEFAULT_MAGIC_OBJECT = "$TestId";

export interface PluginOpts {
    extractTo?: string;
    magicObject?: string;
    fs?: Pick<typeof fsextra, "mkdirpSync" | "writeFileSync">; // Here sp we can inject a mock in tests
}

export function plugin(
    this: { opts: PluginOpts },
    {
        types: t
    }: {
        types: typeof babel.types;
    }
): babel.PluginObj<{ file: any; opts: PluginOpts }> {
    return {
        /**
         * Create a Set on the file to hold collected ids. Attaching it to the file
         * means there is no issue of shared mutable state across different files
         */
        pre(file): void {
            if (!file.has(TEST_IDS)) {
                file.set(TEST_IDS, new Set());
            }
        },
        visitor: {
            /**
             *
             * Prevent referring to the naked magicObject identifier, e.g.
             * { x: $TestId }
             */
            Identifier(path): void {
                const { magicObject = DEFAULT_MAGIC_OBJECT } = this.opts;
                if (
                    path.node.name === magicObject &&
                    !t.isMemberExpression(path.container)
                ) {
                    throw path.buildCodeFrameError(
                        `Cannot refer to '${magicObject}' as a literal value. Use dot access to produce testIds e.g. '${magicObject}.myTestId'`
                    );
                }
            },
            MemberExpression(path, state): void {
                const { magicObject = DEFAULT_MAGIC_OBJECT } = this.opts;

                if (
                    t.isIdentifier(path.node.object) &&
                    path.node.object.name === magicObject &&
                    t.isIdentifier(path.node.property)
                ) {
                    // The testid is the name of that property
                    const testId = path.node.property.name;

                    // Get existing ids, and as long as there's no dupe, add this one
                    const ids: Set<string> = state.file.get(TEST_IDS);
                    if (ids.has(testId)) {
                        throw path.buildCodeFrameError(
                            `Duplicate test id: ${testId}}`
                        );
                    }
                    ids.add(testId);
                    path.replaceWith(t.stringLiteral(testId));
                }
            }
        },
        /**
         * Once we've traversed the file, if we have found any ids then write
         * them to a json file, with a path that corresponds to the original
         * location of the file, but relative the the `testIdsDir`
         */
        post(file): void {
            const { extractTo, fs = fsextra } = this.opts || {
                extractTo: false
            };
            if (!extractTo) {
                return;
            }
            const ids: Set<string> = file.get(TEST_IDS);

            const foundKeys = ids.size;

            if (foundKeys > 0) {
                const output = JSON.stringify([...ids.values()], null, 2);

                const { filename } = file.opts;

                const idFileName = generateOutputFilename(extractTo, filename);

                fs.mkdirpSync(path.dirname(idFileName));
                fs.writeFileSync(idFileName, output);
            }
        }
    };
}

export default plugin;
