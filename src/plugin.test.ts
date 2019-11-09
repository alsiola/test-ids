import { transform, types } from "@babel/core";
import plugin, { PluginOpts } from "./plugin";

const runSnapshot = (opts?: PluginOpts) => (code: TemplateStringsArray) => {
    expect(
        transform(code[0], { plugins: [plugin.bind({})] })!.code
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
});
