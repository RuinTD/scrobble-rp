import { YAML } from "bun";
import * as fs from "node:fs/promises";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import * as process from "node:process";
import chalk from "chalk";
import * as ss from "@ruintd/standard-utils";
import parseTemplate from "./template.ts";
import {
  Config,
  OtherConfig,
  ButtonType,
  Provider,
  Migrations,
  AnyConfig,
} from "./const.ts";
import { isEqual } from "es-toolkit";
import { consola } from "consola";
import EnterPrompt from "../lib/EnterPrompt.ts";

export { Config, OtherConfig, ButtonType, Provider };

const log = consola.withTag("Config");

try {
  const json = JSON.parse(await fs.readFile("config.json", "utf-8"));
  await Bun.write("config.yml", YAML.stringify(json));
  await fs.rename("config.json", "config.json.bak");
  log.info("Converted config.json to config.yml");
  log.info("Old config backed up to config.json.bak");
} catch {
  //
}

let oldFile: string;
try {
  oldFile = await Bun.file("config.yml").text();
} catch {
  log.error(
    "Config not found. Please create config.yml, using config.example.yml as reference.",
  );
  await EnterPrompt({});
  process.exit();
}

let config: Config;
try {
  const oldConf = YAML.parse(oldFile);
  const newConf = await doMigrate(oldConf, Migrations);

  const oldConfV = await ss.parse(AnyConfig, oldConf);
  const newConfV = await ss.parse(AnyConfig, newConf);

  config = await ss.parse(Config, newConf);
  const newFile = await parseTemplate(config);

  if (!isEqual(oldConfV, newConfV)) {
    const bakFile = "config.yml.bak";
    await Bun.write("config.yml", newFile);
    log.info("Updated config.yml");
    await Bun.write(bakFile, oldFile);
    log.info(`Old config backed up to ${bakFile}`);
  }
} catch (e) {
  if (e instanceof ss.SchemaError) {
    log.error(chalk.bold("Error parsing config") + "\n" + ss.prettifyError(e));
  } else log.error("Error parsing config.yml", e);
  process.exit();
}

export const lastFmApiKey =
  config.lastFmApiKey || "3b64424cee4803202edd52b060297958";
export const clientID = config.discordClientId || "740140397162135563";
export default config;

interface MigModule<T extends StandardSchemaV1 = StandardSchemaV1> {
  default: StandardSchemaV1;
  check?: StandardSchemaV1;
  migrate: T;
  onSuccess?: (
    oldConf?: StandardSchemaV1.InferInput<T>,
    newConf?: StandardSchemaV1.InferOutput<T>,
  ) => void;
}

async function doMigrate(
  input: unknown,
  migrations: MigModule[],
): Promise<unknown> {
  let conf = input;
  for (const mig of migrations) {
    const oldConf = conf;

    if (mig.check) {
      const check = (await ss.safeParse(mig.check, conf)).success;
      if (!check) continue;
      conf = await ss.parse(mig.migrate, conf);
    } else {
      const out = await ss.safeParse(mig.migrate, conf);
      if (!out.success) continue;
      conf = out.value;
    }

    if (mig.onSuccess) mig.onSuccess(oldConf, conf);
  }
  return conf;
}
