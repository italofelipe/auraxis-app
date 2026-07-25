import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  AUTHORIZED_DIRECT_DEPTH_FILES,
  findDirectDepthViolations,
} from "./check-visual-surface-governance.cjs";

const makeRoot = (): string => fs.mkdtempSync(path.join(os.tmpdir(), "visual-depth-"));

const writeSource = (root: string, relativePath: string, source: string): void => {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, source);
};

describe("visual surface governance", () => {
  it("rejects direct shadows in content components", () => {
    const root = makeRoot();
    writeSource(
      root,
      "features/demo/card.tsx",
      "export const style = { shadowOpacity: 0.4, elevation: 8 };",
    );
    expect(findDirectDepthViolations(root)).toEqual([
      "direct shadow/elevation outside an authorized component: features/demo/card.tsx:1",
    ]);
  });

  it("allows semantic tokens and the explicit structural allowlist", () => {
    const root = makeRoot();
    writeSource(
      root,
      "features/demo/card.tsx",
      "export const style = { ...semanticShadows.raised };",
    );
    const authorized = [...AUTHORIZED_DIRECT_DEPTH_FILES][0]!;
    writeSource(root, authorized, "export const style = { elevation: 1 };");
    expect(findDirectDepthViolations(root)).toEqual([]);
  });
});
