import chalk from "chalk";
import * as util from "node:util";

enum LogLevel {
  ERROR,
  WARN,
  LOG,
  INFO,
  DEBUG,
  TRACE,
  VERBOSE,
}

type LogFn = (...data: unknown[]) => void;
type Logger = Record<Lowercase<keyof typeof LogLevel>, LogFn>;

const levelPrefixes: Record<LogLevel, string> = {
  [LogLevel.ERROR]: chalk.red("ERROR"),
  [LogLevel.WARN]: chalk.yellow("WARN "),
  [LogLevel.LOG]: "",
  [LogLevel.INFO]: chalk.cyan("INFO "),
  [LogLevel.DEBUG]: chalk.blue("DEBUG"),
  [LogLevel.TRACE]: chalk.gray("TRACE"),
  [LogLevel.VERBOSE]: chalk.gray("VERB "),
};

const levelFns: Record<LogLevel, LogFn> = {
  [LogLevel.ERROR]: console.error,
  [LogLevel.WARN]: console.warn,
  [LogLevel.LOG]: console.log,
  [LogLevel.INFO]: console.info,
  [LogLevel.DEBUG]: console.debug,
  [LogLevel.TRACE]: console.debug,
  [LogLevel.VERBOSE]: console.debug,
};

const currentLevel = (() => {
  const level = process.env.LOG_LEVEL?.toUpperCase() || "";
  if (level in LogLevel) return LogLevel[level as keyof typeof LogLevel];
  return LogLevel.INFO;
})();

export function getLogger(prefix?: string): Logger {
  return {
    error: (...data: unknown[]) => rawLog(LogLevel.ERROR, prefix, ...data),
    warn: (...data: unknown[]) => rawLog(LogLevel.WARN, prefix, ...data),
    log: (...data: unknown[]) => rawLog(LogLevel.LOG, prefix, ...data),
    info: (...data: unknown[]) => rawLog(LogLevel.INFO, prefix, ...data),
    debug: (...data: unknown[]) => rawLog(LogLevel.DEBUG, prefix, ...data),
    trace: (...data: unknown[]) => rawLog(LogLevel.TRACE, prefix, ...data),
    verbose: (...data: unknown[]) => rawLog(LogLevel.VERBOSE, prefix, ...data),
  };
}

function rawLog(level?: LogLevel, prefix?: string, ...data: unknown[]) {
  const prefixes: string[] = [];
  let logFn: LogFn = console.log;

  if (level != undefined) {
    if (level > currentLevel) return;
    logFn = levelFns[level];

    const levelPrefix = levelPrefixes[level];
    if (levelPrefix) prefixes.push(chalk.bold(levelPrefix));
  }
  if (prefix) prefixes.push(chalk.gray.bold(`[${prefix}]`));

  logFn("%s", ...prefixes, util.format(...data));
}

const defaultLogger = getLogger();
export const { error, warn, log, info, debug, trace, verbose } = defaultLogger;
