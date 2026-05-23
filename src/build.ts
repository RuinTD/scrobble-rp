import $ from "dax";

const targets: Record<string, string> = {
  "x86_64-pc-windows-msvc": "windows-x64",
  // "bun-windows-arm64": "windows-arm64",
  "x86_64-apple-darwin": "macos-x64",
  "aarch64-apple-darwin": "macos-arm64",
  "x86_64-unknown-linux-gnu": "linux-x64",
  "aarch64-unknown-linux-gnu": "linux-arm64",
};

for (const [target, suffix] of Object.entries(targets)) {
  await $`deno compile --target ${target} -o ./out/ScrobbleRP-${suffix} -A ./src/index.ts`;
  // await Bun.build({
  //   entrypoints: ["./src/index.ts"],
  //   compile: {
  //     target,
  //     outfile: `./out/ScrobbleRP-${suffix}`,
  //   },
  //   minify: true,
  // });
}
