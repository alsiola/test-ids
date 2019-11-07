import * as babel from "@babel/core";
import * as fs from "fs-extra";
import * as path from "path";

const generateOutputFilename = (
    extractTo: string,
    filename: string = "test.jsx"
) => {
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
const DEFAULT_JSX_ATTRIBUTE = "data-testid";

export interface PluginProps {
    jsxAttribute?: string;
    extractTo?: string;
    magicObject?: string;
}

const plugin = function(
    this: { opts: PluginProps },
    {
        types: t
    }: {
        types: typeof babel.types;
    }
): babel.PluginObj<{ file: any; opts: PluginProps }> {
    return {
        /**
         * Create a Set on the file to hold collected ids. Attaching it to the file
         * means there is no issue of shared mutable state across different files
         */
        pre(file) {
            if (!file.has(TEST_IDS)) {
                file.set(TEST_IDS, new Set());
            }
        },
        visitor: {
            Property(path, state) {
                const { magicObject = DEFAULT_MAGIC_OBJECT } = this.opts;

                if (
                    t.isMemberExpression(path.node.value) &&
                    t.isIdentifier(path.node.value.object) &&
                    path.node.value.object.name === magicObject &&
                    t.isIdentifier(path.node.value.property)
                ) {
                    // The testid is the name of that property
                    const testId = path.node.value.property.name;

                    // Get existing ids, and as long as there's no dupe, add this one
                    const ids: Set<string> = state.file.get(TEST_IDS);
                    if (ids.has(testId)) {
                        throw path.buildCodeFrameError(
                            `Duplicate test id: ${testId}}`
                        );
                    }
                    ids.add(testId);

                    const value = path.get("value");

                    value.replaceWith(t.stringLiteral(testId));
                }
            },
            JSXAttribute(path, state) {
                const {
                    jsxAttribute = DEFAULT_JSX_ATTRIBUTE,
                    magicObject = DEFAULT_MAGIC_OBJECT
                } = this.opts;

                if (
                    // The attribute matches the specified jsx attribute
                    path.node.name.name === jsxAttribute &&
                    // And has a value that is an expression container
                    t.isJSXExpressionContainer(path.node.value) &&
                    // And a memberExpression inside that
                    t.isMemberExpression(path.node.value.expression) &&
                    // Where the object is an identifier
                    t.isIdentifier(path.node.value.expression.object) &&
                    // With a name matching the magic object name
                    path.node.value.expression.object.name === magicObject &&
                    // And the property is an identifier
                    t.isIdentifier(path.node.value.expression.property)
                ) {
                    // The testid is the name of that property
                    const testId = path.node.value.expression.property.name;

                    // Get existing ids, and as long as there's no dupe, add this one
                    const ids: Set<string> = state.file.get(TEST_IDS);
                    if (ids.has(testId)) {
                        throw path.buildCodeFrameError(
                            `Duplicate test id: ${testId}}`
                        );
                    }
                    ids.add(testId);

                    // Replace the whole attribute node with a string literal attribute value
                    path.replaceWith(
                        t.jsxAttribute(
                            t.jsxIdentifier(jsxAttribute),
                            t.jsxExpressionContainer(t.stringLiteral(testId))
                        )
                    );
                }
            }
        },
        /**
         * Once we've traversed the file, if we have found any ids then write
         * them to a json file, with a path that corresponds to the original
         * location of the file, but relative the the `testIdsDir`
         */
        post(file) {
            const { extractTo } = this.opts || { extractTo: false };
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
};

export default plugin;
