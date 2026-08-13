import assert from "node:assert/strict";
import test from "node:test";
import { getImageDimensions } from "./imageDimensions.js";

test("reads bounded PNG dimensions", () => {
  const buffer = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(buffer);
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(640, 16);
  buffer.writeUInt32BE(800, 20);
  assert.deepEqual(getImageDimensions(buffer, "image/png"), { width: 640, height: 800 });
});

test("rejects content whose bytes do not match its declared image type", () => {
  assert.throws(() => getImageDimensions(Buffer.from("not an image"), "image/jpeg"));
});
