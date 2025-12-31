import { Command } from "commander";
import { addCommand } from "./commands/add.js";
import { buildCommand } from "./commands/build.js";
import { initCommand } from "./commands/init.js";
import packageJson from "../package.json" assert { type: "json" };

const program = new Command()
  .name("reborn-ui")
  .description("Reborn UI - 组件安装与 registry 辅助 CLI")
  .version(packageJson.version);

program.addCommand(initCommand());
program.addCommand(addCommand());
program.addCommand(buildCommand());

await program.parseAsync(process.argv);


