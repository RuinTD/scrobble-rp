import { assert, assertEquals } from "@std/assert";
import $ from "dax";
import * as YAML from "yaml";
import * as z from "zod";
import { Config } from "./const.ts";
import exampleText from "./example.yml" with { type: "text" };
import parseTemplate from "./template.ts";

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
