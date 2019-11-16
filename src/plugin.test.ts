import { transform } from "@babel/core";
import plugin, { PluginOpts } from "./plugin";

const transformCode = (opts?: PluginOpts) => (
    code: TemplateStringsArray
): string => {
    return transform(code[0], {
        plugins: ["@babel/transform-react-jsx", [plugin, opts]]
    })!.code!;
};

describe("plugin", () => {
    it("replaces $TestId in properties", () => {
        expect(
            transformCode()`
          const x = {
              prop: $TestId.Hello
          }
        `
        ).toMatchSnapshot();
    });

    it("replaces $TestId in properties with custom magic object", () => {
        expect(
            transformCode({ magicObject: "$Alex" })`
          const x = {
              prop: $Alex.Hello
          }
        `
        ).toMatchSnapshot();
    });

    it("replaces $TestId in jsx attributes", () => {
        expect(
            transformCode()`
          const x = (
              <div data-testid={$TestId.One} id={$TestId.Two} />
          )
        `
        ).toMatchSnapshot();
    });

    it("throws if naked magicObject is used", () => {
        expect(
            () => transformCode()`
            const x = {
                prop: $TestId
            }
        `
        ).toThrowErrorMatchingSnapshot();
    });

    it("throws if naked magicObject is used as auto property", () => {
        expect(
            () => transformCode()`
            const x = {
                $TestId
            }
        `
        ).toThrowErrorMatchingSnapshot();
    });

    it("throws if naked magicObject is in jsx attribute", () => {
        expect(
            () => transformCode()`
            const x = (
                <div data-testid={$TestId} />
            )
        `
        ).toThrowErrorMatchingSnapshot();
    });

    it("throws if duplicate ids are used", () => {
        expect(
            () => transformCode()`
            const x = (
                <>
                    <div data-testid={$TestId.Hello} />
                    <div data-testid={$TestId.Hello} />
                </>
            )
        `
        ).toThrowErrorMatchingSnapshot();
    });

    it("writes found testIds", () => {
        const fs = {
            mkdirpSync: jest.fn(),
            writeFileSync: jest.fn()
        };

        transformCode({ fs: fs as any, extractTo: "test" })`
            const x = {
                prop: $TestId.Hello,
                prop2: $TestId.GoodBye
            }
        `;

        expect(fs.writeFileSync.mock.calls).toMatchSnapshot();
    });
});
