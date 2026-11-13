// Terrain (experimental): the same song as Ridgeline, as one real 3D landscape. The song is a height field over (time, note):
// Ridgeline slices it by time, this draws the whole surface from a camera that can stand anywhere, lit, with a line on every
// row and along every note's lane. Turn the view to 90 degrees with only the note lines on and it is twelve ridges,
// one per note, with time along the screen. The mountains are built on the GPU from a texture of the track's chroma
// (terrain-gl.ts); this file is the camera, the clock, the colours and the knobs.
import { createGlow, createKeyHue, keyHueAt } from "./effects";
import { createConductor } from "./conductor";
import { accentLightness, colourSettings, familyHue, GREY, hslToRgb, palette, paletteAt } from "../colours";
import { sampleCurve, segmentAt, TrackAudioData } from "../audio-data";
import { Preset, PresetDefinition, publishDiagnostics } from "./types";
import { tune, tuneFeatures, tuneVersion } from "./tune";
import { createTerrainRenderer, TerrainRenderer } from "./terrain-gl";

// ---- the extras, in the order of their keys ---------------------------------------------------------
const FEATURES = {
	horizon: { name: "horizon glow", on: true },
	rows: { name: "row and bar lines", on: true },
	lanes: { name: "note lines", on: true },
	contours: { name: "contours", on: true },
	lit: { name: "light on the slopes", on: true },
	camera: { name: "camera", on: true },
	dust: { name: "dust", on: true },
	mirror: { name: "reflection", on: false },
	now: { name: "the line at now", on: true }
};
const FEATURE_KEYS = Object.values(FEATURES);
tuneFeatures("terrain", FEATURE_KEYS);
// module scope: create() reruns on every preset switch and would leave a listener behind each time
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
	window.addEventListener("visualizer-feature", (event: Event) => {
		const detail = (event as CustomEvent<{ preset: string | null; n: number } | null>).detail;
		const feature = detail && detail.preset === terrainPreset.id ? FEATURE_KEYS[detail.n - 1] : undefined;
		if (!feature) return;
		feature.on = !feature.on;
		if (typeof Spicetify !== "undefined") Spicetify.showNotification(`Terrain ${detail!.n}: ${feature.name} ${feature.on ? "ON" : "off"}`);
	});
}

// loudness read against this band, as in Ridgeline (the 5th to 95th percentile of the eased level)
const LATELY_QUIET = 0.154;
const LATELY_LOUD = 0.4899;
const LEAD_FULL = 0.15;
// the glow on the horizon: height (of the picture's height) and width (of its width)
const SKY_HEIGHT = 0.2;
const SKY_WIDTH = 0.55;
const MAX_ROWS = 1400;
const DEG = Math.PI / 180;

const K = tune(
	"terrain",
	{
		FUTURE_BEATS: [8, 2, 40, "beats of the future on screen", "time"],
		PAST_BEATS: [1.5, 0.5, 6, "beats of the past"],
		ROW_DETAIL: [4, 1, 16, "rows of mesh per beat"],
		CAM_YAW: [0, -100, 100, "view angle, degrees", "view"],
		CAM_PITCH: [24, 3, 85, "view height, degrees"],
		CAM_DIST: [7.5, 2, 30, "distance from the view's centre"],
		FOV: [45, 15, 100, "lens, degrees"],
		ORBIT: [0, 0, 60, "slow swing of the view, degrees", "camera"],
		SWAY: [1, 0, 3, "camera sway"],
		CAM_RESPONSE: [1, 0, 2, "how far loudness lifts the camera"],
		HEIGHT: [1.2, 0.2, 5, "mountain height", "shape"],
		WIDTH: [4, 1, 10, "terrain width"],
		LANE_SPAN: [0.6152, 0.1, 1, "how wide the pitch lanes spread"],
		HILL: [0.07583, 0.03, 0.5, "width of one note hill"],
		SMOOTH: [1.5, 0, 8, "smoothing along the line"],
		JAG: [0.35, 0, 1, "how jagged a sharp sound is"],
		RIDGE_LIMIT: [0.855, 0.3, 4, "tallest before rounding off"],
		FILL: [1, 0, 1, "how solid the mountains are", "light"],
		LIGHT: [1, 0, 2, "light on the slopes"],
		ROW_LINES: [1, 0, 3, "row and bar lines"],
		LANE_LINES: [1, 0, 3, "note lines"],
		CONTOUR_LIGHT: [0.6, 0, 2, "contour lines"],
		CONTOUR_COUNT: [8, 2, 40, "height of a contour step, in steps"],
		FOG: [0.45, 0, 1, "where the fog begins", "look"],
		GLOW: [1, 0, 2.5, "halo strength", "look"],
		LINE: [1, 0.4, 3, "thickness of the lines"],
		DUST_LIGHT: [1, 0, 3, "dust brightness"],
		MIRROR: [0.35, 0, 1, "reflection strength"],
		SKY_BRIGHT: [0.425, 0, 1, "glow brightness"]
	},
	{
		FUTURE_BEATS: "How much of the song ahead is on screen. Higher shows further into the future; the GPU does not mind many rows.",
		PAST_BEATS: "How much of the song just played stays in front of the line at now before it sinks away.",
		ROW_DETAIL: "How finely the surface is cut along time. Higher is smoother and costs the GPU more.",
		CAM_YAW: "Where the view stands round the terrain. Zero looks along the song from behind. Ninety looks from the side, so time runs across the screen; with only the note lines on that is twelve ridges, one per note.",
		CAM_PITCH: "How high the view looks down from. Low skims the ground; high looks down on a map.",
		CAM_DIST: "How far the view stands back. Higher shows more of the terrain, smaller.",
		FOV: "The lens. Higher is wider and bends the terrain at the edges; lower flattens it.",
		ORBIT: "How far the view slowly swings from side to side on its own, in degrees.",
		SWAY: "A small drift of the view from side to side. Zero keeps it still.",
		CAM_RESPONSE: "How far loud passages lift the view and quiet ones lower it (key 6). Zero keeps it at the height set.",
		HEIGHT: "How tall the mountains are. Higher makes loud sounds tower.",
		WIDTH: "How wide the terrain is.",
		LANE_SPAN: "How wide apart the notes are spread across the terrain. Higher spreads them; lower bunches them in the middle.",
		HILL: "How wide each note's hill is. Higher makes broad rolling mountains that merge; lower makes thin separate spikes.",
		SMOOTH: "How much the terrain is blurred across. Higher gives soft rounded hills; zero shows every spike.",
		JAG: "How rough a sharp sound makes its ridge. Zero keeps every ridge smooth.",
		RIDGE_LIMIT: "Height at which tall peaks start to flatten off.",
		FILL: "How solid the mountains are. At 1 they hide what is behind; lower lets it show through; zero leaves only the lines.",
		LIGHT: "How brightly the slopes are lit (key 5). Zero leaves them black with only the lines.",
		ROW_LINES: "How bright the line on every row and the heavier one on every bar are (key 2).",
		LANE_LINES: "How bright the line along each note's lane is, in that note's colour (key 3).",
		CONTOUR_LIGHT: "How bright the lines of equal height are (key 4).",
		CONTOUR_COUNT: "How many height steps there are from the ground to a tall peak. Higher gives closer contours.",
		FOG: "How far away the fog begins, as a share of the distance to the horizon. Lower hides more of the far terrain.",
		GLOW: "The soft halo around everything bright. Zero is a clean, sharp picture.",
		LINE: "How thick the lines are, in pixels either side.",
		DUST_LIGHT: "How bright the specks flying past are (key 7). Zero hides them.",
		MIRROR: "How strongly the lines are reflected below the ground (key 8).",
		SKY_BRIGHT: "How bright the glow on the horizon is at its centre (key 1). Zero turns it off."
	},
	["FUTURE_BEATS", "CAM_YAW", "CAM_PITCH", "HEIGHT", "FILL", "FOG", "GLOW"]
);

const GRADIENTS = [
	["height", "Height", "Valleys take the first colour, peaks the last: the louder a moment, the further along"],
	["depth", "Depth", "Far away, what is coming, takes the first colour; now, up close, the last"],
	["note", "Note", "Each note takes its own colour along the palette, from the first lane to the last"],
	["sound", "Sound", "The whole landscape slides along the colours with how loud the music is"]
] as const;
const COLOURS = colourSettings("terrain", GRADIENTS);

const smoothstep = (t: number) => {
	const u = Math.max(0, Math.min(1, t));
	return u * u * (3 - 2 * u);
};
const beatOf = (audio: TrackAudioData | null) => (audio?.tempo && audio.tempo > 40 ? 60 / audio.tempo : 0.5);

// ---- the song as a table, once per track ----------------------------------------------------------------
// 16 floats per row of time: the twelve notes' weights (pitches^1.5, or one broad hill when there are no notes), then the
// loudness the hills are scaled by, the sharpness, the section's key lean and the plain loudness. Three samples across
// a row's span, as Ridgeline averages.
export type Chroma = { data: Float32Array; rows: number; rate: number; end: number };
export function buildChroma(audio: TrackAudioData | null): Chroma | null {
	const segs = audio?.segments;
	if (!audio || !segs || segs.length === 0) return null;
	const end = segs[segs.length - 1].start + segs[segs.length - 1].duration;
	if (!(end > 1)) return null;
	// rows per second, fewer on a very long track so the texture stays within what a GPU allows
	const rate = Math.min(12, 3800 / end);
	const rows = Math.ceil(end * rate) + 2;
	const data = new Float32Array(rows * 16);
	for (let r = 0; r < rows; r++) {
		const t = r / rate;
		if (t > end) break;
		const o = r * 16;
		let loud = 0;
		let amp = 0;
		let sharp = 0;
		for (let s = -1; s <= 1; s++) {
			const at = Math.max(0, Math.min(end, t + s / rate / 3));
			const l = sampleCurve(audio.loudnessCurve, at);
			const seg = segmentAt(segs, at);
			loud += l / 3;
			amp += (Math.pow(l, 0.8) * 1.5) / 3;
			if (seg) sharp += (1 - Math.min(1, seg.loudness_max_time / 0.12)) / 3;
			for (let k = 0; k < 12; k++) data[o + k] += (seg ? Math.pow(seg.pitches[k], 1.5) : 0.35) / 3;
		}
		data[o + 12] = amp;
		data[o + 13] = sharp;
		data[o + 14] = keyHueAt(audio, t);
		data[o + 15] = loud;
	}
	return { data, rows, rate, end };
}

// ---- the camera --------------------------------------------------------------------------------------
type Vec = [number, number, number];
const perspective = (fovy: number, aspect: number, near: number, far: number) => {
	const f = 1 / Math.tan(fovy / 2);
	const m = new Float32Array(16);
	m[0] = f / aspect;
	m[5] = f;
	m[10] = (far + near) / (near - far);
	m[11] = -1;
	m[14] = (2 * far * near) / (near - far);
	return m;
};
const lookAt = (eye: Vec, target: Vec) => {
	let zx = eye[0] - target[0];
	let zy = eye[1] - target[1];
	let zz = eye[2] - target[2];
	const zl = Math.hypot(zx, zy, zz) || 1;
	zx /= zl;
	zy /= zl;
	zz /= zl;
	// up is +y: x = up cross z
	let xx = zz;
	let xz = -zx;
	const xl = Math.hypot(xx, xz) || 1;
	xx /= xl;
	xz /= xl;
	const yx = zy * xz;
	const yy = zz * xx - zx * xz;
	const yz = -zy * xx;
	const m = new Float32Array(16);
	m[0] = xx;
	m[1] = yx;
	m[2] = zx;
	m[4] = 0;
	m[5] = yy;
	m[6] = zy;
	m[8] = xz;
	m[9] = yz;
	m[10] = zz;
	m[12] = -(xx * eye[0] + xz * eye[2]);
	m[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
	m[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
	m[15] = 1;
	return m;
};
const multiply = (a: Float32Array, b: Float32Array) => {
	const m = new Float32Array(16);
	for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) m[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
	return m;
};

const makeRenderer = () => {
	try {
		return createTerrainRenderer();
	} catch (err) {
		console.error("[visualizer] Terrain renderer", err);
		return null;
	}
};

function create(): Preset {
	const conduct = createConductor();
	const keyHue = createKeyHue();
	const glow = createGlow();
	// one context per instance, released in dispose(): a browser keeps only about sixteen alive
	let renderer: TerrainRenderer | null = makeRenderer();
	let rendererLost = false;
	let retryAt = 0;
	if (!renderer && typeof Spicetify !== "undefined") Spicetify.showNotification("Terrain needs WebGL2, and it is off or only in software in this client");

	// track on screen and the time it is shown at; they lag the player across a track change or seek
	let shown: TrackAudioData | null = null;
	let chroma: Chroma | null = null;
	let uploaded: TerrainRenderer | null = null;
	let viewTime = 0;
	let presence = 0;
	let swayClock = 0;
	let pausedFor: TrackAudioData | null | undefined;
	let pausedAt = "";
	// eased: recent loudness, upcoming loudness, camera height (0..1)
	let lately = 0.3;
	let ahead = 0.3;
	let camera = 0.5;
	let soundAt = 0.5;
	let skyLean = NaN;
	const lane = new Float32Array(12);

	const showTrack = (audio: TrackAudioData | null) => {
		shown = audio;
		chroma = buildChroma(audio);
		uploaded = null;
	};

	return {
		draw(frame) {
			const { ctx, width, height, isPlaying, colorRgb, audio, progressSec } = frame;
			// paused: draw one frame, then nothing until the track, position, size, a knob or a feature changes
			const still = isPlaying ? "" : [progressSec, width, height, tuneVersion(), FEATURE_KEYS.map(f => +f.on).join("")].join("|");
			if (!isPlaying) {
				if (audio === pausedFor && still === pausedAt) return;
				pausedFor = audio;
				pausedAt = still;
				if (audio !== shown || Math.abs(progressSec - viewTime) > 0.5) showTrack(audio);
				viewTime = progressSec;
				presence = shown ? 1 : 0;
			} else pausedAt = "";
			const c = conduct(frame);
			const scale = c.scale;

			// ---- which song, and when ----------------------------------------------------------------------
			// a new track or a seek sinks the old terrain flat on its own clock, then the new one rises
			if (audio !== shown || Math.abs(progressSec - viewTime) > 0.5) {
				presence += (0 - presence) * Math.min(1, 6 * c.dt);
				viewTime += c.dt;
				if (presence < 0.02) {
					showTrack(audio);
					viewTime = progressSec;
				}
			} else {
				viewTime = progressSec;
				presence += ((shown ? 1 : 0) - presence) * Math.min(1, 1.2 * c.dt);
			}
			const beat = beatOf(shown);

			// ---- what is coming, measured: the next stretch against the last --------------------------------
			lately += (c.loudness - lately) * Math.min(1, 0.35 * c.dt);
			let coming = 0;
			if (shown) for (let k = 0; k < 8; k++) coming += sampleCurve(shown.loudnessCurve, viewTime + beat * (4 + (k * 12) / 7)) / 8;
			ahead += (coming - ahead) * Math.min(1, 2 * c.dt);

			// ---- 6. the camera: higher over loud passages, lower over quiet, crouching before a build ---------
			const loud = Math.max(0, Math.min(1, (lately - LATELY_QUIET) / (LATELY_LOUD - LATELY_QUIET)));
			const crouch = Math.max(0, Math.min(1, (ahead - lately) / LEAD_FULL));
			const cameraTarget = FEATURES.camera.on ? Math.max(0, Math.min(1, loud - crouch * 0.3)) : 0.5;
			camera += (cameraTarget - camera) * Math.min(1, 0.7 * c.dt);
			swayClock += c.dt;
			const yaw = (K.CAM_YAW + K.ORBIT * Math.sin(swayClock * 0.15) + K.SWAY * 6 * Math.sin(swayClock * 0.2)) * DEG;
			const pitch = Math.max(3, Math.min(88, K.CAM_PITCH * (1 + K.CAM_RESPONSE * (camera - 0.5) * 0.6))) * DEG;
			const focus: Vec = [0, 0.25 * K.HEIGHT, Math.min(K.FUTURE_BEATS * 0.3, 4)];
			const eye: Vec = [
				focus[0] + K.CAM_DIST * Math.sin(yaw) * Math.cos(pitch),
				focus[1] + K.CAM_DIST * Math.sin(pitch),
				focus[2] - K.CAM_DIST * Math.cos(yaw) * Math.cos(pitch)
			];
			const vp = multiply(perspective(K.FOV * DEG, width / Math.max(1, height), 0.1, 400), lookAt(eye, focus));
			// where the far edge of the terrain lands on the screen: the horizon glow sits there
			const farClip = [vp[8] * K.FUTURE_BEATS + vp[12], vp[9] * K.FUTURE_BEATS + vp[13], vp[11] * K.FUTURE_BEATS + vp[15]];
			const horizonY = farClip[2] > 0.01 ? Math.max(-1, Math.min(2, (farClip[1] / farClip[2]) * 0.5 + 0.5)) : 0.5;
			const horizonX = farClip[2] > 0.01 ? Math.max(-1, Math.min(2, (farClip[0] / farClip[2]) * 0.5 + 0.5)) : 0.5;
			publishDiagnostics("terrain", { eyeX: eye[0], eyeY: eye[1], eyeZ: eye[2], vp: vp.reduce((a, b) => a + Math.abs(b), 0), horizonY, horizonX, presence });

			// ---- colour ------------------------------------------------------------------------------------
			const pal = palette(COLOURS, frame.palette ?? [colorRgb]);
			const rel = (level: number) => smoothstep((level - LATELY_QUIET) / (LATELY_LOUD - LATELY_QUIET));
			soundAt += (rel(c.energy) - soundAt) * Math.min(1, c.dt / 0.8);
			const grey = pal.every(p => p.s < GREY);
			const turn = COLOURS.mode === "cover" ? 1 : 0;
			const liveHue = keyHue(shown, viewTime, c.dt) * COLOURS.harmony;
			const ramp = new Float32Array(18);
			for (let i = 0; i < 6; i++) {
				const n = paletteAt(pal, i / 5);
				const rgb = hslToRgb(n.h, n.s * 0.9, n.l);
				ramp.set([rgb.r / 255, rgb.g / 255, rgb.b / 255], i * 3);
			}
			// a colour for each of the twelve places a note can stand, left to right, along the palette
			const laneRgb = new Float32Array(36);
			for (let f = 0; f < 12; f++) {
				const n = paletteAt(pal, f / 11);
				const s = grey ? n.s : Math.min(1, n.s + 0.08);
				const rgb = hslToRgb(familyHue(pal, n, liveHue, turn), s, accentLightness(s, Math.min(0.8, n.l + 0.16)));
				laneRgb.set([rgb.r / 255, rgb.g / 255, rgb.b / 255], f * 3);
			}
			const lit = paletteAt(pal, rel(c.energy));
			const litS = grey ? lit.s : Math.min(1, lit.s + 0.08);
			const dustRgb = hslToRgb(familyHue(pal, lit, liveHue, turn), litS, accentLightness(litS, Math.min(0.8, lit.l + 0.16)));
			// the horizon's lean towards the coming section's key, eased so a new key is joined, not jumped to
			const farTint = paletteAt(pal, rel(ahead));
			const lean = keyHueAt(shown, viewTime + K.FUTURE_BEATS * beat * 0.8) * COLOURS.harmony;
			skyLean = Number.isNaN(skyLean) || !isPlaying ? lean : skyLean + (lean - skyLean) * Math.min(1, c.dt / 0.6);
			const sky = hslToRgb(familyHue(pal, farTint, skyLean, turn * 0.3), farTint.s * 0.85, Math.min(0.7, farTint.l + 0.05));

			// ---- the surface: the mountains' own numbers, with smoothing folded in ----------------------------
			// smoothing a sum of gaussians is a wider gaussian (variances add), less tall by the same ratio
			const smooth = (K.SMOOTH * 2) / 95;
			const hill = Math.sqrt(K.HILL * K.HILL + 2 * smooth * smooth);
			for (let k = 0; k < 12; k++) lane[k] = -K.LANE_SPAN + (2 * K.LANE_SPAN * ((k * 7) % 12)) / 11;
			// a grid of rows fixed to the song's own time, so they do not swim as it scrolls
			const dt = beat / K.ROW_DETAIL;
			const meshRows = Math.min(MAX_ROWS, Math.ceil((K.PAST_BEATS + K.FUTURE_BEATS) * K.ROW_DETAIL) + 2);
			const anchor = Math.floor((viewTime - K.PAST_BEATS * beat) / dt) * dt;

			// ---- the picture --------------------------------------------------------------------------------
			// lost context (a GPU reset, driver update, sleep): everything in it is gone; ask for a new one every 2 s
			if (renderer && renderer.lost()) {
				renderer.dispose();
				renderer = null;
				rendererLost = true;
			}
			if (!renderer && rendererLost && performance.now() > retryAt) {
				retryAt = performance.now() + 2000;
				renderer = makeRenderer();
				if (renderer) rendererLost = false;
			}
			if (!renderer) {
				// a lost context is retried above; keep its last frame rather than claim WebGL is off
				if (rendererLost) return;
				ctx.fillStyle = "rgb(0, 0, 0)";
				ctx.fillRect(0, 0, width, height);
				ctx.font = `${Math.round(14 * (globalThis.devicePixelRatio || 1))}px sans-serif`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
				ctx.fillText("Terrain needs WebGL2. Turn on hardware acceleration in Spotify's settings.", width / 2, height / 2);
				return;
			}
			if (uploaded !== renderer) {
				renderer.setTrack(chroma?.data ?? null, chroma?.rows ?? 0);
				uploaded = renderer;
			}
			const strength = FEATURES.horizon.on ? smoothstep((ahead - 0.1) / 0.45) * presence * K.SKY_BRIGHT : 0;
			renderer.draw({
				width,
				height,
				vp,
				time: viewTime,
				beat,
				beat0: shown?.beats[0]?.start ?? 0,
				rate: chroma?.rate ?? 1,
				rows: chroma?.rows ?? 0,
				end: chroma?.end ?? 0,
				anchor,
				dt,
				meshRows,
				past: K.PAST_BEATS,
				future: K.FUTURE_BEATS,
				halfWidth: K.WIDTH,
				heightScale: K.HEIGHT,
				hill,
				hillAmp: K.HILL / hill,
				jag: K.JAG,
				limit: K.RIDGE_LIMIT,
				laneSpan: K.LANE_SPAN,
				lane,
				presence,
				harmony: COLOURS.harmony,
				ramp,
				laneRgb,
				follows: Math.max(0, GRADIENTS.findIndex(g => g[0] === COLOURS.follows)),
				soundAt,
				quiet: LATELY_QUIET,
				loud: LATELY_LOUD,
				fill: K.FILL,
				light: K.LIGHT,
				glint: 0.14 + c.energy * 0.3,
				rowLines: K.ROW_LINES,
				laneLines: K.LANE_LINES,
				contourLight: K.CONTOUR_LIGHT,
				contours: K.CONTOUR_COUNT,
				lineWidth: Math.max(1, scale * 0.0011) * K.LINE,
				fogStart: K.FOG,
				lit: FEATURES.lit.on,
				rowsOn: FEATURES.rows.on,
				lanesOn: FEATURES.lanes.on,
				contoursOn: FEATURES.contours.on,
				nowOn: FEATURES.now.on,
				mirror: FEATURES.mirror.on ? K.MIRROR : 0,
				dust: FEATURES.dust.on ? presence * (0.1 + c.energy * 0.5) * K.DUST_LIGHT : 0,
				dustRgb: [dustRgb.r / 255, dustRgb.g / 255, dustRgb.b / 255],
				sky: [sky.r / 255, sky.g / 255, sky.b / 255],
				skyStrength: strength,
				horizonY,
				skyHeight: SKY_HEIGHT,
				skyWidth: SKY_WIDTH,
				skyX: horizonX
			});

			// ---- onto the frame, and the bloom over it -------------------------------------------------------
			ctx.drawImage(renderer.canvas, 0, 0);
			glow(ctx, renderer.canvas, width, height, scale, (0.3 + c.energy * 0.6 + c.impact * 0.5) * K.GLOW);
		},
		dispose() {
			renderer?.dispose();
			renderer = null;
			rendererLost = false;
			uploaded = null;
			chroma = null;
			glow.dispose();
		}
	};
}

export const terrainPreset: PresetDefinition = { id: "terrain", name: "Terrain", experimental: true, create };
