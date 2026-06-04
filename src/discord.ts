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

async function plsConnect() {
  while (true) {
    try {
      if (client.isConnected) return;

      await client.connect();
      let username = chalk.dim("@") + client.user?.username;
      if (client.user?.discriminator != "0") {
        username = client.user?.username +
          chalk.dim(`#${client.user?.discriminator}`);
      }
      log.success(chalk.bold.green("Ready!"), username);
    } catch (e) {
      log.error("Failed to connect.");
      log.debug(e);
    }
    await $.sleep(5000);
  }
}
await plsConnect();

let retrying = false; // Debounce
async function checkRetry() {
  if (retrying) return;
  if (client.isConnected) return;
  retrying = true;
  log.error("Disconnected!");
  await plsConnect();
  retrying = false;
}
// Doesn't work :(
setInterval(checkRetry, 1_000);

export async function getDiscordUser() {
  while (!client.user) await $.sleep(0);
  return client.user;
}

export function setActivity(activity?: SetActivity | null): void {
  // Do nothing if null
  if (activity === null) return;

  if (activity) client.user?.setActivity(activity);
  else client.user?.clearActivity();
}
