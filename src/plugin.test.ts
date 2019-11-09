import { transform, types } from "@babel/core";
import plugin, { PluginOpts } from "./plugin";

const runSnapshot = (opts?: PluginOpts) => (code: TemplateStringsArray) => {
    expect(
        transform(code[0], { plugins: [[plugin, opts]] })!.code
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
});
