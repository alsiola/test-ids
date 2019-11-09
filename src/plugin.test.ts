import { transform } from "@babel/core";
import plugin from "./plugin";

const runSnapshot = (code: TemplateStringsArray) => {
    expect(transform(code[0], { plugins: [plugin] })!.code).toMatchSnapshot();
};

describe("plugin", () => {
    it("replaces $TestId in properties", () => {
        runSnapshot`
          const x = {
              prop: $TestId.Hello
          }
        `;
    });
});
