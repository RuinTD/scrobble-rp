import * as z from "zod";
import { ButtonType, OtherConfig, Provider } from "./V9.ts";
export { ButtonType, OtherConfig, Provider };

export const check = z.object({ _VERSION: z.literal(10) });
export const ConfigV10 = z.object({
  _VERSION: z.literal(10),

  provider: Provider,
  username: z.string(),

  lbUserToken: z.uuidv4().optional(),

  smallImage: z.enum(["logo", "profile", "none"]).default("none"),
  smallText: z.enum(["username", "provider", "none"]).default("none"),

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
export default ConfigV10;
