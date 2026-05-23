import { assert, assertEquals } from "@std/assert";
import * as YAML from "yaml";
import { Config } from "./const.ts";
import parseTemplate from "./template.ts";
import exampleText from "./example.yml" with { type: "text" };
import * as z from "zod";
import $ from "dax";

const example = YAML.parse(exampleText);

Deno.test("example generated", async () => {
  const exampleFile = await $.path("config.example.yml").readText();
  const expected = await parseTemplate(example);
  assertEquals(exampleFile, expected);
});

Deno.test("example matches config", async () => {
  const example = z
    .record(z.string(), z.unknown())
    .parse(YAML.parse(await $.path("config.example.yml").readText()));
  example.username = "example";
  assert(Config.parse(example));
});
