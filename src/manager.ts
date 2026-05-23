import chalk from "chalk";
import { StartupRun } from "startup-run";
import { confirm, select } from "@inquirer/prompts";
import EnterPrompt from "@ruintd/inquirer-enter";
import { consola } from "consola";
import $ from "dax";

const run = StartupRun.create("Scrobble Rich Presence", {
  command: "bun",
  args: ["./src/index.ts"],
});

while (true) {
  console.clear();
  consola.log(chalk.bold.underline("Scrobble Rich Presence"));
  consola.log("");
  consola.info(
    "Run on startup is currently:",
    (await run.isEnabled()) ? chalk.green("Enabled") : chalk.red("Disabled"),
  );

  const choice = await select({
    message: "What do you want to do?",
    choices: [
      {
        name: "Enable",
        value: "enable",
        description: "Enable run on startup and start the background process",
      },
      {
        name: "Disable",
        value: "disable",
        description: "Disable run on startup and stop the background process",
      },
      {
        name: "Update",
        value: "update",
        description: "Updates the program and restarts it if running",
      },
      { name: "Quit", value: "quit" },
    ],
  });

  console.clear();
  switch (choice) {
    case "enable": {
      await run.enable();
      await run.start();
      break;
    }
    case "disable": {
      await run.stop();
      await run.disable();
      break;
    }
    case "update": {
      if (!(await $.which("git"))) {
        consola.error(chalk.red("Git not found"));
        await pause();
        break;
      }
      if (!(await $.path(".git").exists())) {
        consola.error(chalk.red("Not in a Git repository"));
        consola.log(
          "Please clone the GitHub repo instead of using Download ZIP",
        );
        await pause();
        break;
      }

      if (!(await confirm({ message: "Are you sure you want to update?" }))) {
        break;
      }

      await run.stop();

      try {
        consola.start(chalk.gray("Updating..."));
        await $`git pull`;

        consola.log(chalk.gray("Installing dependencies..."));
        await $`bun install`;

        if (await run.isEnabled()) {
          consola.log(chalk.gray("Restarting process..."));
          await run.start();
        }

        consola.success(
          chalk.bold.green("Updated!"),
          "Make sure Bun is up to date.",
        );
        consola.log("Manager will now close");
        await pause();
        process.exit();
      } catch (e) {
        consola.error(chalk.bold.red("Failed to update"));
        consola.log(e);
        await pause();
      }
      break;
    }
    case "quit":
      process.exit();
  }
}

async function pause() {
  await EnterPrompt({});
}
