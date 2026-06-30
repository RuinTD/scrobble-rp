import * as z from "zod";

export const AnyConfig = z.object({ _VERSION: z.number() });
import CurrentConfig, {
  ButtonType,
  OtherConfig as OtherConfigSchema,
  Provider,
} from "./V10.ts";
export const Migrations = [
  await import("./V1.ts"),
  await import("./V2.ts"),
  await import("./V3.ts"),
  await import("./V4.ts"),
  await import("./V5.ts"),
  await import("./V6.ts"),
  await import("./V7.ts"),
  await import("./V8.ts"),
  await import("./V9.ts"),
];

export const Config = CurrentConfig;
export const OtherConfig = OtherConfigSchema;
export { ButtonType, Provider };
export type Config = z.infer<typeof CurrentConfig>;
export type OtherConfig = z.infer<typeof OtherConfigSchema>;
