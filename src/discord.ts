import { Client, type SetActivity } from "@xhayper/discord-rpc";
import chalk from "chalk";
import { consola } from "consola";
import $ from "dax";
import { clientID } from "./config/index.ts";

const log = consola.withTag(chalk.hex("#5865f2")("Discord"));

export const client = new Client({
  clientId: clientID,
});

// client.on("connect", () => {
//   console.log(
//     discordWord,
//     colors.bold.green("Ready!"),
//     client.user?.username + colors.gray(`#${client.user?.discriminator}`)
//   );
// });

// client.on("disconnected", () => {
//   console.log(discordWord, chalk.redBright("Disconnected"));
// });

let isConnecting = false;

async function plsConnect() {
  if (client.isConnected || isConnecting) return;
  isConnecting = true;

  while (!client.isConnected) {
    try {
      await client.connect();
      let username = chalk.dim("@") + client.user?.username;
      if (client.user?.discriminator && client.user?.discriminator != "0") {
        username =
          client.user?.username + chalk.dim(`#${client.user?.discriminator}`);
      }
      log.success(chalk.bold.green("Ready!"), username);
      break;
    } catch (e) {
      log.error("Failed to connect.");
      log.debug(e);
      await $.sleep(5000);
    }
  }

  isConnecting = false;
}

client.on("disconnected", () => {
  log.error("Disconnected!");
  plsConnect();
});

plsConnect();

setInterval(() => {
  if (!client.isConnected && !isConnecting) {
    plsConnect();
  }
}, 5_000);

export async function getDiscordUser() {
  while (!client.user) await $.sleep(100);
  return client.user;
}

export async function setActivity(
  activity?: SetActivity | null,
): Promise<void> {
  // Do nothing if null
  if (activity === null) return;
  if (!client.isConnected) return;

  try {
    if (activity) await client.user?.setActivity(activity);
    else await client.user?.clearActivity();
  } catch (err) {
    log.debug("Failed to set activity:", err);
  }
}
