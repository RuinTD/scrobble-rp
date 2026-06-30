import * as ss from "@ruintd/standard-utils";
import $ from "dax";
import { flattenObject } from "es-toolkit";
import { format } from "prettier";
import * as YAML from "yaml";
import { Config } from "./const.ts";
import exampleText from "./example.yml" with { type: "text" };

// console.log(exampleText);
const example = YAML.parse(exampleText);
ss.assertSync(Config, example);

function extraIndent(str: string, indent: number) {
  return str.replaceAll(/^/gm, " ".repeat(indent));
}

type DotPrefix<P extends string> = P extends "" ? "" : `${P}.`;
type Paths<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends object
    ? Paths<T[K], `${DotPrefix<P>}${K}`>
    : `${DotPrefix<P>}${K}`;
}[keyof T & string];
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T ? PathValue<T[K], Rest>
  : never
  : P extends keyof T ? T[P]
  : never;
type FlatObject<T> = {
  [P in Paths<T>]: PathValue<T, P>;
};

export async function parse(config: Config) {
  const flat = flattenObject(config) as FlatObject<Config>;
  function line(k: keyof typeof flat, example?: string) {
    const val = flat[k];
    const key = k.split(".").pop();
    if (val === undefined && example !== undefined) {
      return `# ${YAML.stringify(key).trimEnd()}: ${
        YAML.stringify(example).trimEnd()
      }`;
    }
    return `${YAML.stringify(key).trimEnd()}: ${YAML.stringify(val).trimEnd()}`;
  }

  const text = $.dedent`
    ${line("_VERSION")} # Do not touch this line!

    ${line("provider")} # lastfm, listenbrainz
    ${line("username")}

    # What to show on the small image and text
    ${line("smallImage")}
    # logo: Provider logo
    # profile: Profile picture from provider
    # none: No small image (also disables small text)
    ${line("smallText")}
    # username: "Scrobbling as [Username] on [Provider]"
    # provider: "Scrobbling on [Provider]"
    # none: No small image

    # Show "elapsed" time since start of song
    # and "remaining" time until end of song (if available)
    # If both are enabled, Discord shows a progress bar
    # Note that both values tend to be inaccurate, especially if you pause
    ${line("showElapsedTime")}
    ${line("showRemainingTime")}

    # Buttons to show on the Rich Presence
    # NOTE: You can't see the buttons on your own profile
    ${line("button1")}
    ${line("button2")}
    # song: "View Song" (links to the scrobble provider)
    # songlink:
    #   If possible, links to Songlink/Odesli
    #   Otherwise, links to the scrobble provider
    # song-lastfm: Links to Last.FM
    # song-listenbrainz: "Listen to Song"
    #   Links to an instant playlist on ListenBrainz
    # song-musicbrainz: links to MusicBrainz
    # profile: "<Provider> Profile"
    # github: "Scrobble Rich Presence"
    # none: No button

    # Special integration with Nintendo Music
    # Requires songs to be scrobbled as by "Nintendo Co., Ltd."
    # Works with Pano Scrobbler
    nintendoMusic:
      # Uses per-song art instead of album art
      ${line("nintendoMusic.useSongArt")}
      # Formats Splatoon tracks into something like this:
      #   Calamari Inkantation
      #   by Squid Sisters
      #   Splatoon
      ${line("nintendoMusic.formatSplatoonArtist")}

    # Disable when another app's Rich Presence is detected
    # Requires joining https://discord.gg/lanyard
    disableOnPresence:
      ${line("disableOnPresence.any")}
      ${line("disableOnPresence.listening")}
      custom: # Application IDs or names (case-insensitive)
        # "" is required for IDs
    ${extraIndent(YAML.stringify(config.disableOnPresence.custom, null, 2), 4)}

    # ADVANCED
    # You probably don't need to touch these

    ${line("lastFmApiKey", "")}
    ${line("discordClientId", "")}
    ${line("listenBrainzAPIURL", "http://localhost:8100")}
  `;
  // console.log(text);
  return await format(text, { parser: "yaml" });
}

export default parse;

if (import.meta.main) {
  const formatted = await parse(example);
  console.log(formatted);

  await $.path("config.example.yml").write(formatted);
}
