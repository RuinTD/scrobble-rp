import * as z from "zod";
import { ButtonType, Provider } from "./V8.ts";
export { ButtonType, Provider };

export const OtherConfig = z.object({
  any: z.boolean().default(false),
  listening: z.boolean().default(false),
  custom: z
    .array(z.string('"" are required for app IDs'))
    .prefault([])
    .transform((v) => {
      if (v.length == 0) return ["12345678901234567890"];
      return v;
    }),
});

export const check = z.object({ _VERSION: z.literal(9) });
export const ConfigV9 = z.object({
  _VERSION: z.literal(9),

  provider: Provider,
  username: z.string(),

  smallImage: z.enum(["logo", "profile", "none"]).default("none"),

  showElapsedTime: z.boolean().default(false),
  showRemainingTime: z.boolean().default(false),

  button1: ButtonType.default("none"),
  button2: ButtonType.default("none"),

  nintendoMusic: z
    .object({
      useSongArt: z.boolean().default(false),
      formatSplatoonArtist: z.boolean().default(false),
    })
    .prefault({}),

  disableOnPresence: OtherConfig.prefault({}),

  lastFmApiKey: z.string().optional(),
  discordClientId: z.string().optional(),
  listenBrainzAPIURL: z.string().optional(),
});
export default ConfigV9;
