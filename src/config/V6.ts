import * as z from "zod";
import { ButtonType, OtherConfig, Provider } from "./V5.ts";
export { ButtonType, OtherConfig, Provider };
import ConfigV7 from "./V7.ts";

export const check = z.object({ _VERSION: z.literal(6) });
export const ConfigV6 = z.object({
  _VERSION: z.literal(6),

  provider: Provider,
  username: z.string(),

  smallImage: z.enum(["logo", "profile", "none"]).default("none"),

  button1: ButtonType,
  button2: ButtonType,

  useNintendoMusicArt: z.boolean().default(true),
  useNintendoMusicFormat: z.boolean().default(true),

  disableOnPresence: OtherConfig.prefault({}),

  lastFmApiKey: z.string().optional(),
  discordClientId: z.string().optional(),
  listenBrainzAPIURL: z.string().optional(),
});
export default ConfigV6;

export const migrate = ConfigV6.transform((config) =>
  ConfigV7.decode({
    ...config,
    _VERSION: 7,
    showDuration: false,
  })
);
