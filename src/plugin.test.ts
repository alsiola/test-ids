import { transform, types } from "@babel/core";
import plugin, { PluginOpts } from "./plugin";

const runSnapshot = (opts?: PluginOpts) => (code: TemplateStringsArray) => {
    expect(
        transform(code[0], {
            plugins: ["@babel/transform-react-jsx", [plugin, opts]]
        })!.code
    ).toMatchSnapshot();
};

describe("plugin", () => {
    it("replaces $TestId in properties", () => {
        runSnapshot()`
          const x = {
              prop: $TestId.Hello
          }
        `;
    });

    it("replaces $TestId in properties with custom magic object", () => {
        runSnapshot({ magicObject: "$Alex" })`
          const x = {
              prop: $Alex.Hello
          }
        `;
    });

    it("replaces $TestId in jsx attributes", () => {
        runSnapshot()`
          const x = (
              <div data-testid={$TestId.One} id={$TestId.Two} />
          )
        `;
    });

    it("throws if naked magicObject is used", () => {
        expect(
            () => runSnapshot()`
            const x = {
                prop: $TestId
            }
        `
        ).toThrowErrorMatchingSnapshot();
    });

    it("throws if naked magicObject is used as auto property", () => {
        expect(
            () => runSnapshot()`
            const x = {
                $TestId
            }
        `
        ).toThrowErrorMatchingSnapshot();
    });

    it("throws if naked magicObject is in jsx attribute", () => {
        expect(
            () => runSnapshot()`
            const x = (
                <div data-testid={$TestId} />
            )
        `
        ).toThrowErrorMatchingSnapshot();
    });
});
