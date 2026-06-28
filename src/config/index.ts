import * as process from "node:process";
import EnterPrompt from "@ruintd/inquirer-enter";
import * as ss from "@ruintd/standard-utils";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import chalk from "chalk";
import { getLogger } from "../lib/logger.ts";
import $ from "dax";
import { isEqual } from "es-toolkit";
import YAML from "yaml";
import {
  AnyConfig,
  ButtonType,
  Config,
  Migrations,
  OtherConfig,
  Provider,
} from "./const.ts";
import parseTemplate from "./template.ts";

export { ButtonType, Config, OtherConfig, Provider };

const log = getLogger("Config");
const confFile = $.path("config.yml");

try {
  // const json = JSON.parse(await fs.readFile("config.json", "utf-8"));
  const confJson = $.path("config.json");
  const json = await confJson.readJson();
  await confFile.write(YAML.stringify(json));
  await confJson.rename("config.json.bak");
  log.info("Converted config.json to config.yml");
  log.info("Old config backed up to config.json.bak");
} catch {
  //
}

let oldFile: string;
try {
  oldFile = await confFile.readText();
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
    const bakFile = $.path("config.yml.bak");
    await confFile.write(newFile);
    log.info("Updated config.yml");
    await bakFile.write(oldFile);
    log.info(`Old config backed up to ${bakFile}`);
  }
} catch (e) {
  if (e instanceof ss.SchemaError) {
    log.error(chalk.bold("Error parsing config") + "\n" + ss.prettifyError(e));
  } else log.error("Error parsing config.yml", e);
  process.exit();
}

export const lastFmApiKey = config.lastFmApiKey ||
  "3b64424cee4803202edd52b060297958";
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
