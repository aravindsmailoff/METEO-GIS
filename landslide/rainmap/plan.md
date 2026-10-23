# FloodWatch — Community Flood Safety

## Approved implementation plan

### Product scope and trust boundaries

Build a citizen-first Expo mobile app for Android and iOS, with the managed Expo Web preview as an additional review surface. The interface will start in a Chennai, Tamil Nadu demonstration area and let a resident choose a district or locality in **My Area**. The opening screen will put a pan-and-zoom map at the center, with map and overlay controls, a persistent **NEED HELP** action, and bottom-sheet panels for forecasts, reports, reservoirs, impacts, contacts, and the public dashboard.

This first build is an **interactive prototype**, not an emergency service. No verified IMD/OpenWeatherMap feed, official dam telemetry, agency dispatch workflow, or contact directory has been configured. Rainfall figures, dam levels, downstream ETAs, evacuation routes, affected-population estimates, district impact polygons, and responder/camp pins will therefore be labeled **Demo data—not an official alert**. The app will not claim that an emergency report reaches an authority or that help has been dispatched. Report submission and tracking will be demonstrated and saved on the current device only. Volunteer/authority views may demonstrate the intended workflow, but will not be presented as authenticated, access-controlled operator tools.

Connecting verified feeds, genuine cross-user report sharing, secure role access, official push alerts, and responder coordination is a later production integration requiring provider/agency choices and operational approval. The demo should not be used to make safety or evacuation decisions.

### Planned app behavior

- **Map first:** Render a dark-styled Google Static Maps image through the project's managed Maps proxy, with React Native/SVG layers for sample rain intensity, high-risk areas, infrastructure, reports, reservoirs, relief locations, and evacuation routes. Tapping a map marker opens a clear information sheet; pan, zoom, and layer controls remain reachable above the map. Retain the map image's Google attribution. Where connectivity is lost, show a local schematic map fallback and the last cached alert snapshot with its saved time.
- **Rain and impacts:** Provide selectable 6h / 12h / 24h / 48h windows, a green-to-yellow-to-orange-to-red rainfall legend, sample district comparisons, threshold banners, and an impact sheet for roads, bridges, waterlogging-prone areas, and illustrative population estimates. Risk indicators will combine color with labels/icons so meaning is not encoded by color alone.
- **Reservoirs and downstream scenarios:** Show sample Chennai/Tamil Nadu reservoir pins with capacity percentage, inflow/outflow, a fill-history sparkline, and Safe / Watch / Warning / Danger state. Let a user open a clearly labeled illustrative gate-release scenario, inspect affected places and estimated arrival times, and see sample safe areas, camps, and an evacuation route.
- **Help and damage reports:** Keep **NEED HELP** visible. A report flow will capture flood / stuck / medical / infrastructure damage, a selected or pinned location, description, and optional photo attachment. Reports are pinned and tracked in local app state/device storage only. A separate damage flow will distinguish a broken road or flooded bridge. The nearby-contact sheet will distinguish verified contact information from examples rather than imply an unverified local directory is real.
- **Dashboard and preferences:** Show district rain summaries, locally active report counts, warning/danger reservoir counts, infrastructure report counts, an affected-population estimate, and a simple rainfall trend graphic. **My Area** will personalize which demo data and banners are visible. A language switch will localize primary actions and safety-critical interface strings in English and Tamil.
- **Offline and motion:** Cache the last-known alert snapshot and locally created reports with a timestamp. Animate panels and banners with short, calm transitions; use restrained marker pulses and avoid motion as the only way to convey urgency.

### Implementation approach

Use the already initialized fixed Expo Router / React Native / TypeScript / NativeWind starter and preserve its existing app identifiers, backend scaffolding, and package manager. Do not replace the starter with a web-only app. Current research identifies the named references as web component/source collections, Lit custom elements, paid web animation assets, or browser motion editors—not direct Expo-native UI kits. Use their ideas only as references: React Bits' spotlight/status cards, Magic UI's animated lists and gauges, ARC UI's semantic alert bars and sheets, Planes' segmented controls and activity feeds, Watermelon UI's crisp component hierarchy, Scrolltide's scroll-led composition, and the restrained motion direction from Animos, Swishy, Animaster, Kokonut, and Smooth UI. Re-create selected patterns with the existing React Native views, `Animated`, SVG, and Expo-compatible `expo-linear-gradient`; do not add web-only DOM components or a WebView for core app flows. Render Google Static Maps images through the platform Maps proxy using a bounded `/api/maps/static` route on the existing API server; keep `MANUS_API_KEY` server-side and use only the configured public API base in the mobile client. Retain Google attribution, SVG/React Native overlays, map pan/zoom, and the local schematic fallback. Keep reports on-device and do not write emergency reports into the managed database shared by development and production.

UI reference sources: [React Bits](https://reactbits.dev/get-started/installation), [Magic UI](https://magicui.design/docs), [ARC UI](https://arcui.dev/docs/frameworks), [Planes](https://useplanes.com/components/introduction), [Watermelon UI framework support](https://ui.watermelon.sh/framework-support), [Scrolltide components](https://www.scrolltide.co/components), [Kokonut UI](https://kokonutui.com/), and [SmoothUI](https://smoothui.dev/docs/components) inform visual/component patterns. [Animos](https://animos.app/), [Swishy](https://www.swishy.ai/), and [Animaster Lib](https://animmasterlib.dev/) inform motion ideas. Their documented implementations target web or motion-design export rather than Expo-native components; adapt patterns using the existing mobile stack only.

Principal project areas:

- `app/(tabs)/`: map-first home, dashboard, and My Area tab screens and navigation.
- `components/flood/`: shared native typography/surfaces/buttons, readable alert/status bars, map controls, focused location/report sheets, reservoir gauges, managed static-map image, offline schematic, and bilingual chart elements.
- `lib/flood/`: clearly identified demo fixtures, map-coordinate helpers, local report state, and AsyncStorage-backed alert/report cache.
- `lib/i18n/`: English and Tamil labels and safety copy.
- `assets/images/`: distinct FloodWatch launcher, splash, adaptive, and web icons, preserving the starter’s native configuration.
- `server/_core/index.ts`: add a bounded, read-only map-image proxy route that keeps the server Maps credential private. `drizzle/` and shared demo/production database records remain untouched; no operational emergency API will be implied.

### Design direction

Use the user-requested contemporary UI references and the captured 390×844 phone screens as the style anchor. The current screens overstack the map header, alert and layer controls; show oversized hazard circles; duplicate the help action; hide tab labels; clip horizontal metrics; and let chart notes collide with labels. The redesign must correct those concrete issues rather than just apply more gradients.

- **Design Movement:** Contemporary cartographic product UI: high-information map craft, editorial mobile typography, and touch-first surfaces. Use current app conventions without turning safety information into decorative motion.
- **Core Principles:** Keep the map dominant and readable; simplify and de-duplicate overlays; make urgent and demo status unmistakable; design for one-handed use and English/Tamil wrapping.
- **Color Philosophy:** Retain a deep ink map canvas for night-time legibility, but bring more distinction and warmth to panels: a bright glacier/ice-blue action color, clean near-white text, and clear coral/amber/green severity accents. Reduce low-contrast gray microcopy; every risk color also gets a label and icon.
- **Layout Paradigm:** Full-bleed map with a short top status stack, a small set of layer chips, compact floating map controls, one forecast dock, and one always-visible **NEED HELP** action. Secondary screens use scroll-led editorial sections and stable vertical feeds; no clipped horizontal metric carousels or repeated emergency buttons.
- **Signature Elements:** A single high-contrast alert ribbon with timestamp/demo state; a large readable rainfall or reservoir number with a compact ring/line visual; a clearly labeled segmented time selector and a focus sheet that keeps the selected map location visible.
- **Interaction Philosophy:** Native touch targets are at least 44dp, selected states are clear, common actions are one tap from the map, and motion never blocks the urgent action. Text, labels, and static values remain complete with reduced motion enabled.
- **Animation:** Use short 160–220ms native opacity/translation/spring transitions for sheets, section entrances, and selection feedback. Avoid always-looping map effects, pointer-only spotlights, animated warning text, or anything that delays the help flow; respect reduced-motion settings.
- **Typography System:** Use platform-native system sans fonts for reliable English/Tamil rendering. Use 24–32pt page headlines, 30–44pt key readings, 14–16pt core body text, and 11–12pt secondary metadata; no essential safety wording below 12pt. Wrap labels instead of truncating them.
- **Brand Essence:** “A flood map for everyday decisions before the rain reaches your doorstep.” Personality: calm, local, direct.
- **Brand Voice:** Direct, reassuring, never falsely certain. Examples: “Water rising upstream. Open the impact view.” and “Demo signal — not an official warning.”
- **Wordmark & Logo:** Keep the existing river bend inside a location-drop/shield mark; pair it with a crisp text wordmark and do not bake small text into the icon.
- **Signature Brand Color:** Glacier teal `#36D6C2`, used as a restrained navigation/action accent against ink and clear risk colors.

### Build workflow

Continue in the existing accepted Expo project; keep all flood-safety behavior and illustrative/local-only boundaries unchanged. Rebuild the visible UI hierarchy across Map, Impact, Reports, and My Area; keep map imagery and Google attribution; localize new labels in English and Tamil; and eliminate clipped/truncated content at phone widths. Reuse Expo-compatible dependencies already in the project, start no replacement service, and do not alter the fixed runtime ports. Leave publication and native release-build claims for their respective platform outcomes; a working Preview is not evidence of an official live emergency service.

## User approval

Approved: **Chennai, Tamil Nadu as the initial demo area**, with all weather, reservoir, impact, route, contact, and responder workflow data visibly labeled as demonstration-only. This prototype provides no verified live data and no real emergency dispatch; distress reports remain on the current device. The app is not for safety or evacuation decisions.
