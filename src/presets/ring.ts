// Ring: Ridgeline bent until its ends meet. A row is one sound (height: loudness, shape: harmony in fifths),
// depth is time, the bright ring is "now", echoes are afterimages of sounds. The center is the horizon:
// what is coming shrinks toward it, what has played grows toward the edge of the screen.
// Keys 1-9 toggle the first extras (FEATURES). The filled line and the mirrored ring are panel-only.
// Rows are drawn far to near, each filled between its baseline and its crest.
import { createNoise2D } from "simplex-noise";
import { createGlow, createKeyHue, keyHueAt } from "./effects";
import { createConductor } from "./conductor";
import { accentLightness, colourSettings, familyHue, GREY, hslToRgb, palette, paletteAt, Rgb } from "../colours";
import { rankOf, sampleCurve, segmentAt, TrackAudioData } from "../audio-data";
import { Preset, PresetDefinition, rgbString } from "./types";
import { toggleFeature, tune, tuneFeatures, tuneVersion } from "./tune";
import { setCanvasHoles } from "../ui/picture";

// ---- the extras, in the order of their keys ---------------------------------------------------------
const FEATURES = {
	horizon: { name: "horizon glow", on: true },
	grid: { name: "bars and section gates", on: true },
	height: { name: "colour by height", on: true },
	lit: { name: "lit mountains", on: true },
	camera: { name: "camera", on: true },
	dust: { name: "dust", on: true },
	accents: { name: "rows on accents", on: true },
	strands: { name: "pitch strands", on: true },
	notes: { name: "colour by note", on: true },
	// off: the current moment stays a stroke, and LINE sets its thickness
	filled: { name: "filled now line", on: false },
	// one semicircle and its reflection. ARC and LANE_SPAN are forced while this is on, and hidden so they are not overwritten
	mirror: { name: "mirrored ring", on: false, hides: ["ARC", "LANE_SPAN"] }
};
const FEATURE_KEYS = Object.values(FEATURES);
tuneFeatures("ring", FEATURE_KEYS);
// module scope: create() reruns on every preset switch and would leave a listener behind each time
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
	window.addEventListener("visualizer-feature", (event: Event) => {
		const detail = (event as CustomEvent<{ preset: string | null; n: number } | null>).detail;
		const feature = detail && detail.preset === ringPreset.id ? FEATURE_KEYS[detail.n - 1] : undefined;
		if (!feature) return;
		toggleFeature(ringPreset.id, feature);
		if (typeof Spicetify !== "undefined") Spicetify.showNotification(`Ring ${detail!.n}: ${feature.name} ${feature.on ? "ON" : "off"}`);
	});
}

// ---- time, in beats of the track ------------------------------------------------------------------------
// how much of the future is on screen, how much of the past, and how many rows a beat is cut into
const FUTURE_BEATS = 6.34;
const PAST_BEATS = 1.42;
const ROWS_PER_BEAT = 2;
// rows on accents, in beats: minimum spacing, and longest stretch of ground without a row
const ROW_GAP_MIN = 0.09037;
const ROW_GAP_MAX = 0.9988;

// ---- the view -------------------------------------------------------------------------------------------
// depth is 1 at the outside of the picture; "now" sits at Z_NOW, and the radius there is the diameter knob.
// GROUND is how far the other rings leave that one: future inward, past outward.
const Z_NOW = 1.637;
const GROUND = 0.6375;
// how far a peak stands off a ring, as a fraction of the shorter screen side at depth 1
const RIDGE = 0.34;
// the bright ring's diameter, as a fraction of the shorter screen side. Past rings and peaks sit outside it.
const DIAMETER = 0.55;
// camera spread, quietest to loudest; LATELY_* is the measured level range (5th to 95th), LEAD_FULL a real build
const CAMERA_LOW = 0.3463;
const CAMERA_HIGH = 1.53;
const LATELY_QUIET = 0.154;
const LATELY_LOUD = 0.4899;
const LEAD_FULL = 0.15;
// rows nearer than this are drawn with every point; beyond it they are small enough for half of them
const FINE_UNTIL = 3.6;

// ---- a row's shape ----------------------------------------------------------------------------------------
// how many samples span one row. The slider moves this; the tables below are rebuilt to match, so it is not a const.
let POINTS = 192; ///96;
// loudness, then the section's colour, in the two slots after the samples. They sit at this index, so they move
// when the count does: a row shaped at the old count keeps them at the old index and cannot be reused.
let LEVEL = POINTS;
let HUE = POINTS + 1;
// how far across the outermost pitch lanes sit, and how wide one note's hill is (in half-widths)
const LANE_SPAN = 0.6152;
const HILL = 0.07583;
// how tall a ridge may get before it is rounded off
const RIDGE_LIMIT = 0.855;
// jaggedness of a sharp sound, and smoothing radius along the line in points (of 96)
const JAG = 0.35;
const SMOOTH = 1.5;
// echo: lifetime in beats, swell by the end for the quietest sound and for a big hit, max alive
const ECHO_BEATS = 0.9685;
const ECHO_SWELL_SOFT = 0.1825;
const ECHO_SWELL_HARD = 1.058;
const ECHO_MAX = 12;
// how many specks of dust are in the air
const DUST = 70;
// center glow: radius as a fraction of the shorter screen side, and peak brightness
const SKY_HEIGHT = 0.2252;
const SKY_BRIGHT = 0.425;

const K = tune("ring", {
	///FUTURE_BEATS: [FUTURE_BEATS, 4, 40, "beats of the future on screen", "time"],
	FUTURE_BEATS: [FUTURE_BEATS, 0, 40, "beats of the future on screen", "time"],
	PAST_BEATS: [PAST_BEATS, 1, 8, "beats of the past"],
	ROW_GAP_MIN: [ROW_GAP_MIN, 0.05, 1, "rings no closer than, beats"],
	ROW_GAP_MAX: [ROW_GAP_MAX, 0.5, 4, "no gap longer than, beats"],
	Z_NOW: [Z_NOW, 1.1, 3, "how deep now stands", "view"],
	DIAMETER: [DIAMETER, 0.15, 0.95, "diameter of the bright ring"],
	GROUND: [GROUND, 0.2, 1.2, "ring spread"],
	RIDGE: [RIDGE, 0.05, 1, "ridge height"],
	ARC: [1, 0.5, 1, "how much of the circle"],
	FINE_UNTIL: [FINE_UNTIL, 1, 20, "full detail nearer than"],
	CAMERA_LOW: [CAMERA_LOW, 0.2, 1.5, "spread when quiet", "camera"],
	CAMERA_HIGH: [CAMERA_HIGH, 0.5, 2.5, "spread when loud"],
	LATELY_QUIET: [LATELY_QUIET, 0, 0.4, "level that counts as quiet"],
	LATELY_LOUD: [LATELY_LOUD, 0.45, 1, "level that counts as loud"],
	LEAD_FULL: [LEAD_FULL, 0.02, 0.5, "build that crouches it fully"],
	///LANE_SPAN: [LANE_SPAN, 0.1, 1, "how wide the pitch lanes spread", "shape"],
	LANE_SPAN: [LANE_SPAN, 0.1, 12, "how wide the pitch lanes spread", "shape"],
	POINTS: [POINTS, 96, 1200, "points per ring", "shape"],
	HILL: [HILL, 0.03, 0.5, "width of one note hill"],
	RIDGE_LIMIT: [RIDGE_LIMIT, 0.3, 4, "tallest before rounding off"],
	JAG: [JAG, 0, 1, "how jagged a sharp sound is"],
	SMOOTH: [SMOOTH, 0, 8, "smoothing along the ring"],
	ECHO_BEATS: [ECHO_BEATS, 0.2, 6, "echo lasts, beats", "echo"],
	ECHO_SWELL_SOFT: [ECHO_SWELL_SOFT, 0, 1, "swell of a soft sound"],
	ECHO_SWELL_HARD: [ECHO_SWELL_HARD, 0, 3, "swell of a big hit"],
	SKY_HEIGHT: [SKY_HEIGHT, 0.03, 0.6, "glow radius", "horizon glow"],
	SKY_BRIGHT: [SKY_BRIGHT, 0, 1, "glow brightness"],
	GLOW: [1, 0, 2.5, "halo strength", "look"],
	LINE: [1, 0.4, 3, "thickness of the bright ring"],
	DUST_LIGHT: [1, 0, 3, "dust brightness"],
	SWAY: [1, 0, 3, "camera sway", "camera"],
	STRAND_SPREAD: [0.4, 0, 1, "how far a strand spreads", "strands"],
	STRAND_WAVE: [0, 0, 1, "how much a strand rings as a wave"],
	STRAND_LIGHT: [1, 0, 3, "strand brightness"],
	NOTE_COLOUR: [1, 0, 1, "how far colour follows the note"],
	FILL: [1, 0, 1, "how solid the rings are", "style"],
	BEND: [0, 0, 1, "how the rings twist"],
	BANK: [0, 0, 1, "how far the view rolls"],
	FADE_AMOUNT: [0, 0, 1, "how far intro and outro fade the view"],
	TIMBRE_HILL: [0, 0, 1, "how far timbre reshapes the hills"],
	LANE_ORDER: [0, 0, 1, "fifths to semitone order"],
	PULSE: [0, 0, 1, "beat swell in the rings"],
	INVERT_EVERY_X_RINGS: [0, 0, 1, "invert the rings"],
	SKY: [1, 0, 1, "opacity inside the ring", "opacity"],
	BELOW: [1, 0, 1, "opacity outside the ring"],
	UNDER: [1, 0, 1, "opacity under the ridges"]
},
	// what each one does, shown beside the panel on hover
	{
		POINTS: "How many points each ring is drawn with. Higher makes the rings smoother; lower makes them coarser.",
		FUTURE_BEATS: "How much of the song ahead is on screen. Higher shows further into the future; the inner rings pack tighter.",
		PAST_BEATS: "How much of the song just played stays visible outside the bright ring before it fades. Higher keeps it longer.",
		ROW_GAP_MIN: "Smallest spacing between rings. Higher drops rings on fast sounds, so the picture gets sparser; lower keeps every sound as its own ring.",
		ROW_GAP_MAX: "Longest stretch without a ring. Lower fills quiet gaps with flat rings, so the picture looks denser; higher leaves holes.",
		Z_NOW: "How steeply the rings shrink toward the center. Higher pulls the future into a tighter eye and lets the past flare further out. The bright ring stays the size the diameter sets.",
		DIAMETER: "How big the bright ring is, as a fraction of the shorter side of the screen. The peaks and the past sit outside it.",
		GROUND: "How far apart the rings sit. Higher opens the future toward the center and the past toward the edges; lower piles the rings onto the bright one.",
		RIDGE: "How far the peaks stand out from a ring. Higher makes loud sounds tower; lower keeps every ring closer to round.",
		ARC: "How much of the circle is drawn. At 1 the ends meet at the bottom. At 0.5 the bright line is a semicircle across the top, open at the bottom.",
		FINE_UNTIL: "Distance up to which rings are drawn in full detail. Higher keeps more rings smooth; lower makes far rings slightly coarser.",
		CAMERA_LOW: "How far the rings stay spread over quiet music. Higher keeps them open and the bright ring a little larger; lower draws them in.",
		CAMERA_HIGH: "How far the rings open over loud music. Higher spreads them further, and eases the bright ring a little larger, as the song gets louder.",
		LATELY_QUIET: "How loud the last few seconds must be before the rings start to open. Higher keeps them drawn in for longer.",
		LATELY_LOUD: "How loud the last few seconds must be for the rings to reach their widest. Higher means only the loudest parts open them all the way.",
		LEAD_FULL: "How big a coming build must be to make the view crouch fully before it. Lower makes it crouch for small builds too.",
		LANE_SPAN: "How far around the ring the notes are spread. Higher spreads the mountains around the circle; lower bunches them at the top.",
		HILL: "How wide each note's hill is. Higher makes broad, rolling mountains that merge; lower makes thin, separate spikes.",
		RIDGE_LIMIT: "Height at which tall peaks start to flatten off. Lower rounds off loud peaks sooner; higher lets them shoot out sharper.",
		JAG: "How rough a sharp sound makes its ring. Higher gives jagged, noisy edges on hits; zero keeps every ring smooth.",
		SMOOTH: "How much each ring is blurred along its length. Higher gives soft, rounded hills; zero shows every little spike.",
		ECHO_BEATS: "How long the afterimage of each sound lingers. Higher leaves it hanging for longer before it fades out.",
		ECHO_SWELL_SOFT: "How far the afterimage of a quiet sound lifts off the ring as it fades. Higher makes even soft sounds throw an echo.",
		ECHO_SWELL_HARD: "How far the afterimage of a big hit lifts off the ring as it fades. Higher makes hits throw a taller, wider echo.",
		SKY_HEIGHT: "How far the glow at the center reaches. Higher makes a larger disc of light inside the far rings.",
		SKY_BRIGHT: "How bright the center glow is. Zero turns it off.",
		GLOW: "The soft halo around everything bright. Zero is a clean, sharp picture; higher is hazier and dreamier.",
		LINE: "How thick the bright ring of the current moment is.",
		DUST_LIGHT: "How bright the specks flying outward are. Zero hides them; higher makes a snowstorm of light on loud parts.",
		SWAY: "How far the rings slide off center with their depth. Zero keeps every ring concentric; higher swings the far rings one way and the past the other. The bright ring stays put.",
		STRAND_SPREAD: "How wide each note's strand is (key 8). Zero keeps the narrow hill the mountains use; higher makes broad bumps that overlap and cross each other.",
		STRAND_WAVE: "Turns each strand from a hill into a wave, one per note at its true pitch ratio. Around the top the twelve waves add up to the sound of the chord itself.",
		STRAND_LIGHT: "How bright the twelve note strands are. Zero hides them.",
		NOTE_COLOUR: "How far the bright ring takes the colour of the note under it (key 9). Zero keeps one colour; higher gives every note its own colour from the palette.",
		FILL: "How solid the rings are. At 1 a ring's band hides what sits under it; lower lets the rings behind show through; zero leaves only glowing lines.",
		BEND: "Twists the rings against each other as they come in, so the song spirals. Zero keeps every ring lined up.",
		BANK: "How far the whole view rolls with the camera sway. Zero keeps the top of the ring at the top of the screen.",
		FADE_AMOUNT: "How far the track's own fade-in and fade-out show: the center glow dims and the rings draw in through an outro and open out of an intro. Zero ignores them.",
		TIMBRE_HILL: "Lets the sound's brightness reshape its hills. Dull sounds make broad rolling hills; bright, ringing ones make thin spikes. Zero keeps one width.",
		LANE_ORDER: "Where the twelve notes stand around the ring. Zero is the circle of fifths, so a chord is one mountain; one is by semitone, so a chord spreads out.",
		PULSE: "Makes the rings on the beat stand out a little further than the ones between, so the beat rolls outward toward you. Zero keeps them even.",
		INVERT_EVERY_X_RINGS: "Whether to render the rings normally (0), or inversely (1).",
		SKY: "How solid the black inside the bright ring is. At 1 it is black; at 0 that disk is a hole through to the page, even when the outside is solid. The center glow, the dust and the rings stay drawn on top.",
		BELOW: "How solid the black outside the bright ring is. At 1 it is black; lower opens that ground onto the page. It does not paint the inside. Rings that have already grown past it still draw over it.",
		UNDER: "How solid the black under each ridge is. The crest lines stay. At 1 a ring hides what is behind its band; lower lets the page through, and the rings behind show through with it. The filled now line thins with this too. FILL still sets how solid the body is before this."
	},
	// shown without "More"; the rest is for whoever wants to dig
	["FUTURE_BEATS", "DIAMETER", "RIDGE", "Z_NOW", "SMOOTH", "ECHO_BEATS", "SKY_BRIGHT", "GLOW", "BEND"]
);

// what the gradient can follow here (see colours.ts)
const COLOURS = colourSettings("ring", [
	["height", "Height", "Valleys take the first colour, peaks the last: the louder a moment, the further along"],
	["depth", "Depth", "Far away, toward the center, takes the first colour; the bright ring, up close, the last"],
	["sound", "Sound", "The whole picture slides along the colours with how loud the music is"]
]);

const smoothstep = (t: number) => {
	const u = Math.max(0, Math.min(1, t));
	return u * u * (3 - 2 * u);
};
const beatOf = (audio: TrackAudioData | null) => (audio?.tempo && audio.tempo > 40 ? 60 / audio.tempo : 0.5);
const BLACK = { r: 0, g: 0, b: 0 };
const TAU = Math.PI * 2;

// where each point of a row sits across the terrain, -1..1, and each pitch class's hill over those points.
// Empty until setResolution: the length is the point count, so a new count is a new table, not a refill of this one.
let ACROSS = new Float32Array(0);
let BLUR = new Float32Array(0);
let HILLS = new Float32Array(0);
// the same hills narrower and wider, for TIMBRE_HILL: a ringing sound is drawn with the narrow ones, a dull one with the wide
let HILLS_NARROW = new Float32Array(0);
let HILLS_WIDE = new Float32Array(0);
// which of the 12 places across the terrain a note stands in (0..11, left to right): in fifths, C G D A E B F# C# G# D# A# F,
// so a triad is three neighbouring lanes; LANE_ORDER takes it to semitones. Between the two it is a place in between.
const lanePos = (k: number) => ((k * 7) % 12) * (1 - K.LANE_ORDER) + k * K.LANE_ORDER;
// the mirrored ring fills the semicircle with notes; the saved lane spread is left alone
const laneSpan = () => (FEATURES.mirror.on ? 1.5 : K.LANE_SPAN);
const laneOf = (k: number) => {
	const span = laneSpan();
	return -span + (2 * span * lanePos(k)) / 11;
};
// a function: turning a knob redoes the table
const setHills = () => {
	for (let k = 0; k < 12; k++) {
		const lane = laneOf(k);
		for (let i = 0; i < POINTS; i++) {
			const x = ACROSS[i] - lane;
			const d = x / K.HILL;
			HILLS[k * POINTS + i] = Math.exp(-d * d);
			HILLS_NARROW[k * POINTS + i] = Math.exp(-d * d * 2.8);
			HILLS_WIDE[k * POINTS + i] = Math.exp((-d * d) / 2.8);
		}
	}
};

// gaussian smoothing weights along a row, made once per SMOOTH rather than one Math.exp per tap per point
let KERNEL = new Float32Array(1);
let KERNEL_REACH = 0;
let KERNEL_SUM = 1;
const setKernel = () => {
	const radius = K.SMOOTH;
	KERNEL_REACH = radius > 0.05 ? Math.ceil(radius * 2) : 0;
	KERNEL = new Float32Array(KERNEL_REACH * 2 + 1);
	KERNEL_SUM = 0;
	for (let d = -KERNEL_REACH; d <= KERNEL_REACH; d++) {
		const w = Math.exp((-d * d) / (2 * Math.max(0.05, radius) * Math.max(0.05, radius)));
		KERNEL[d + KERNEL_REACH] = w;
		KERNEL_SUM += w;
	}
};
setKernel();

// ---- 8. pitch strands: the twelve parts of the line at "now" --------------------------------------------------
// each note's own hill, wider than the mountains' so neighbours overlap and cross; and, for the wave, where across
// the terrain a note's wave is strong (it fades to flat ground at both ends)
let STRAND_HILLS = new Float32Array(0);
let STRAND_WINDOW = new Float32Array(0);
const setStrandHills = () => {
	const sigma = K.HILL + K.STRAND_SPREAD * 0.45;
	for (let k = 0; k < 12; k++) {
		const lane = laneOf(k);
		for (let i = 0; i < POINTS; i++) {
			const d = (ACROSS[i] - lane) / sigma;
			STRAND_HILLS[k * POINTS + i] = Math.exp(-d * d);
		}
	}
};

// A new point count rebuilds every table the row is drawn from. The samples always run from -1 to 1, so fewer
// points are a coarser row across the whole width, not a crop of the left side. The slider steps by 12; a stored
// value is snapped to that so the tables and the knob stay on the same count. LEVEL and HUE are re-aimed at the
// two slots after the new samples.
const setResolution = (n: number) => {
	const next = Math.max(96, Math.min(1200, Math.round(n / 12) * 12));
	if (next === POINTS && ACROSS.length === next) return false;
	POINTS = next;
	LEVEL = POINTS;
	HUE = POINTS + 1;
	ACROSS = new Float32Array(POINTS);
	BLUR = new Float32Array(POINTS);
	HILLS = new Float32Array(12 * POINTS);
	HILLS_NARROW = new Float32Array(12 * POINTS);
	HILLS_WIDE = new Float32Array(12 * POINTS);
	STRAND_HILLS = new Float32Array(12 * POINTS);
	STRAND_WINDOW = new Float32Array(POINTS);
	for (let i = 0; i < POINTS; i++) {
		ACROSS[i] = -1 + (2 * i) / (POINTS - 1);
		STRAND_WINDOW[i] = 1 - Math.pow(Math.abs(ACROSS[i]), 4);
	}
	setHills();
	setStrandHills();
	return true;
};
setResolution(K.POINTS);

const strandKey = () => [laneSpan(), K.HILL, K.STRAND_SPREAD, K.LANE_ORDER].join("|");

// what a cached row's shape depends on, and what the grid of rows depends on: a knob that is neither (GLOW, LINE, RIDGE,
// the sky, the camera) no longer makes every row be shaped again
const shapeKey = () => [laneSpan(), K.HILL, K.JAG, K.SMOOTH, K.RIDGE_LIMIT, K.LANE_ORDER, K.TIMBRE_HILL].join("|");
const gridKey = () => [K.FUTURE_BEATS, K.PAST_BEATS, K.ROW_GAP_MIN, K.ROW_GAP_MAX].join("|");
// the most rows drawn at once; past it the far, weightless ones thin out (only reached by the extreme knobs)
const MAX_ROWS = 160;

function create(): Preset {
	const noise = createNoise2D();
	const conduct = createConductor();
	const keyHue = createKeyHue();
	const glow = createGlow();

	// rows keyed by index on the beat grid, cached while on screen; gates sit at section boundaries
	const rows = new Map<number, Float32Array>();
	const gates = new Map<number, Float32Array>();
	// resized with the point count: the two extra slots are loudness and hue
	let live = new Float32Array(POINTS + 2);
	let target = new Float32Array(POINTS + 2);
	// 8. strands: each note's eased weight (pitches^1.5), the eased loudness it is scaled by, and a row's scratch
	const strandW = new Float32Array(12);
	let strandY = new Float32Array(POINTS);
	let strandAmp = 0;
	// hills follow the mirrored span, which may already be on when this instance is made
	setHills();
	setStrandHills();
	let strandSeen = strandKey();
	// a seam-blended copy of a row's heights
	let seamH = new Float32Array(POINTS);
	let liveH = new Float32Array(POINTS);
	// the point indexes a coarse ring actually draws, so the baseline walks back over the same ones
	let indexBuf = new Uint16Array(POINTS);
	// track on screen and the time it is shown at; they lag the player across a track change or seek
	let shown: TrackAudioData | null = null;
	let viewTime = 0;
	let presence = 0;
	let swayClock = 0;
	// per row: time, weight of the sound it stands on (0..1), whether a bar begins there
	let rowTimes: number[] = [];
	let rowWeights: number[] = [];
	let rowBars: boolean[] = [];
	let onAccents = FEATURES.accents.on;
	let shaped = shapeKey();
	let gridded = gridKey();
	// echoes, and sounds played by the last frame (-1: unknown, nothing echoes across a change or seek)
	const echoes: { data: Float32Array; age: number; amp: number }[] = [];
	let played = -1;
	// what the frame drawn while paused showed
	let pausedFor: TrackAudioData | null | undefined;
	let pausedAt = "";
	// eased: recent loudness, upcoming loudness, camera height
	let lately = 0.3;
	let ahead = 0.3;
	// where on the palette the music has the picture, when the colour follows the sound
	let soundAt = 0.5;
	// the horizon's lean towards the coming section's key, eased so a new key is joined, not jumped to
	let skyLean = NaN;
	let camera = 1;
	// the dust: across (half-widths), above the ground (ridges), its place in the passing stretch (0..1), its own light
	const dust = new Float32Array(DUST * 4);
	for (let i = 0; i < DUST; i++) {
		dust[i * 4] = (Math.random() * 2 - 1) * 2.4;
		dust[i * 4 + 1] = 1.1 + Math.random() * 2.6;
		dust[i * 4 + 2] = Math.random();
		dust[i * 4 + 3] = 0.4 + Math.random() * 0.6;
	}

	// the song at time `t`, averaged over one row's worth of it, into `out`
	const shape = (out: Float32Array, audio: TrackAudioData | null, t: number, span: number) => {
		out.fill(0);
		const segs = audio?.segments;
		const end = segs && segs.length > 0 ? segs[segs.length - 1].start + segs[segs.length - 1].duration : 0;
		if (!audio || t < 0 || t > end) return;
		out[HUE] = keyHueAt(audio, t);
		let sharp = 0;
		for (let s = -1; s <= 1; s++) {
			const at = t + (s * span) / 3;
			const loud = sampleCurve(audio.loudnessCurve, at);
			const seg = segmentAt(audio.segments, at);
			const amp = (Math.pow(loud, 0.8) * 1.5) / 3;
			out[LEVEL] += loud / 3;
			if (seg) sharp += (1 - Math.min(1, seg.loudness_max_time / 0.12)) / 3;
			// TIMBRE_HILL: a ringing sound (timbre[1] high for this track) is drawn with narrower hills, a dull one with wider
			const m = seg && K.TIMBRE_HILL > 0 ? K.TIMBRE_HILL * (rankOf(audio.timbreSorted, seg.timbre[1]) * 2 - 1) : 0;
			const other = m > 0 ? HILLS_NARROW : HILLS_WIDE;
			const mix = Math.abs(m);
			for (let k = 0; k < 12; k++) {
				// with no notes to go by, one broad hill
				const w = seg ? Math.pow(seg.pitches[k], 1.5) : 0.35;
				if (w < 0.02) continue;
				if (mix < 0.001) for (let i = 0; i < POINTS; i++) out[i] += w * HILLS[k * POINTS + i] * amp;
				else for (let i = 0; i < POINTS; i++) out[i] += w * (HILLS[k * POINTS + i] * (1 - mix) + other[k * POINTS + i] * mix) * amp;
			}
		}
		// jagged where the sound was sharp, in proportion to the ridge
		for (let i = 0; i < POINTS; i++) out[i] *= 1 + noise(ACROSS[i] * 9, t * 2.2) * sharp * K.JAG;
		// gaussian smoothing along the line; the ends hold their value
		if (KERNEL_REACH > 0) {
			const reach = KERNEL_REACH;
			for (let i = 0; i < POINTS; i++) {
				let sum = 0;
				for (let d = -reach; d <= reach; d++) sum += out[Math.max(0, Math.min(POINTS - 1, i + d))] * KERNEL[d + reach];
				BLUR[i] = sum / KERNEL_SUM;
			}
			for (let i = 0; i < POINTS; i++) out[i] = BLUR[i];
		}
		for (let i = 0; i < POINTS; i++) out[i] = K.RIDGE_LIMIT * Math.tanh(Math.max(0, out[i]) / K.RIDGE_LIMIT);
	};

	// ---- the grid: where the rows are ----------------------------------------------------------------------
	// 7. rows on accents: a row per segment onset, weighted by its confidence; onsets closer than ROW_GAP_MIN
	// merge, gaps get weightless rows, every bar start is a row. Off: rows on beats and midpoints, equal weight.
	const setGrid = (audio: TrackAudioData | null) => {
		onAccents = FEATURES.accents.on;
		const beat = beatOf(audio);
		const segs = audio?.segments ?? [];
		const beats = audio?.beats ?? [];
		const end = segs.length > 0 ? segs[segs.length - 1].start + segs[segs.length - 1].duration : 600;
		const rows: { t: number; w: number; bar: boolean }[] = [];
		if (onAccents && segs.length > 0) {
			for (const seg of segs) {
				const w = Math.max(0, Math.min(1, seg.confidence ?? 0.5));
				const last = rows[rows.length - 1];
				if (last && seg.start - last.t < beat * K.ROW_GAP_MIN) {
					if (w > last.w) {
						last.t = seg.start;
						last.w = w;
					}
				} else rows.push({ t: seg.start, w, bar: false });
			}
		} else if (beats.length > 1) {
			for (let k = 0; k < beats.length; k++) {
				rows.push({ t: beats[k].start, w: 0.5, bar: false });
				if (k + 1 < beats.length) rows.push({ t: (beats[k].start + beats[k + 1].start) / 2, w: 0.5, bar: false });
			}
		}
		// the bars: the row a bar begins on, or one put there
		let j = 0;
		for (const bar of audio?.bars ?? []) {
			while (j + 1 < rows.length && Math.abs(rows[j + 1].t - bar.start) <= Math.abs(rows[j].t - bar.start)) j++;
			if (rows.length > 0 && Math.abs(rows[j].t - bar.start) < beat * K.ROW_GAP_MIN) rows[j].bar = true;
			else rows.push({ t: bar.start, w: 0.35, bar: true });
		}
		rows.sort((a, b) => a.t - b.t);
		// no holes: before the first row, after the last, and across any stretch with nothing in it
		const filled: typeof rows = [];
		let from = Math.min(0, rows.length > 0 ? rows[0].t : 0) - beat * (K.PAST_BEATS + 1);
		const fill = (to: number) => {
			const n = Math.ceil((to - from) / (beat * K.ROW_GAP_MAX));
			for (let k = 1; k < n; k++) filled.push({ t: from + ((to - from) * k) / n, w: 0, bar: false });
		};
		filled.push({ t: from, w: 0, bar: false });
		for (const r of rows) {
			fill(r.t);
			filled.push(r);
			from = r.t;
		}
		fill(end + beat * (K.FUTURE_BEATS + 1));
		rowTimes = filled.map(r => r.t);
		rowWeights = filled.map(r => r.w);
		rowBars = filled.map(r => r.bar);
	};
	// the last row at or before `t` (-1 if there is none)
	const rowBefore = (t: number) => {
		let lo = -1;
		let hi = rowTimes.length - 1;
		while (lo < hi) {
			const mid = (lo + hi + 1) >> 1;
			if (rowTimes[mid] <= t) lo = mid;
			else hi = mid - 1;
		}
		return lo;
	};
	const showTrack = (audio: TrackAudioData | null) => {
		shown = audio;
		rows.clear();
		gates.clear();
		setGrid(shown);
		played = -1;
	};

	return {
		draw(frame) {
			const { width, height, isPlaying, colorRgb, audio, progressSec } = frame;
			const ctx = frame.ctx;
			// paused: draw one frame, then nothing until the track, position, size, a knob or a feature changes
			// (Spotify opens paused). The rings are placed at the paused moment directly, without the rise.
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

			// ---- which song, and when --------------------------------------------------------------------
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

			// setResolution rebuilds the shared tables when the count changes, and reports that it did.
			// These buffers, and anything cached, are still the old length: loudness and hue sit at the old indexes,
			// so a kept row would read them from the middle of the line. Drop them; the next time a row is drawn
			// it is shaped at the new count.
			if (setResolution(K.POINTS)) {
				live = new Float32Array(POINTS + 2);
				target = new Float32Array(POINTS + 2);
				strandY = new Float32Array(POINTS);
				seamH = new Float32Array(POINTS);
				liveH = new Float32Array(POINTS);
				indexBuf = new Uint16Array(POINTS);
				rows.clear();
				gates.clear();
				echoes.length = 0;
			}

			// the grid kind was toggled (key 7) or a knob moved: rows made with the old values are stale
			const nowShape = shapeKey();
			const nowGrid = gridKey();
			if (onAccents !== FEATURES.accents.on || rowTimes.length === 0 || shaped !== nowShape || gridded !== nowGrid) {
				if (shaped !== nowShape) {
					setHills();
					setKernel();
				}
				shaped = nowShape;
				gridded = nowGrid;
				setGrid(shown);
				rows.clear();
				gates.clear();
			}

			const beat = beatOf(shown);
			const step = beat / ROWS_PER_BEAT;
			const zPerSec = (K.Z_NOW - 1) / (K.PAST_BEATS * beat);
			const zFar = K.Z_NOW + K.FUTURE_BEATS * beat * zPerSec;

			// ---- what is coming, measured: the next stretch against the last ----------------------------------
			// loudness of the next twelve beats read off the timeline, not a detector; eased
			lately += (c.loudness - lately) * Math.min(1, 0.35 * c.dt);
			let coming = 0;
			if (shown) for (let k = 0; k < 8; k++) coming += sampleCurve(shown.loudnessCurve, viewTime + beat * (4 + (k * 12) / 7)) / 8;
			ahead += (coming - ahead) * Math.min(1, 2 * c.dt);

			// ---- 5. the camera --------------------------------------------------------------------------------
			// open over loud passages, drawn in over quiet ones, crouching before a build. The spread and, a little, the
			// diameter move with it. Reads only the two measured levels; eased over ~1.5 s.
			const loud = Math.max(0, Math.min(1, (lately - K.LATELY_QUIET) / (K.LATELY_LOUD - K.LATELY_QUIET)));
			const crouch = Math.max(0, Math.min(1, (ahead - lately) / K.LEAD_FULL));
			// the track's own fade-in and fade-out (reported on nearly every track), as how much of the view is left:
			// 1 in the body of the track, down to 0 at the very start and end. FADE_AMOUNT is how much of that shows.
			let body = 1;
			const fadeIn = shown?.trackInfo?.end_of_fade_in;
			const fadeOut = shown?.trackInfo?.start_of_fade_out;
			const length = shown?.trackInfo?.duration;
			if (K.FADE_AMOUNT > 0 && typeof fadeIn === "number" && fadeIn > 0.5 && viewTime < fadeIn) body = Math.min(body, smoothstep(viewTime / fadeIn));
			if (K.FADE_AMOUNT > 0 && typeof fadeOut === "number" && typeof length === "number" && fadeOut < length - 0.5 && viewTime > fadeOut) body = Math.min(body, 1 - smoothstep((viewTime - fadeOut) / (length - fadeOut)));
			const fade = 1 - K.FADE_AMOUNT * (1 - body);
			let cameraTarget = FEATURES.camera.on ? Math.max(K.CAMERA_LOW, K.CAMERA_LOW + loud * (K.CAMERA_HIGH - K.CAMERA_LOW) - crouch * 0.3) : 1;
			// it sinks towards its lowest as the track fades
			cameraTarget += (K.CAMERA_LOW - cameraTarget) * (1 - fade);
			camera += (cameraTarget - camera) * Math.min(1, 0.7 * c.dt);

			// ---- the view ----------------------------------------------------------------------------------
			swayClock += c.dt;
			const cx = width / 2;
			const cy = height / 2;
			const short = Math.min(width, height);
			// loud music opens the rings (camera multiplies the spread) and eases the bright ring a little larger
			const spread = K.GROUND * camera;
			const rNow = Math.max(1, short * 0.5 * K.DIAMETER * (1 + (camera - 1) * 0.18));
			const ridge = short * K.RIDGE;
			// the center drifts with depth: zero on the bright ring, opposite ways for the future and the past
			const sway = Math.sin(swayClock * 0.2) * width * (FEATURES.camera.on ? 0.085 : 0.05) * K.SWAY;
			// BEND: the same road the straight terrain used, read as an angle, so a ring keeps its place in the song
			const road = (t: number) => Math.sin(t * 0.13) + 0.5 * Math.sin(t * 0.31 + 1);
			const bend = K.BEND > 0 ? road(viewTime) : 0;
			// @what - baseline radius at depth z
			// @why - at z = Z_NOW this is exactly the bright ring, so depth moves the eye and the past, not the diameter
			// @how - spread scales how far a ring leaves the bright one; never below 1 px, or a steep eye feeds arc a negative radius
			const radiusAt = (z: number) => Math.max(1, rNow * (1 + spread * (K.Z_NOW / z - 1)));
			const centerAt = (z: number) => cx + sway * (1 / z - 1 / K.Z_NOW);
			// the mirrored ring is one semicircle; the saved arc is left alone
			const mirrored = FEATURES.mirror.on;
			const arc = mirrored ? 0.5 : K.ARC;
			// @what - angle of one sample around the ring
			// @why - the middle of the lanes sits at 12 o'clock; the old left and right ends meet at 6 o'clock when the arc is a full circle
			const angleOf = (across: number) => -Math.PI / 2 + across * Math.PI * arc;
			const twistAt = (z: number) => (K.BEND > 0 ? K.BEND * 0.5 * (road(viewTime + (z - K.Z_NOW) / zPerSec) - bend) : 0);
			// @what - a sample on the ring, or on its reflection
			// @why - twist is added after the reflection, so a twisted ring still meets itself at the sides
			// @how - the radius never drops below 1 px, or an inward peak would pass through the center
			const place = (z: number, across: number, radial: number, reflected = false) => {
				let a = angleOf(across);
				if (reflected) a = -a;
				a += twistAt(z);
				const r = Math.max(1, radiusAt(z) + radial);
				const ox = centerAt(z);
				return [ox + r * Math.cos(a), cy + r * Math.sin(a)] as const;
			};
			// 0 keeps every peak outward. Otherwise one inward ring, then this many outward ones.
			const everyIn = Math.round(K.INVERT_EVERY_X_RINGS);
			const inwardOf = (n: number) => (everyIn > 0) || (everyIn > 0 && n >= 0 && n % (everyIn + 1) === everyIn);
			const dirOf = (n: number) => (inwardOf(n) ? -1 : 1);
			// far rings rise out of the center from flat, not just fade; played rings shrink their peaks and leave outward
			const farAt = (z: number) => smoothstep((zFar - z) / 0.9);
			const playedAt = (z: number) => (z >= K.Z_NOW ? 1 : smoothstep((z - 1) / (K.Z_NOW - 1)));
			// most of the way down within a beat of being played
			const sunkAt = (tau: number) => (tau >= 0 ? 1 : Math.exp(tau / (beat * 0.7)));
			const liftOf = (z: number, flat: number) => (ridge / z) * flat * presence;
			// a full circle eases the empty shoulder onto one height. The notes stay where they are.
			// The mirror does not use that: each end eases toward its own height, so the sides meet flat.
			const closed = arc >= 0.999;
			// @what - ease the ends of a ring so the join does not corner
			// @why - a closed ring's two ends are different samples; a mirror's ends meet their own copies with a slope
			// @how - smoothstep is flat at the join and flat again where it hands back to the line
			const heightsOf = (data: Float32Array) => {
				if (!closed && !mirrored) return data;
				// across runs 2 units over the semicircle, so 0.08 is 4% of that half. The closed ring uses the empty shoulder.
				const reach = mirrored ? 0.08 : Math.max(0.08, 1 - K.LANE_SPAN);
				const n = Math.max(2, Math.min((POINTS >> 1) - 1, Math.round((reach * (POINTS - 1)) / 2)));
				const left = data[0];
				const right = data[POINTS - 1];
				const midH = (left + right) * 0.5;
				for (let i = 0; i < POINTS; i++) seamH[i] = data[i];
				for (let k = 0; k < n; k++) {
					const s = smoothstep(k / (n - 1));
					// the mirror keeps each end's own height. The closed ring meets on their average.
					const holdL = mirrored ? left : midH;
					const holdR = mirrored ? right : midH;
					seamH[k] = data[k] * s + holdL * (1 - s);
					const j = POINTS - 1 - k;
					seamH[j] = data[j] * s + holdR * (1 - s);
				}
				return seamH;
			};

			// ---- colour ------------------------------------------------------------------------------------
			// loudness is read against the band the camera uses (LATELY_*), not 0..1, where most of the palette is never reached
			const pal = palette(COLOURS, frame.palette ?? [colorRgb]);
			const rel = (level: number) => smoothstep((level - K.LATELY_QUIET) / (K.LATELY_LOUD - K.LATELY_QUIET));
			// its own envelope, slower than the line's: the colour follows the passage, not every hit
			soundAt += (rel(c.energy) - soundAt) * Math.min(1, c.dt / 0.8);
			const tint = (loud: number, near: number) => {
				if (COLOURS.follows === "height") return paletteAt(pal, loud);
				if (COLOURS.follows === "depth") return paletteAt(pal, near);
				return paletteAt(pal, soundAt);
			};
			// with a cover palette the line and section rows turn towards the cover's other colours; picked colours as picked
			const grey = pal.every(p => p.s < GREY);
			const turn = COLOURS.mode === "cover" ? 1 : 0;
			const liveHue = keyHue(shown, viewTime, c.dt) * COLOURS.harmony;
			const lit = tint(rel(live[LEVEL]), 1);
			const liveS = grey ? lit.s : Math.min(1, lit.s + 0.08);
			const liveRgb = hslToRgb(familyHue(pal, lit, liveHue, turn), liveS, accentLightness(liveS, Math.min(0.8, lit.l + 0.16)));
			// 8, 9. a colour for each note, left to right as the lanes stand: along the palette, through familyHue, so it
			// stays inside the cover's colours like everything else
			const noteRgb: Rgb[] =
				FEATURES.strands.on || FEATURES.notes.on
					? Array.from({ length: 12 }, (_, f) => {
						const n = paletteAt(pal, f / 11);
						const s = grey ? n.s : Math.min(1, n.s + 0.08);
						return hslToRgb(familyHue(pal, n, liveHue, turn), s, accentLightness(s, Math.min(0.8, n.l + 0.16)));
					})
					: [];

			// a hole is open only while one of the opacity knobs has moved. At 1 the page stays covered.
			setCanvasHoles(K.SKY < 1 || K.BELOW < 1 || K.UNDER < 1);
			// @why - a semi-transparent black painted over the previous frame would darken it again each frame.
			// Clearing first lets the sky alpha sit on empty pixels, so 1 is the old opaque black.
			ctx.clearRect(0, 0, width, height);
			ctx.lineJoin = "round";
			ctx.lineCap = "round";
			// BANK: the whole picture rolls a little with the sway, about the bright ring's center. Undone before the glow,
			// and put back only for the filled now line, which is painted after the glow.
			const bankAngle = Math.sin(swayClock * 0.2) * K.BANK * 0.05;
			const banked = K.BANK > 0;
			const applyBank = () => {
				ctx.save();
				ctx.translate(cx, cy);
				ctx.rotate(bankAngle);
				ctx.translate(-cx, -cy);
			};
			if (banked) applyBank();
			// outside the bright ring is the ground, inside it is the sky. Oversized so a rolled view still covers the
			// corners. One fill when they match, which is every frame until a knob moves.
			ctx.fillStyle = rgbString(BLACK, K.BELOW);
			ctx.fillRect(-width, -height, width * 3, height * 3);
			// @why - painting the inside over the outside cannot clear it. A transparent disk leaves the outside black
			// showing through, so the disk is erased first and only then painted at its own opacity.
			if (K.SKY !== K.BELOW) {
				ctx.save();
				ctx.globalCompositeOperation = "destination-out";
				ctx.beginPath();
				ctx.arc(cx, cy, rNow, 0, TAU);
				ctx.fillStyle = rgbString(BLACK);
				ctx.fill();
				ctx.restore();
				if (K.SKY > 0) {
					ctx.beginPath();
					ctx.arc(cx, cy, rNow, 0, TAU);
					ctx.fillStyle = rgbString(BLACK, K.SKY);
					ctx.fill();
				}
			}

			// ---- 1. the glow at the center ----------------------------------------------------------------------
			// brightness follows the next twelve beats, colour the coming section. Drawn first so the inner rings
			// silhouette against it; kept dim because the glow pass blooms whatever is bright.
			if (FEATURES.horizon.on) {
				const strength = smoothstep((ahead - 0.1) / 0.45) * presence * fade;
				if (strength > 0.01) {
					const far = tint(rel(ahead), 0);
					const lean = FEATURES.grid.on ? keyHueAt(shown, viewTime + K.FUTURE_BEATS * beat * 0.8) * COLOURS.harmony : liveHue;
					skyLean = Number.isNaN(skyLean) || !isPlaying ? lean : skyLean + (lean - skyLean) * Math.min(1, c.dt / 0.6);
					const sky = hslToRgb(familyHue(pal, far, skyLean, turn * 0.3), far.s * 0.85, Math.min(0.7, far.l + 0.05));
					const gx = centerAt(zFar);
					const glowR = Math.max(1, short * K.SKY_HEIGHT);
					const dawn = ctx.createRadialGradient(gx, cy, 0, gx, cy, glowR);
					const a = K.SKY_BRIGHT * strength;
					dawn.addColorStop(0, rgbString(sky, a));
					dawn.addColorStop(0.2, rgbString(sky, a * 0.6));
					dawn.addColorStop(0.45, rgbString(sky, a * 0.25));
					dawn.addColorStop(0.7, rgbString(sky, a * 0.07));
					dawn.addColorStop(1, rgbString(sky, 0));
					ctx.fillStyle = dawn;
					ctx.beginPath();
					ctx.arc(gx, cy, glowR, 0, TAU);
					ctx.fill();
				}
			}

			// ---- 6. the dust ------------------------------------------------------------------------------------
			// specks carried at the rings' speed on the track's clock: short streaks along the line of flight,
			// outside the baseline so a ring never hides one
			if (FEATURES.dust.on && presence > 0.02) {
				const span = K.PAST_BEATS + K.FUTURE_BEATS;
				const light = presence * (0.1 + c.energy * 0.5) * K.DUST_LIGHT;
				ctx.lineWidth = Math.max(1, scale * 0.0011);
				// one stroke per speck: a path's GPU cost goes by the area it spans
				for (let i = 0; i < DUST; i++) {
					const along = (((dust[i * 4 + 2] * span - viewTime / beat) % span) + span) % span;
					const z = K.Z_NOW + (along - K.PAST_BEATS) * beat * zPerSec;
					if (z < 1.02) continue;
					const a = farAt(z) * playedAt(z) * light * dust[i * 4 + 3];
					if (a < 0.015) continue;
					const z2 = z + 0.08;
					const across = Math.max(-1, Math.min(1, dust[i * 4] / 2.4));
					ctx.strokeStyle = rgbString(liveRgb, Math.min(0.42, a * 1.2));
					const streak = (reflected: boolean) => {
						const [x1, y1] = place(z, across, (dust[i * 4 + 1] * ridge) / z, reflected);
						const [x2, y2] = place(z2, across, (dust[i * 4 + 1] * ridge) / z2, reflected);
						ctx.beginPath();
						ctx.moveTo(x1, y1);
						ctx.lineTo(x2, y2);
						ctx.stroke();
					};
					streak(false);
					if (mirrored) streak(true);
				}
			}

			// ---- one ring: the band between its baseline and its crest, then the crest line ----------------------
			//   flat     how much of its height it still has (what has been played sinks)
			//   alpha    the line's strength
			//   glint    how brightly its body is lit from "now" (4)
			const row = (data: Float32Array, z: number, flat: number, alpha: number, lineWidth: number, lean: number, level: number, glint: number, turned = 0, dir = 1) => {
				const rBase = radiusAt(z);
				const lift = liftOf(z, flat);
				const h = heightsOf(data);
				// beyond FINE_UNTIL every other point is drawn, and a ring so small that its points are under a pixel
				// and a half apart is drawn with fewer still. A mirror draws the full circle, so it is measured that way.
				const around = (mirrored ? 1 : arc) * TAU;
				const stride = Math.max(z > K.FINE_UNTIL ? 2 : 1, Math.min(8, Math.ceil((1.5 * (POINTS - 1)) / Math.max(8, rBase * around))));
				let nIdx = 0;
				for (let i = 0; i < POINTS; i += stride) indexBuf[nIdx++] = i;
				if (indexBuf[nIdx - 1] !== POINTS - 1) indexBuf[nIdx++] = POINTS - 1;
				const crestOf = (i: number) => dir * h[i] * lift;
				const first = { on: true };
				const dot = (i: number, reflected: boolean, radial: number) => {
					const [x, y] = place(z, ACROSS[i], radial, reflected);
					if (first.on) {
						ctx.moveTo(x, y);
						first.on = false;
					} else ctx.lineTo(x, y);
				};
				// upper half forward, then the same samples back on the reflection. The baseline returns the other way.
				const traceCrest = () => {
					for (let k = 0; k < nIdx; k++) dot(indexBuf[k], false, crestOf(indexBuf[k]));
					if (mirrored) for (let k = nIdx - 1; k >= 0; k--) dot(indexBuf[k], true, crestOf(indexBuf[k]));
				};
				const traceBaseline = () => {
					if (mirrored) {
						for (let k = 0; k < nIdx; k++) dot(indexBuf[k], true, 0);
						for (let k = nIdx - 1; k >= 0; k--) dot(indexBuf[k], false, 0);
					} else for (let k = nIdx - 1; k >= 0; k--) dot(indexBuf[k], false, 0);
				};
				// @what - a closed ring is two loops; an open arc stays one ribbon
				// @why - the ribbon's two walls sit one sample apart, so the black behind the ring shows through that ray
				ctx.beginPath();
				if (closed || mirrored) {
					traceCrest();
					ctx.closePath();
					first.on = true;
					traceBaseline();
					ctx.closePath();
				} else {
					traceCrest();
					traceBaseline();
					ctx.closePath();
				}
				const fillBand = () => {
					if (closed || mirrored) ctx.fill("evenodd");
					else ctx.fill();
				};

				// ---- 3. colour by height, the ring's own colour ----
				// hue is the section's, depth removes saturation (haze), the ring's loudness sets lightness
				const far = Math.max(0, Math.min(1, (z - K.Z_NOW) / (zFar - K.Z_NOW)));
				const base = tint(rel(level), 1 - far);
				const sat = base.s * 0.9 * (FEATURES.height.on ? 1 - far * 0.45 : 1);
				const hue = familyHue(pal, base, lean, turned);
				const rgb = hslToRgb(hue, sat, base.l * (FEATURES.height.on ? 0.42 + level * 0.5 : 0.55 + level * 0.6));

				// ---- 4. lit mountains ----
				// body faintly lit from the crest inward: the light goes in the colour, never the alpha, or it stops hiding
				// the rings behind. Kept dim so the glow pass leaves it alone.
				// UNDER is how see-through that black is. The crest stroke below is not multiplied.
				const solid = Math.min(1, flat * 1.5) * K.FILL * K.UNDER;
				// @why - the sky is already painted under this shape, so a thinner body would still look black.
				// The shape is cleared first and the black put back at `solid`. Rings drawn behind this one
				// go with the sky: the same pixels cannot hide them and show the page.
				if (K.UNDER < 1) {
					ctx.save();
					ctx.globalCompositeOperation = "destination-out";
					ctx.fillStyle = rgbString(BLACK);
					fillBand();
					ctx.restore();
				}
				const gx = centerAt(z);
				// the lit colour sits on the crest, whichever side of the baseline that is
				const crestR = Math.max(1, rBase + dir * lift * 1.1);
				const litInner = crestR < rBase;
				if (FEATURES.lit.on && glint > 0.03 && Math.abs(crestR - rBase) > 0.5) {
					const body = ctx.createRadialGradient(gx, cy, Math.min(rBase, crestR), gx, cy, Math.max(rBase, crestR));
					const lit = rgbString({ r: rgb.r * glint, g: rgb.g * glint, b: rgb.b * glint }, solid);
					const dark = rgbString(BLACK, solid);
					body.addColorStop(0, litInner ? lit : dark);
					body.addColorStop(1, litInner ? dark : lit);
					ctx.fillStyle = body;
				} else ctx.fillStyle = rgbString(BLACK, solid);
				fillBand();
				if (alpha < 0.004) return;

				// ---- 3. colour by height, the peaks ----
				// one radial stroke (a second stroke costs a quarter of the frame); no height, flat colour
				ctx.beginPath();
				first.on = true;
				traceCrest();
				if (closed || mirrored) ctx.closePath();
				ctx.lineWidth = lineWidth;
				if (FEATURES.height.on && Math.abs(crestR - rBase) > 0.5) {
					const pale = hslToRgb(hue, sat * 0.55, Math.min(0.9, base.l + 0.26));
					const peakR = Math.max(1, rBase + dir * lift * 1.15);
					const up = ctx.createRadialGradient(gx, cy, Math.min(rBase, peakR), gx, cy, Math.max(rBase, peakR));
					const atBase = rgbString(rgb, alpha);
					const atPeak = rgbString(pale, Math.min(1, alpha * 1.7));
					const peakInner = peakR < rBase;
					up.addColorStop(0, peakInner ? atPeak : atBase);
					up.addColorStop(1, peakInner ? atBase : atPeak);
					ctx.strokeStyle = up;
				} else ctx.strokeStyle = rgbString(rgb, alpha);
				ctx.stroke();
			};

			// ---- the line at "now" --------------------------------------------------------------------------
			shape(target, shown, viewTime, step);
			const chase = Math.min(1, 14 * c.dt);
			// (paused, it is simply where it would have got to)
			for (let i = 0; i < POINTS + 2; i++) live[i] += (target[i] - live[i]) * (isPlaying ? chase : 1);
			// 8. the notes of the sound under "now", eased the way the line is
			if (FEATURES.strands.on) {
				if (strandSeen !== strandKey()) {
					setStrandHills();
					strandSeen = strandKey();
				}
				const now = shown && target[LEVEL] > 0 ? segmentAt(shown.segments, viewTime) : null;
				strandAmp += (Math.pow(target[LEVEL], 0.8) * 1.5 - strandAmp) * (isPlaying ? chase : 1);
				for (let k = 0; k < 12; k++) strandW[k] += ((shown && target[LEVEL] > 0 ? (now ? Math.pow(now.pitches[k], 1.5) : 0.35) : 0) - strandW[k]) * (isPlaying ? chase : 1);
			}
			// the body takes its place in the terrain; the line is drawn last, over the rows in front of it
			const drawLive = () => row(live, K.Z_NOW, 1, 0, 1, liveHue, live[LEVEL], 0.14 + c.energy * 0.3, turn, dirOf(rowBefore(viewTime)));

			// ---- a sound has just been played: the mountains as they stand now are its echo ---------------------
			const segs = shown?.segments;
			let count = 0;
			if (segs && segs.length > 0 && segs[0].start <= viewTime) {
				let lo = 0;
				let hi = segs.length - 1;
				while (lo < hi) {
					const mid = (lo + hi + 1) >> 1;
					if (segs[mid].start <= viewTime) lo = mid;
					else hi = mid - 1;
				}
				count = lo + 1;
			}
			if (played >= 0 && count > played && count - played <= 3 && segs) {
				const seg = segs[count - 1];
				const echo = echoes.length < ECHO_MAX ? { data: new Float32Array(POINTS), age: 0, amp: 0 } : echoes.shift()!;
				// `target`, not the eased line: the shape this sound has
				echo.data.set(target.subarray(0, POINTS));
				echo.age = 0;
				echo.amp = Math.min(1.2, Math.pow(10, seg.loudness_max / 20) / (shown?.hitScale || 0.56));
				echoes.push(echo);
			}
			played = count;

			// ---- 2. bars and section gates, the gates -------------------------------------------------------------
			// a row exactly on each section boundary, in the pale colour of the section it opens: a line and a colour only,
			// since sections are a timbral segmentation that can miss choruses; unsure boundaries are fainter.
			const sections = FEATURES.grid.on ? shown?.sections : undefined;
			let gate = -1;
			if (sections) for (let i = sections.length - 1; i >= 1; i--) if (sections[i].start <= viewTime + K.FUTURE_BEATS * beat) {
				gate = i;
				break;
			}
			const gatesBehind = (time: number) => {
				while (sections && gate >= 1 && sections[gate].start >= time) {
					const at = sections[gate].start;
					const tau = at - viewTime;
					const z = K.Z_NOW + tau * zPerSec;
					if (z >= 1 && z <= zFar) {
						let data = gates.get(gate);
						if (!data) {
							data = new Float32Array(POINTS + 2);
							shape(data, shown, at, step);
							gates.set(gate, data);
						}
						const sure = 0.35 + Math.min(1, sections[gate].confidence) * 0.65;
						row(data, z, playedAt(z) * sunkAt(tau) * farAt(z), farAt(z) * playedAt(z) * 0.85 * sure, Math.max(1.2, (scale * 0.003 * K.Z_NOW) / z), data[HUE] * COLOURS.harmony, 1, 0, turn, dirOf(rowBefore(at)));
					}
					gate--;
				}
			};

			// ---- the terrain, far to near ------------------------------------------------------------------------
			const nearest = Math.max(0, rowBefore(viewTime - K.PAST_BEATS * beat));
			const furthest = Math.min(rowTimes.length - 1, rowBefore(viewTime + K.FUTURE_BEATS * beat) + 1);
			for (const n of rows.keys()) if (n < nearest || n > furthest) rows.delete(n);
			let liveDrawn = false;
			// a long stretch of rows (FUTURE_BEATS, the gap knobs at their extremes) thins its far, weightless rows
			const thin = Math.max(1, Math.ceil((furthest - nearest + 1) / MAX_ROWS));
			// radius of the last ring drawn: far rings bunch up toward the center, and a flat one less than a pixel
			// outside the last is hidden by it anyway
			let lastBase = -Infinity;
			for (let n = furthest; n >= nearest; n--) {
				const time = rowTimes[n];
				const tau = time - viewTime;
				if (!liveDrawn && tau < 0) {
					gatesBehind(viewTime);
					drawLive();
					liveDrawn = true;
				}
				const z = K.Z_NOW + tau * zPerSec;
				if (z < 1 || z > zFar) continue;
				if (thin > 1 && z > K.FINE_UNTIL && n % thin !== 0 && rowWeights[n] < 0.5) continue;
				const rBase = radiusAt(z);
				if (rBase - lastBase < 1 && (ridge / z) * K.RIDGE_LIMIT * playedAt(z) * sunkAt(tau) * farAt(z) * presence < 1) continue;
				lastBase = rBase;
				let data = rows.get(n);
				if (!data) {
					data = new Float32Array(POINTS + 2);
					// averaged over the row's own stretch: half the way to its neighbours, at most a half-beat
					const reach = Math.min(step, (rowTimes[Math.min(rowTimes.length - 1, n + 1)] - rowTimes[Math.max(0, n - 1)]) / 2);
					shape(data, shown, time, Math.max(0.03, reach));
					rows.set(n, data);
				}
				gatesBehind(time);
				const seen = farAt(z) * playedAt(z);
				// a row brightens as it comes under the playhead: the beat, crossing "now"
				const crossing = Math.exp(-Math.pow(tau / (beat * 0.35), 2));
				const level = data[LEVEL];
				// ---- 2. bars and section gates, the bars ----
				// the first beat of a bar is a little brighter and heavier
				const bar = FEATURES.grid.on && rowBars[n];
				// an accent is heavier and brighter; a filler row is faintest
				const weight = rowWeights[n];
				// how near "now" it is: what lights its body (4)
				const near = Math.exp(-Math.pow(tau / (beat * 2), 2));
				// PULSE: a row on a beat of the grid stands a little taller than one between; fixed to the row's own time,
				// so it rolls towards the viewer with the terrain
				const pulse = K.PULSE > 0 ? Math.max(0.4, 1 + K.PULSE * 0.3 * Math.cos((Math.PI * 2 * (time - (shown?.beats[0]?.start ?? 0))) / beat)) : 1;
				row(
					data,
					z,
					playedAt(z) * sunkAt(tau) * farAt(z) * pulse,
					seen * (0.07 + level * 0.42 + weight * 0.3 + crossing * 0.3 + (bar ? 0.2 : 0)),
					Math.max(1, (scale * (bar ? 0.0028 : 0.0012 + weight * 0.0012) * K.Z_NOW) / z),
					FEATURES.grid.on ? data[HUE] * COLOURS.harmony : liveHue,
					level,
					near * (0.06 + c.energy * 0.22),
					0,
					dirOf(n)
				);
			}
			if (!liveDrawn) {
				gatesBehind(viewTime);
				drawLive();
			}
			gatesBehind(-1e9);

			// ---- the echoes: a skin stretched between the ring and where the mountains stood ---------------------
			// it lifts off only where the mountain was, outward, or inward when that ring points inward
			const liftNow = liftOf(K.Z_NOW, 1);
			const life = K.ECHO_BEATS * beat;
			const dirNow = dirOf(rowBefore(viewTime));
			const srcH = heightsOf(live);
			for (let i = 0; i < POINTS; i++) liveH[i] = srcH[i];
			const atNow = (i: number, height: number, reflected: boolean) => place(K.Z_NOW, ACROSS[i], dirNow * height * liftNow, reflected);
			// 9. colour by note: one conic gradient around the ring, a stop at each lane, opaque (the alpha is set on the context).
			// Built again for the filled line, because that fill is painted after the bank is undone and put back.
			const makeNoteGrad = () => {
				if (!(FEATURES.notes.on && K.NOTE_COLOUR > 0.01)) return null;
				const start = angleOf(-1);
				const grad = ctx.createConicGradient(start, centerAt(K.Z_NOW), cy);
				const stops: { t: number; r: number; g: number; b: number }[] = [];
				let prev = -1;
				const spanOf = laneSpan();
				for (let f = 0; f < 12; f++) {
					const n = noteRgb[f];
					const m = K.NOTE_COLOUR;
					const lane = -spanOf + (2 * spanOf * f) / 11;
					let d = angleOf(lane) - start;
					d = ((d % TAU) + TAU) % TAU;
					let t = d / TAU;
					// stops have to climb, and stay off the exact ends where the seam is one ray
					if (t <= prev) t = Math.min(0.998, prev + 0.0008);
					else t = Math.min(0.998, Math.max(0.001, t));
					prev = t;
					const color = { r: liveRgb.r + (n.r - liveRgb.r) * m, g: liveRgb.g + (n.g - liveRgb.g) * m, b: liveRgb.b + (n.b - liveRgb.b) * m };
					stops.push({ t, ...color });
					// the reflection carries the same colour, so each side join is one colour meeting itself
					if (mirrored) {
						const back = 1 - t;
						if (back > t + 0.001 && back < 0.999) stops.push({ t: back, ...color });
					}
				}
				if (!mirrored) {
					// @what - fade the last note's colour into the first across the open bottom
					// @why - pinning each end colour up to the seam makes the bright ring step from one to the other
					const first = stops[0];
					const last = stops[stops.length - 1];
					const span = first.t + 1 - last.t;
					const steps = 8;
					for (let s = 1; s < steps; s++) {
						const u = s / steps;
						let t = last.t + span * u;
						if (t >= 1) t -= 1;
						stops.push({ t, r: last.r + (first.r - last.r) * u, g: last.g + (first.g - last.g) * u, b: last.b + (first.b - last.b) * u });
					}
					const uSeam = span > 1e-6 ? (1 - last.t) / span : 0;
					const seam = { r: last.r + (first.r - last.r) * uSeam, g: last.g + (first.g - last.g) * uSeam, b: last.b + (first.b - last.b) * uSeam };
					stops.push({ t: 0, ...seam });
					stops.push({ t: 0.999, ...seam });
				}
				stops.sort((p, q) => p.t - q.t);
				let placed = -1;
				for (const stop of stops) {
					let t = Math.max(0, Math.min(0.999, stop.t));
					if (t <= placed) t = placed + 0.0004;
					if (t > 0.999) continue;
					placed = t;
					grad.addColorStop(t, rgbString(stop));
				}
				return grad;
			};
			const noteGrad = makeNoteGrad();
			ctx.save();
			ctx.globalCompositeOperation = "lighter";
			for (let e = echoes.length - 1; e >= 0; e--) {
				const echo = echoes[e];
				echo.age += c.dt;
				const t = echo.age / life;
				if (t >= 1) {
					echoes.splice(e, 1);
					continue;
				}
				// it arrives over a few frames rather than appearing, and leaves slower than it came
				const a = smoothstep(echo.age / 0.04) * (1 - t) * (1 - t) * Math.min(1, 0.2 + echo.amp * 0.6) * presence;
				if (a < 0.01) continue;
				const swell = 1 + (1 - (1 - t) * (1 - t)) * (K.ECHO_SWELL_SOFT + Math.min(1, echo.amp) * (K.ECHO_SWELL_HARD - K.ECHO_SWELL_SOFT));
				const eh = heightsOf(echo.data);
				const echoH = (i: number) => eh[i] * swell;
				const up = (i: number) => echoH(i) > liveH[i] + 0.004;
				// the skin: a closed ring is two loops. An open arc stays one ribbon, because its ends are real.
				ctx.beginPath();
				let first = true;
				const add = (i: number, height: number, reflected: boolean) => {
					const [x, y] = atNow(i, height, reflected);
					if (first) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
					first = false;
				};
				const traceEchoCrest = () => {
					for (let i = 0; i < POINTS; i++) add(i, Math.max(echoH(i), liveH[i]), false);
					if (mirrored) for (let i = POINTS - 1; i >= 0; i--) add(i, Math.max(echoH(i), liveH[i]), true);
				};
				const traceEchoBase = () => {
					if (mirrored) for (let i = 0; i < POINTS; i++) add(i, liveH[i], true);
					for (let i = POINTS - 1; i >= 0; i--) add(i, liveH[i], false);
				};
				if (closed || mirrored) {
					traceEchoCrest();
					ctx.closePath();
					first = true;
					traceEchoBase();
					ctx.closePath();
				} else {
					traceEchoCrest();
					traceEchoBase();
					ctx.closePath();
				}
				if (noteGrad) {
					ctx.globalAlpha = a * 0.22;
					ctx.fillStyle = noteGrad;
				} else ctx.fillStyle = rgbString(liveRgb, a * 0.22);
				if (closed || mirrored) ctx.fill("evenodd");
				else ctx.fill();
				// its edge: the crest where the echo stands off. A closed ring is not capped, or the cap at the join is a spoke.
				ctx.beginPath();
				let allUp = closed || mirrored;
				if (allUp) for (let i = 0; i < POINTS; i++) if (!up(i)) { allUp = false; break; }
				if (allUp) {
					for (let i = 0; i < POINTS; i++) {
						const [x, y] = atNow(i, echoH(i), false);
						if (i === 0) ctx.moveTo(x, y);
						else ctx.lineTo(x, y);
					}
					if (mirrored) for (let i = POINTS - 1; i >= 0; i--) {
						const [x, y] = atNow(i, echoH(i), true);
						ctx.lineTo(x, y);
					}
					ctx.closePath();
				} else if (closed || mirrored) {
					// @why - a radial cap at a dip on the join is the spoke. The outline stays on the crest.
					let off = false;
					const step = (i: number, reflected: boolean) => {
						if (!up(i)) { off = false; return; }
						const [x, y] = atNow(i, echoH(i), reflected);
						if (!off) ctx.moveTo(x, y);
						else ctx.lineTo(x, y);
						off = true;
					};
					let downAt = 0;
					for (let i = 0; i < POINTS; i++) if (!up(i)) { downAt = i; break; }
					if (!mirrored) {
						for (let k = 0; k < POINTS; k++) step((downAt + k) % POINTS, false);
					} else {
						for (let i = 0; i < POINTS; i++) step(i, false);
						for (let i = POINTS - 1; i >= 0; i--) step(i, true);
					}
				} else {
					let off = false;
					let prevX = 0;
					let prevY = 0;
					let seen = false;
					const edge = (i: number, reflected: boolean) => {
						const [lx, ly] = atNow(i, liveH[i], reflected);
						if (up(i)) {
							if (!off) ctx.moveTo(seen ? prevX : lx, seen ? prevY : ly);
							const [x, y] = atNow(i, echoH(i), reflected);
							ctx.lineTo(x, y);
							off = true;
						} else if (off) {
							ctx.lineTo(lx, ly);
							off = false;
						}
						prevX = lx;
						prevY = ly;
						seen = true;
					};
					for (let i = 0; i < POINTS; i++) edge(i, false);
					if (mirrored) for (let i = POINTS - 1; i >= 0; i--) edge(i, true);
				}
				if (noteGrad) {
					ctx.globalAlpha = a * 0.85;
					ctx.strokeStyle = noteGrad;
				} else ctx.strokeStyle = rgbString(liveRgb, a * 0.85);
				ctx.lineWidth = Math.max(1, scale * 0.0026 * (1 - t * 0.5));
				ctx.stroke();
			}
			ctx.restore();

			// ---- 8. the strands: the twelve notes of the sound at "now", whose sum is the line -----------------------
			// light only (they add to what is under them): a note's hill, or, with STRAND_WAVE, a wave at the note's pitch
			// ratio sliding along on the track's clock, so a paused picture does not move
			if (FEATURES.strands.on && presence > 0.02 && strandAmp > 0.004) {
				let top = 0;
				for (let k = 0; k < 12; k++) top = Math.max(top, strandW[k]);
				ctx.save();
				ctx.globalCompositeOperation = "lighter";
				ctx.lineWidth = Math.max(1, scale * 0.0024);
				const wave = K.STRAND_WAVE;
				for (let k = 0; k < 12; k++) {
					const w = strandW[k];
					if (w < 0.03) continue;
					const a = Math.min(1, 0.6 * K.STRAND_LIGHT * presence * (0.25 + (0.75 * w) / top));
					if (a < 0.01) continue;
					const ratio = Math.pow(2, k / 12);
					const cycles = 2 * ratio;
					const phase = viewTime * 0.35 * ratio;
					const amp = strandAmp * w;
					for (let i = 0; i < POINTS; i++) {
						let y = STRAND_HILLS[k * POINTS + i];
						// the window fades the ends of a straight line; on a mirror those ends are the side joins
						const win = mirrored ? 1 : STRAND_WINDOW[i];
						if (wave > 0.001) y = y * (1 - wave) + wave * (0.5 + 0.5 * Math.sin(Math.PI * 2 * (cycles * (ACROSS[i] + 1) * 0.5 + phase))) * win;
						strandY[i] = K.RIDGE_LIMIT * Math.tanh((y * amp) / K.RIDGE_LIMIT);
					}
					const sh = heightsOf(strandY);
					ctx.beginPath();
					let first = true;
					const add = (i: number, reflected: boolean) => {
						const [x, y] = atNow(i, sh[i], reflected);
						if (first) ctx.moveTo(x, y);
						else ctx.lineTo(x, y);
						first = false;
					};
					for (let i = 0; i < POINTS; i += 2) add(i, false);
					if ((POINTS - 1) % 2 !== 0) add(POINTS - 1, false);
					if (mirrored) {
						for (let i = POINTS - 1; i >= 0; i -= 2) add(i, true);
						ctx.closePath();
					} else if (closed) ctx.closePath();
					ctx.strokeStyle = rgbString(noteRgb[Math.round(lanePos(k))], a);
					ctx.stroke();
				}
				ctx.restore();
			}

			// ---- the ring itself, on top ----------------------------------------------------------------------------
			// along the crest. The filled copy walks back along the baseline, which is the band under the peaks.
			// LINE only thickens the stroke.
			const strokeNow = () => {
				ctx.beginPath();
				let first = true;
				const add = (i: number, reflected: boolean) => {
					const [x, y] = atNow(i, liveH[i], reflected);
					if (first) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
					first = false;
				};
				for (let i = 0; i < POINTS; i++) add(i, false);
				if (mirrored) for (let i = POINTS - 1; i >= 0; i--) add(i, true);
				if (closed || mirrored) ctx.closePath();
			};
			const fillNow = () => {
				ctx.beginPath();
				let first = true;
				const add = (i: number, height: number, reflected: boolean) => {
					const [x, y] = atNow(i, height, reflected);
					if (first) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
					first = false;
				};
				const traceFillCrest = () => {
					for (let i = 0; i < POINTS; i++) add(i, liveH[i], false);
					if (mirrored) for (let i = POINTS - 1; i >= 0; i--) add(i, liveH[i], true);
				};
				const traceFillBase = () => {
					if (mirrored) for (let i = 0; i < POINTS; i++) add(i, 0, true);
					for (let i = POINTS - 1; i >= 0; i--) add(i, 0, false);
				};
				if (closed || mirrored) {
					traceFillCrest();
					ctx.closePath();
					first = true;
					traceFillBase();
					ctx.closePath();
				} else {
					traceFillCrest();
					traceFillBase();
					ctx.closePath();
				}
			};
			if (!FEATURES.filled.on) {
				strokeNow();
				if (noteGrad) {
					ctx.save();
					ctx.globalAlpha = 0.95;
					ctx.strokeStyle = noteGrad;
				} else ctx.strokeStyle = rgbString(liveRgb, 0.95);
				ctx.lineWidth = Math.max(1.5, scale * 0.0042) * K.LINE;
				ctx.stroke();
				if (noteGrad) ctx.restore();
			}

			if (banked) ctx.restore();

			// the halo swells with the sound itself and with a moment
			glow(ctx, ctx.canvas, width, height, scale, (0.3 + c.energy * 0.6 + c.impact * 0.5) * K.GLOW);

			// @why - the glow adds a brightened blur back with "lighter". On a thin stroke that bloom falls on the
			// black beside it. On a solid fill it stacks across the interior and the colour blows out. Painted
			// after the glow, the fill stays the stroke's own colour, and it does not grow the thin line's halo.
			if (FEATURES.filled.on) {
				if (banked) applyBank();
				fillNow();
				const fillGrad = makeNoteGrad();
				const cover = 0.95 * K.UNDER;
				if (fillGrad) {
					ctx.save();
					ctx.globalAlpha = cover;
					ctx.fillStyle = fillGrad;
				} else ctx.fillStyle = rgbString(liveRgb, cover);
				if (closed || mirrored) ctx.fill("evenodd");
				else ctx.fill();
				if (fillGrad) ctx.restore();
				if (banked) ctx.restore();
			}
		},
		dispose() {
			rows.clear();
			gates.clear();
			glow.dispose();
			setCanvasHoles(false);
		}
	};
}

export const ringPreset: PresetDefinition = { id: "ring", name: "Ring", experimental: true, create };
