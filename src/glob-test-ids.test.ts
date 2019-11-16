import { globTestIds } from "./glob-test-ids";

const setupMocks = ({ testIds }: { testIds: any }) => {
    const fs = {
        readFileSync: jest.fn().mockReturnValue(JSON.stringify(testIds)),
        mkdirpSync: jest.fn(),
        writeFileSync: jest.fn()
    };
    const path = {
        join: jest.fn().mockReturnValue("outfile"),
        dirname: jest.fn().mockReturnValue("dirname")
    };
    const glob = {
        sync: jest.fn().mockReturnValue(["filename"])
    };

    const fn = globTestIds({ fs, glob, path } as any);

    return {
        fs,
        path,
        glob,
        fn
    };
};

describe("globTestIds", () => {
    it("reads all test ids and writes to json file", () => {
        const { fs, path, glob, fn } = setupMocks({ testIds: ["test-id"] });

        fn({
            idsLocation: "./test",
            output: "./master.json",
            cwd: "/test/dir/"
        });

        expect(fs.readFileSync.mock.calls).toMatchSnapshot("fs.readFileSync");
        expect(fs.mkdirpSync.mock.calls).toMatchSnapshot("fs.mkdirpSync");
        expect(fs.writeFileSync.mock.calls).toMatchSnapshot("fs.writeFileSync");
        expect(path.join.mock.calls).toMatchSnapshot("path.join");
        expect(path.dirname.mock.calls).toMatchSnapshot("path.dirname");
        expect(glob.sync.mock.calls).toMatchSnapshot("glob.sync");
    });

    it("throws if there are duplicate test ids", () => {
        const { fn } = setupMocks({
            testIds: ["test-id", "test-id"]
        });

        expect(() =>
            fn({
                idsLocation: "./test",
                output: "./master.json",
                cwd: "/test/dir/"
            })
        ).toThrowErrorMatchingSnapshot();
    });
});
