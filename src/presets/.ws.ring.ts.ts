
/**
 * GENERATED FILE FROM THE TYPESCRIPT-WORKSHEET EXTENSION
*/
import { createNoise2D } from "simplex-noise";
import { createGlow, createKeyHue, keyHueAt } from "./effects";
import { createConductor } from "./conductor";
import { accentLightness, colourSettings, familyHue, GREY, hslToRgb, palette, paletteAt, Rgb } from "../colours";
import { rankOf, sampleCurve, segmentAt, TrackAudioData } from "../audio-data";
import { Preset, PresetDefinition, rgbString } from "./types";
import { toggleFeature, tune, tuneFeatures, tuneVersion } from "./tune";
import { setCanvasHoles } from "../ui/picture";
import * as __fs from 'node:fs';
import os from 'node:os';
const dataFile: any[] = [];

async function __tsrun() {
try {

const FEATURES =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'FEATURES',  called: () => ({
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
}), line: 16});
const FEATURE_KEYS =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'FEATURE_KEYS',  called: () => (Object.values(FEATURES)), line: 31});
 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (tuneFeatures("ring", FEATURE_KEYS)), line: 32});
// module scope: create() reruns on every preset switch and would leave a listener behind each time
if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (typeof window !== "undefined" && typeof window.addEventListener === "function"), line: 34})) {
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (window.addEventListener("visualizer-feature", (event: Event) => {
    		const detail =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'detail',  called: () => ((event as CustomEvent<{ preset: string | null; n: number } | null>).detail), line: 36});
    		const feature =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'feature',  called: () => (detail && detail.preset === ringPreset.id ? FEATURE_KEYS[detail.n - 1] : undefined), line: 37});
    		if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (!feature), line: 38})) return;
    		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (toggleFeature(ringPreset.id, feature)), line: 39});
    		if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (typeof Spicetify !== "undefined"), line: 40}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (Spicetify.showNotification(`Ring ${detail!.n}: ${feature.name} ${feature.on ? "ON" : "off"}`)), line: 40});
    	})), line: 35});
}

// ---- time, in beats of the track ------------------------------------------------------------------------
// how much of the future is on screen, how much of the past, and how many rows a beat is cut into
const FUTURE_BEATS =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'FUTURE_BEATS',  called: () => (6.34), line: 46});
const PAST_BEATS =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'PAST_BEATS',  called: () => (1.42), line: 47});
const ROWS_PER_BEAT =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'ROWS_PER_BEAT',  called: () => (2), line: 48});
// rows on accents, in beats: minimum spacing, and longest stretch of ground without a row
const ROW_GAP_MIN =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'ROW_GAP_MIN',  called: () => (0.09037), line: 50});
const ROW_GAP_MAX =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'ROW_GAP_MAX',  called: () => (0.9988), line: 51});

// ---- the view -------------------------------------------------------------------------------------------
// depth is 1 at the outside of the picture; "now" sits at Z_NOW, and the radius there is the diameter knob.
// GROUND is how far the other rings leave that one: future inward, past outward.
const Z_NOW =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'Z_NOW',  called: () => (1.637), line: 56});
const GROUND =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'GROUND',  called: () => (0.6375), line: 57});
// how far a peak stands off a ring, as a fraction of the shorter screen side at depth 1
const RIDGE =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'RIDGE',  called: () => (0.34), line: 59});
// the bright ring's diameter, as a fraction of the shorter screen side. Past rings and peaks sit outside it.
const DIAMETER =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'DIAMETER',  called: () => (0.55), line: 61});
// camera spread, quietest to loudest; LATELY_* is the measured level range (5th to 95th), LEAD_FULL a real build
const CAMERA_LOW =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'CAMERA_LOW',  called: () => (0.3463), line: 63});
const CAMERA_HIGH =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'CAMERA_HIGH',  called: () => (1.53), line: 64});
const LATELY_QUIET =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'LATELY_QUIET',  called: () => (0.154), line: 65});
const LATELY_LOUD =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'LATELY_LOUD',  called: () => (0.4899), line: 66});
const LEAD_FULL =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'LEAD_FULL',  called: () => (0.15), line: 67});
// rows nearer than this are drawn with every point; beyond it they are small enough for half of them
const FINE_UNTIL =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'FINE_UNTIL',  called: () => (3.6), line: 69});

// ---- a row's shape ----------------------------------------------------------------------------------------
// how many samples span one row. The slider moves this; the tables below are rebuilt to match, so it is not a const.
let POINTS =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'POINTS',  called: () => (192), line: 73}); ///96;
// loudness, then the section's colour, in the two slots after the samples. They sit at this index, so they move
// when the count does: a row shaped at the old count keeps them at the old index and cannot be reused.
let LEVEL =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'LEVEL',  called: () => (POINTS), line: 76});
let HUE =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'HUE',  called: () => (POINTS + 1), line: 77});
// how far across the outermost pitch lanes sit, and how wide one note's hill is (in half-widths)
const LANE_SPAN =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'LANE_SPAN',  called: () => (0.6152), line: 79});
const HILL =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'HILL',  called: () => (0.07583), line: 80});
// how tall a ridge may get before it is rounded off
const RIDGE_LIMIT =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'RIDGE_LIMIT',  called: () => (0.855), line: 82});
// jaggedness of a sharp sound, and smoothing radius along the line in points (of 96)
const JAG =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'JAG',  called: () => (0.35), line: 84});
const SMOOTH =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'SMOOTH',  called: () => (1.5), line: 85});
// echo: lifetime in beats, swell by the end for the quietest sound and for a big hit, max alive
const ECHO_BEATS =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'ECHO_BEATS',  called: () => (0.9685), line: 87});
const ECHO_SWELL_SOFT =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'ECHO_SWELL_SOFT',  called: () => (0.1825), line: 88});
const ECHO_SWELL_HARD =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'ECHO_SWELL_HARD',  called: () => (1.058), line: 89});
const ECHO_MAX =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'ECHO_MAX',  called: () => (12), line: 90});
// how many specks of dust are in the air
const DUST =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'DUST',  called: () => (70), line: 92});
// center glow: radius as a fraction of the shorter screen side, and peak brightness
const SKY_HEIGHT =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'SKY_HEIGHT',  called: () => (0.2252), line: 94});
const SKY_BRIGHT =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'SKY_BRIGHT',  called: () => (0.425), line: 95});

const K =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'K',  called: () => (tune("ring", {
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
	INVERT_EVERY_X_RINGS: [0, -1, 5, "normal rings before an inward one"],
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
		INVERT_EVERY_X_RINGS: "After this many outward rings, the next ring's peaks point inward. 0 keeps every peak pointing outward. 1 inverts every other ring.",
		SKY: "How solid the black inside the bright ring is. At 1 it is black; at 0 that disk is a hole through to the page, even when the outside is solid. The center glow, the dust and the rings stay drawn on top.",
		BELOW: "How solid the black outside the bright ring is. At 1 it is black; lower opens that ground onto the page. It does not paint the inside. Rings that have already grown past it still draw over it.",
		UNDER: "How solid the black under each ridge is. The crest lines stay. At 1 a ring hides what is behind its band; lower lets the page through, and the rings behind show through with it. The filled now line thins with this too. FILL still sets how solid the body is before this."
	},
	// shown without "More"; the rest is for whoever wants to dig
	["FUTURE_BEATS", "DIAMETER", "RIDGE", "Z_NOW", "SMOOTH", "ECHO_BEATS", "SKY_BRIGHT", "GLOW", "BEND"]
)), line: 97});

// what the gradient can follow here (see colours.ts)
const COLOURS =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'COLOURS',  called: () => (colourSettings("ring", [
	["height", "Height", "Valleys take the first colour, peaks the last: the louder a moment, the further along"],
	["depth", "Depth", "Far away, toward the center, takes the first colour; the bright ring, up close, the last"],
	["sound", "Sound", "The whole picture slides along the colours with how loud the music is"]
])), line: 199});

const smoothstep =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'smoothstep',  called: () => ((t: number) => {
	const u =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'u',  called: () => (Math.max(0, Math.min(1, t))), line: 206});
	return u * u * (3 - 2 * u);
}), line: 205});
const beatOf =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'beatOf',  called: () => ((audio: TrackAudioData | null) => (audio?.tempo && audio.tempo > 40 ? 60 / audio.tempo : 0.5)), line: 209});
const BLACK =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'BLACK',  called: () => ({ r: 0, g: 0, b: 0 }), line: 210});
const TAU =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'TAU',  called: () => (Math.PI * 2), line: 211});

// where each point of a row sits across the terrain, -1..1, and each pitch class's hill over those points.
// Empty until setResolution: the length is the point count, so a new count is a new table, not a refill of this one.
let ACROSS =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'ACROSS',  called: () => (new Float32Array(0)), line: 215});
let BLUR =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'BLUR',  called: () => (new Float32Array(0)), line: 216});
let HILLS =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'HILLS',  called: () => (new Float32Array(0)), line: 217});
// the same hills narrower and wider, for TIMBRE_HILL: a ringing sound is drawn with the narrow ones, a dull one with the wide
let HILLS_NARROW =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'HILLS_NARROW',  called: () => (new Float32Array(0)), line: 219});
let HILLS_WIDE =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'HILLS_WIDE',  called: () => (new Float32Array(0)), line: 220});
// which of the 12 places across the terrain a note stands in (0..11, left to right): in fifths, C G D A E B F# C# G# D# A# F,
// so a triad is three neighbouring lanes; LANE_ORDER takes it to semitones. Between the two it is a place in between.
const lanePos =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'lanePos',  called: () => ((k: number) => ((k * 7) % 12) * (1 - K.LANE_ORDER) + k * K.LANE_ORDER), line: 223});
// the mirrored ring fills the semicircle with notes; the saved lane spread is left alone
const laneSpan =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'laneSpan',  called: () => (() => (FEATURES.mirror.on ? 1.5 : K.LANE_SPAN)), line: 225});
const laneOf =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'laneOf',  called: () => ((k: number) => {
	const span =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'span',  called: () => (laneSpan()), line: 227});
	return -span + (2 * span * lanePos(k)) / 11;
}), line: 226});
// a function: turning a knob redoes the table
const setHills =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'setHills',  called: () => (() => {
	for (let k = 0; k < 12;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (k++), line: 232})) {
		const lane =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'lane',  called: () => (laneOf(k)), line: 233});
		for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 234})) {
			const x =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'x',  called: () => (ACROSS[i] - lane), line: 235});
			const d =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'd',  called: () => (x / K.HILL), line: 236});
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (HILLS[k * POINTS + i] = Math.exp(-d * d)), line: 237});
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (HILLS_NARROW[k * POINTS + i] = Math.exp(-d * d * 2.8)), line: 238});
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (HILLS_WIDE[k * POINTS + i] = Math.exp((-d * d) / 2.8)), line: 239});
		}
	}
}), line: 231});

// gaussian smoothing weights along a row, made once per SMOOTH rather than one Math.exp per tap per point
let KERNEL =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'KERNEL',  called: () => (new Float32Array(1)), line: 245});
let KERNEL_REACH =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'KERNEL_REACH',  called: () => (0), line: 246});
let KERNEL_SUM =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'KERNEL_SUM',  called: () => (1), line: 247});
const setKernel =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'setKernel',  called: () => (() => {
	const radius =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'radius',  called: () => (K.SMOOTH), line: 249});
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (KERNEL_REACH = radius > 0.05 ? Math.ceil(radius * 2) : 0), line: 250});
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (KERNEL = new Float32Array(KERNEL_REACH * 2 + 1)), line: 251});
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (KERNEL_SUM = 0), line: 252});
	for (let d = -KERNEL_REACH; d <= KERNEL_REACH;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (d++), line: 253})) {
		const w =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'w',  called: () => (Math.exp((-d * d) / (2 * Math.max(0.05, radius) * Math.max(0.05, radius)))), line: 254});
		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (KERNEL[d + KERNEL_REACH] = w), line: 255});
		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (KERNEL_SUM += w), line: 256});
	}
}), line: 248});
 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (setKernel()), line: 259});

// ---- 8. pitch strands: the twelve parts of the line at "now" --------------------------------------------------
// each note's own hill, wider than the mountains' so neighbours overlap and cross; and, for the wave, where across
// the terrain a note's wave is strong (it fades to flat ground at both ends)
let STRAND_HILLS =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'STRAND_HILLS',  called: () => (new Float32Array(0)), line: 264});
let STRAND_WINDOW =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'STRAND_WINDOW',  called: () => (new Float32Array(0)), line: 265});
const setStrandHills =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'setStrandHills',  called: () => (() => {
	const sigma =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'sigma',  called: () => (K.HILL + K.STRAND_SPREAD * 0.45), line: 267});
	for (let k = 0; k < 12;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (k++), line: 268})) {
		const lane =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'lane',  called: () => (laneOf(k)), line: 269});
		for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 270})) {
			const d =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'd',  called: () => ((ACROSS[i] - lane) / sigma), line: 271});
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (STRAND_HILLS[k * POINTS + i] = Math.exp(-d * d)), line: 272});
		}
	}
}), line: 266});

// A new point count rebuilds every table the row is drawn from. The samples always run from -1 to 1, so fewer
// points are a coarser row across the whole width, not a crop of the left side. The slider steps by 12; a stored
// value is snapped to that so the tables and the knob stay on the same count. LEVEL and HUE are re-aimed at the
// two slots after the new samples.
const setResolution =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'setResolution',  called: () => ((n: number) => {
	const next =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'next',  called: () => (Math.max(96, Math.min(1200, Math.round(n / 12) * 12))), line: 282});
	if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (next === POINTS && ACROSS.length === next), line: 283})) return false;
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (POINTS = next), line: 284});
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (LEVEL = POINTS), line: 285});
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (HUE = POINTS + 1), line: 286});
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ACROSS = new Float32Array(POINTS)), line: 287});
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (BLUR = new Float32Array(POINTS)), line: 288});
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (HILLS = new Float32Array(12 * POINTS)), line: 289});
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (HILLS_NARROW = new Float32Array(12 * POINTS)), line: 290});
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (HILLS_WIDE = new Float32Array(12 * POINTS)), line: 291});
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (STRAND_HILLS = new Float32Array(12 * POINTS)), line: 292});
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (STRAND_WINDOW = new Float32Array(POINTS)), line: 293});
	for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 294})) {
		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ACROSS[i] = -1 + (2 * i) / (POINTS - 1)), line: 295});
		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (STRAND_WINDOW[i] = 1 - Math.pow(Math.abs(ACROSS[i]), 4)), line: 296});
	}
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (setHills()), line: 298});
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (setStrandHills()), line: 299});
	return true;
}), line: 281});
 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (setResolution(K.POINTS)), line: 302});

const strandKey =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'strandKey',  called: () => (() => [laneSpan(), K.HILL, K.STRAND_SPREAD, K.LANE_ORDER].join("|")), line: 304});

// what a cached row's shape depends on, and what the grid of rows depends on: a knob that is neither (GLOW, LINE, RIDGE,
// the sky, the camera) no longer makes every row be shaped again
const shapeKey =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'shapeKey',  called: () => (() => [laneSpan(), K.HILL, K.JAG, K.SMOOTH, K.RIDGE_LIMIT, K.LANE_ORDER, K.TIMBRE_HILL].join("|")), line: 308});
const gridKey =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'gridKey',  called: () => (() => [K.FUTURE_BEATS, K.PAST_BEATS, K.ROW_GAP_MIN, K.ROW_GAP_MAX].join("|")), line: 309});
// the most rows drawn at once; past it the far, weightless ones thin out (only reached by the extreme knobs)
const MAX_ROWS =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'MAX_ROWS',  called: () => (160), line: 311});

function create(): Preset {
	const noise =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'noise',  called: () => (createNoise2D()), line: 314});
	const conduct =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'conduct',  called: () => (createConductor()), line: 315});
	const keyHue =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'keyHue',  called: () => (createKeyHue()), line: 316});
	const glow =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'glow',  called: () => (createGlow()), line: 317});

	// rows keyed by index on the beat grid, cached while on screen; gates sit at section boundaries
	const rows =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'rows',  called: () => (new Map<number, Float32Array>()), line: 320});
	const gates =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'gates',  called: () => (new Map<number, Float32Array>()), line: 321});
	// resized with the point count: the two extra slots are loudness and hue
	let live =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'live',  called: () => (new Float32Array(POINTS + 2)), line: 323});
	let target =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'target',  called: () => (new Float32Array(POINTS + 2)), line: 324});
	// 8. strands: each note's eased weight (pitches^1.5), the eased loudness it is scaled by, and a row's scratch
	const strandW =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'strandW',  called: () => (new Float32Array(12)), line: 326});
	let strandY =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'strandY',  called: () => (new Float32Array(POINTS)), line: 327});
	let strandAmp =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'strandAmp',  called: () => (0), line: 328});
	// hills follow the mirrored span, which may already be on when this instance is made
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (setHills()), line: 330});
	 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (setStrandHills()), line: 331});
	let strandSeen =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'strandSeen',  called: () => (strandKey()), line: 332});
	// a seam-blended copy of a row's heights
	let seamH =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'seamH',  called: () => (new Float32Array(POINTS)), line: 334});
	let liveH =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'liveH',  called: () => (new Float32Array(POINTS)), line: 335});
	// the point indexes a coarse ring actually draws, so the baseline walks back over the same ones
	let indexBuf =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'indexBuf',  called: () => (new Uint16Array(POINTS)), line: 337});
	// track on screen and the time it is shown at; they lag the player across a track change or seek
	let shown: TrackAudioData | null =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'shown',  called: () => (null), line: 339});
	let viewTime =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'viewTime',  called: () => (0), line: 340});
	let presence =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'presence',  called: () => (0), line: 341});
	let swayClock =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'swayClock',  called: () => (0), line: 342});
	// per row: time, weight of the sound it stands on (0..1), whether a bar begins there
	let rowTimes: number[] =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'rowTimes',  called: () => ([]), line: 344});
	let rowWeights: number[] =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'rowWeights',  called: () => ([]), line: 345});
	let rowBars: boolean[] =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'rowBars',  called: () => ([]), line: 346});
	let onAccents =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'onAccents',  called: () => (FEATURES.accents.on), line: 347});
	let shaped =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'shaped',  called: () => (shapeKey()), line: 348});
	let gridded =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'gridded',  called: () => (gridKey()), line: 349});
	// echoes, and sounds played by the last frame (-1: unknown, nothing echoes across a change or seek)
	const echoes: { data: Float32Array; age: number; amp: number }[] =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'echoes',  called: () => ([]), line: 351});
	let played =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'played',  called: () => (-1), line: 352});
	// what the frame drawn while paused showed
	let pausedFor: TrackAudioData | null | undefined;
	let pausedAt =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'pausedAt',  called: () => (""), line: 355});
	// eased: recent loudness, upcoming loudness, camera height
	let lately =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'lately',  called: () => (0.3), line: 357});
	let ahead =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'ahead',  called: () => (0.3), line: 358});
	// where on the palette the music has the picture, when the colour follows the sound
	let soundAt =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'soundAt',  called: () => (0.5), line: 360});
	// the horizon's lean towards the coming section's key, eased so a new key is joined, not jumped to
	let skyLean =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'skyLean',  called: () => (NaN), line: 362});
	let camera =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'camera',  called: () => (1), line: 363});
	// the dust: across (half-widths), above the ground (ridges), its place in the passing stretch (0..1), its own light
	const dust =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'dust',  called: () => (new Float32Array(DUST * 4)), line: 365});
	for (let i = 0; i < DUST;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 366})) {
		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (dust[i * 4] = (Math.random() * 2 - 1) * 2.4), line: 367});
		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (dust[i * 4 + 1] = 1.1 + Math.random() * 2.6), line: 368});
		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (dust[i * 4 + 2] = Math.random()), line: 369});
		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (dust[i * 4 + 3] = 0.4 + Math.random() * 0.6), line: 370});
	}

	// the song at time `t`, averaged over one row's worth of it, into `out`
	const shape =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'shape',  called: () => ((out: Float32Array, audio: TrackAudioData | null, t: number, span: number) => {
    		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (out.fill(0)), line: 375});
    		const segs =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'segs',  called: () => (audio?.segments), line: 376});
    		const end =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'end',  called: () => (segs && segs.length > 0 ? segs[segs.length - 1].start + segs[segs.length - 1].duration : 0), line: 377});
    		if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (!audio || t < 0 || t > end), line: 378})) return;
    		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (out[HUE] = keyHueAt(audio, t)), line: 379});
    		let sharp =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'sharp',  called: () => (0), line: 380});
    		for (let s = -1; s <= 1;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (s++), line: 381})) {
    			const at =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'at',  called: () => (t + (s * span) / 3), line: 382});
    			const loud =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'loud',  called: () => (sampleCurve(audio.loudnessCurve, at)), line: 383});
    			const seg =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'seg',  called: () => (segmentAt(audio.segments, at)), line: 384});
    			const amp =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'amp',  called: () => ((Math.pow(loud, 0.8) * 1.5) / 3), line: 385});
    			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (out[LEVEL] += loud / 3), line: 386});
    			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (seg), line: 387}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (sharp += (1 - Math.min(1, seg.loudness_max_time / 0.12)) / 3), line: 387});
    			// TIMBRE_HILL: a ringing sound (timbre[1] high for this track) is drawn with narrower hills, a dull one with wider
    			const m =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'm',  called: () => (seg && K.TIMBRE_HILL > 0 ? K.TIMBRE_HILL * (rankOf(audio.timbreSorted, seg.timbre[1]) * 2 - 1) : 0), line: 389});
    			const other =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'other',  called: () => (m > 0 ? HILLS_NARROW : HILLS_WIDE), line: 390});
    			const mix =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'mix',  called: () => (Math.abs(m)), line: 391});
    			for (let k = 0; k < 12;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (k++), line: 392})) {
    				// with no notes to go by, one broad hill
    				const w =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'w',  called: () => (seg ? Math.pow(seg.pitches[k], 1.5) : 0.35), line: 394});
    				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (w < 0.02), line: 395})) continue;
    				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (mix < 0.001), line: 396})) for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 396}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (out[i] += w * HILLS[k * POINTS + i] * amp), line: 396});
    				else for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 397}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (out[i] += w * (HILLS[k * POINTS + i] * (1 - mix) + other[k * POINTS + i] * mix) * amp), line: 397});
    			}
    		}
    		// jagged where the sound was sharp, in proportion to the ridge
    		for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 401}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (out[i] *= 1 + noise(ACROSS[i] * 9, t * 2.2) * sharp * K.JAG), line: 401});
    		// gaussian smoothing along the line; the ends hold their value
    		if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (KERNEL_REACH > 0), line: 403})) {
    			const reach =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'reach',  called: () => (KERNEL_REACH), line: 404});
    			for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 405})) {
    				let sum =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'sum',  called: () => (0), line: 406});
    				for (let d = -reach; d <= reach;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (d++), line: 407}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (sum += out[Math.max(0, Math.min(POINTS - 1, i + d))] * KERNEL[d + reach]), line: 407});
    				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (BLUR[i] = sum / KERNEL_SUM), line: 408});
    			}
    			for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 410}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (out[i] = BLUR[i]), line: 410});
    		}
    		for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 412}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (out[i] = K.RIDGE_LIMIT * Math.tanh(Math.max(0, out[i]) / K.RIDGE_LIMIT)), line: 412});
    	}), line: 374});

	// ---- the grid: where the rows are ----------------------------------------------------------------------
	// 7. rows on accents: a row per segment onset, weighted by its confidence; onsets closer than ROW_GAP_MIN
	// merge, gaps get weightless rows, every bar start is a row. Off: rows on beats and midpoints, equal weight.
	const setGrid =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'setGrid',  called: () => ((audio: TrackAudioData | null) => {
    		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (onAccents = FEATURES.accents.on), line: 419});
    		const beat =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'beat',  called: () => (beatOf(audio)), line: 420});
    		const segs =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'segs',  called: () => (audio?.segments ?? []), line: 421});
    		const beats =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'beats',  called: () => (audio?.beats ?? []), line: 422});
    		const end =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'end',  called: () => (segs.length > 0 ? segs[segs.length - 1].start + segs[segs.length - 1].duration : 600), line: 423});
    		const rows: { t: number; w: number; bar: boolean }[] =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'rows',  called: () => ([]), line: 424});
    		if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (onAccents && segs.length > 0), line: 425})) {
    			for (const seg of segs) {
    				const w =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'w',  called: () => (Math.max(0, Math.min(1, seg.confidence ?? 0.5))), line: 427});
    				const last =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'last',  called: () => (rows[rows.length - 1]), line: 428});
    				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (last && seg.start - last.t < beat * K.ROW_GAP_MIN), line: 429})) {
    					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (w > last.w), line: 430})) {
    						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (last.t = seg.start), line: 431});
    						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (last.w = w), line: 432});
    					}
    				} else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rows.push({ t: seg.start, w, bar: false })), line: 434});
    			}
    		} else if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (beats.length > 1), line: 436})) {
    			for (let k = 0; k < beats.length;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (k++), line: 437})) {
    				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rows.push({ t: beats[k].start, w: 0.5, bar: false })), line: 438});
    				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (k + 1 < beats.length), line: 439}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rows.push({ t: (beats[k].start + beats[k + 1].start) / 2, w: 0.5, bar: false })), line: 439});
    			}
    		}
    		// the bars: the row a bar begins on, or one put there
    		let j =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'j',  called: () => (0), line: 443});
    		for (const bar of audio?.bars ?? []) {
    			while (j + 1 < rows.length && Math.abs(rows[j + 1].t - bar.start) <= Math.abs(rows[j].t - bar.start))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (j++), line: 445});
    			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rows.length > 0 && Math.abs(rows[j].t - bar.start) < beat * K.ROW_GAP_MIN), line: 446}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rows[j].bar = true), line: 446});
    			else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rows.push({ t: bar.start, w: 0.35, bar: true })), line: 447});
    		}
    		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rows.sort((a, b) => a.t - b.t)), line: 449});
    		// no holes: before the first row, after the last, and across any stretch with nothing in it
    		const filled: typeof rows =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'filled',  called: () => ([]), line: 451});
    		let from =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'from',  called: () => (Math.min(0, rows.length > 0 ? rows[0].t : 0) - beat * (K.PAST_BEATS + 1)), line: 452});
    		const fill =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'fill',  called: () => ((to: number) => {
            			const n =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'n',  called: () => (Math.ceil((to - from) / (beat * K.ROW_GAP_MAX))), line: 454});
            			for (let k = 1; k < n;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (k++), line: 455}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (filled.push({ t: from + ((to - from) * k) / n, w: 0, bar: false })), line: 455});
            		}), line: 453});
    		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (filled.push({ t: from, w: 0, bar: false })), line: 457});
    		for (const r of rows) {
    			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (fill(r.t)), line: 459});
    			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (filled.push(r)), line: 460});
    			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (from = r.t), line: 461});
    		}
    		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (fill(end + beat * (K.FUTURE_BEATS + 1))), line: 463});
    		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rowTimes = filled.map(r => r.t)), line: 464});
    		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rowWeights = filled.map(r => r.w)), line: 465});
    		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rowBars = filled.map(r => r.bar)), line: 466});
    	}), line: 418});
	// the last row at or before `t` (-1 if there is none)
	const rowBefore =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'rowBefore',  called: () => ((t: number) => {
    		let lo =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'lo',  called: () => (-1), line: 470});
    		let hi =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'hi',  called: () => (rowTimes.length - 1), line: 471});
    		while (lo < hi) {
    			const mid =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'mid',  called: () => ((lo + hi + 1) >> 1), line: 473});
    			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rowTimes[mid] <= t), line: 474}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (lo = mid), line: 474});
    			else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (hi = mid - 1), line: 475});
    		}
    		return lo;
    	}), line: 469});
	const showTrack =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'showTrack',  called: () => ((audio: TrackAudioData | null) => {
    		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (shown = audio), line: 480});
    		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rows.clear()), line: 481});
    		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (gates.clear()), line: 482});
    		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (setGrid(shown)), line: 483});
    		 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (played = -1), line: 484});
    	}), line: 479});

	return {
		draw(frame) {
			const { width, height, isPlaying, colorRgb, audio, progressSec } =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: '{ width, height, isPlaying, colorRgb, audio, progressSec }',  called: () => (frame), line: 489});
			const ctx =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'ctx',  called: () => (frame.ctx), line: 490});
			// paused: draw one frame, then nothing until the track, position, size, a knob or a feature changes
			// (Spotify opens paused). The rings are placed at the paused moment directly, without the rise.
			const still =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'still',  called: () => (isPlaying ? "" : [progressSec, width, height, tuneVersion(), FEATURE_KEYS.map(f => +f.on).join("")].join("|")), line: 493});
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (!isPlaying), line: 494})) {
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (audio === pausedFor && still === pausedAt), line: 495})) return;
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (pausedFor = audio), line: 496});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (pausedAt = still), line: 497});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (audio !== shown || Math.abs(progressSec - viewTime) > 0.5), line: 498}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (showTrack(audio)), line: 498});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (viewTime = progressSec), line: 499});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (presence = shown ? 1 : 0), line: 500});
			} else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (pausedAt = ""), line: 501});
			const c =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'c',  called: () => (conduct(frame)), line: 502});
			const scale =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'scale',  called: () => (c.scale), line: 503});

			// ---- which song, and when --------------------------------------------------------------------
			// a new track or a seek sinks the old terrain flat on its own clock, then the new one rises
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (audio !== shown || Math.abs(progressSec - viewTime) > 0.5), line: 507})) {
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (presence += (0 - presence) * Math.min(1, 6 * c.dt)), line: 508});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (viewTime += c.dt), line: 509});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (presence < 0.02), line: 510})) {
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (showTrack(audio)), line: 511});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (viewTime = progressSec), line: 512});
				}
			} else {
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (viewTime = progressSec), line: 515});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (presence += ((shown ? 1 : 0) - presence) * Math.min(1, 1.2 * c.dt)), line: 516});
			}

			// setResolution rebuilds the shared tables when the count changes, and reports that it did.
			// These buffers, and anything cached, are still the old length: loudness and hue sit at the old indexes,
			// so a kept row would read them from the middle of the line. Drop them; the next time a row is drawn
			// it is shaped at the new count.
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (setResolution(K.POINTS)), line: 523})) {
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (live = new Float32Array(POINTS + 2)), line: 524});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (target = new Float32Array(POINTS + 2)), line: 525});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (strandY = new Float32Array(POINTS)), line: 526});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (seamH = new Float32Array(POINTS)), line: 527});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (liveH = new Float32Array(POINTS)), line: 528});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (indexBuf = new Uint16Array(POINTS)), line: 529});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rows.clear()), line: 530});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (gates.clear()), line: 531});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (echoes.length = 0), line: 532});
			}

			// the grid kind was toggled (key 7) or a knob moved: rows made with the old values are stale
			const nowShape =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'nowShape',  called: () => (shapeKey()), line: 536});
			const nowGrid =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'nowGrid',  called: () => (gridKey()), line: 537});
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (onAccents !== FEATURES.accents.on || rowTimes.length === 0 || shaped !== nowShape || gridded !== nowGrid), line: 538})) {
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (shaped !== nowShape), line: 539})) {
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (setHills()), line: 540});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (setKernel()), line: 541});
				}
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (shaped = nowShape), line: 543});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (gridded = nowGrid), line: 544});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (setGrid(shown)), line: 545});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rows.clear()), line: 546});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (gates.clear()), line: 547});
			}

			const beat =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'beat',  called: () => (beatOf(shown)), line: 550});
			const step =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'step',  called: () => (beat / ROWS_PER_BEAT), line: 551});
			const zPerSec =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'zPerSec',  called: () => ((K.Z_NOW - 1) / (K.PAST_BEATS * beat)), line: 552});
			const zFar =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'zFar',  called: () => (K.Z_NOW + K.FUTURE_BEATS * beat * zPerSec), line: 553});

			// ---- what is coming, measured: the next stretch against the last ----------------------------------
			// loudness of the next twelve beats read off the timeline, not a detector; eased
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (lately += (c.loudness - lately) * Math.min(1, 0.35 * c.dt)), line: 557});
			let coming =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'coming',  called: () => (0), line: 558});
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (shown), line: 559})) for (let k = 0; k < 8;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (k++), line: 559}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (coming += sampleCurve(shown.loudnessCurve, viewTime + beat * (4 + (k * 12) / 7)) / 8), line: 559});
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ahead += (coming - ahead) * Math.min(1, 2 * c.dt)), line: 560});

			// ---- 5. the camera --------------------------------------------------------------------------------
			// open over loud passages, drawn in over quiet ones, crouching before a build. The spread and, a little, the
			// diameter move with it. Reads only the two measured levels; eased over ~1.5 s.
			const loud =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'loud',  called: () => (Math.max(0, Math.min(1, (lately - K.LATELY_QUIET) / (K.LATELY_LOUD - K.LATELY_QUIET)))), line: 565});
			const crouch =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'crouch',  called: () => (Math.max(0, Math.min(1, (ahead - lately) / K.LEAD_FULL))), line: 566});
			// the track's own fade-in and fade-out (reported on nearly every track), as how much of the view is left:
			// 1 in the body of the track, down to 0 at the very start and end. FADE_AMOUNT is how much of that shows.
			let body =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'body',  called: () => (1), line: 569});
			const fadeIn =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'fadeIn',  called: () => (shown?.trackInfo?.end_of_fade_in), line: 570});
			const fadeOut =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'fadeOut',  called: () => (shown?.trackInfo?.start_of_fade_out), line: 571});
			const length =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'length',  called: () => (shown?.trackInfo?.duration), line: 572});
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (K.FADE_AMOUNT > 0 && typeof fadeIn === "number" && fadeIn > 0.5 && viewTime < fadeIn), line: 573}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (body = Math.min(body, smoothstep(viewTime / fadeIn))), line: 573});
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (K.FADE_AMOUNT > 0 && typeof fadeOut === "number" && typeof length === "number" && fadeOut < length - 0.5 && viewTime > fadeOut), line: 574}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (body = Math.min(body, 1 - smoothstep((viewTime - fadeOut) / (length - fadeOut)))), line: 574});
			const fade =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'fade',  called: () => (1 - K.FADE_AMOUNT * (1 - body)), line: 575});
			let cameraTarget =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'cameraTarget',  called: () => (FEATURES.camera.on ? Math.max(K.CAMERA_LOW, K.CAMERA_LOW + loud * (K.CAMERA_HIGH - K.CAMERA_LOW) - crouch * 0.3) : 1), line: 576});
			// it sinks towards its lowest as the track fades
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (cameraTarget += (K.CAMERA_LOW - cameraTarget) * (1 - fade)), line: 578});
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (camera += (cameraTarget - camera) * Math.min(1, 0.7 * c.dt)), line: 579});

			// ---- the view ----------------------------------------------------------------------------------
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (swayClock += c.dt), line: 582});
			const cx =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'cx',  called: () => (width / 2), line: 583});
			const cy =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'cy',  called: () => (height / 2), line: 584});
			const short =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'short',  called: () => (Math.min(width, height)), line: 585});
			// loud music opens the rings (camera multiplies the spread) and eases the bright ring a little larger
			const spread =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'spread',  called: () => (K.GROUND * camera), line: 587});
			const rNow =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'rNow',  called: () => (Math.max(1, short * 0.5 * K.DIAMETER * (1 + (camera - 1) * 0.18))), line: 588});
			const ridge =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'ridge',  called: () => (short * K.RIDGE), line: 589});
			// the center drifts with depth: zero on the bright ring, opposite ways for the future and the past
			const sway =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'sway',  called: () => (Math.sin(swayClock * 0.2) * width * (FEATURES.camera.on ? 0.085 : 0.05) * K.SWAY), line: 591});
			// BEND: the same road the straight terrain used, read as an angle, so a ring keeps its place in the song
			const road =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'road',  called: () => ((t: number) => Math.sin(t * 0.13) + 0.5 * Math.sin(t * 0.31 + 1)), line: 593});
			const bend =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'bend',  called: () => (K.BEND > 0 ? road(viewTime) : 0), line: 594});
			// @what - baseline radius at depth z
			// @why - at z = Z_NOW this is exactly the bright ring, so depth moves the eye and the past, not the diameter
			// @how - spread scales how far a ring leaves the bright one; never below 1 px, or a steep eye feeds arc a negative radius
			const radiusAt =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'radiusAt',  called: () => ((z: number) => Math.max(1, rNow * (1 + spread * (K.Z_NOW / z - 1)))), line: 598});
			const centerAt =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'centerAt',  called: () => ((z: number) => cx + sway * (1 / z - 1 / K.Z_NOW)), line: 599});
			// the mirrored ring is one semicircle; the saved arc is left alone
			const mirrored =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'mirrored',  called: () => (FEATURES.mirror.on), line: 601});
			const arc =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'arc',  called: () => (mirrored ? 0.5 : K.ARC), line: 602});
			// @what - angle of one sample around the ring
			// @why - the middle of the lanes sits at 12 o'clock; the old left and right ends meet at 6 o'clock when the arc is a full circle
			const angleOf =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'angleOf',  called: () => ((across: number) => -Math.PI / 2 + across * Math.PI * arc), line: 605});
			const twistAt =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'twistAt',  called: () => ((z: number) => (K.BEND > 0 ? K.BEND * 0.5 * (road(viewTime + (z - K.Z_NOW) / zPerSec) - bend) : 0)), line: 606});
			// @what - a sample on the ring, or on its reflection
			// @why - twist is added after the reflection, so a twisted ring still meets itself at the sides
			// @how - the radius never drops below 1 px, or an inward peak would pass through the center
			const place =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'place',  called: () => ((z: number, across: number, radial: number, reflected = false) => {
            				let a =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'a',  called: () => (angleOf(across)), line: 611});
            				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (reflected), line: 612}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (a = -a), line: 612});
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (a += twistAt(z)), line: 613});
            				const r =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'r',  called: () => (Math.max(1, radiusAt(z) + radial)), line: 614});
            				const ox =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'ox',  called: () => (centerAt(z)), line: 615});
            				return [ox + r * Math.cos(a), cy + r * Math.sin(a)] as const;
            			}), line: 610});
			// 0 keeps every peak outward. Otherwise one inward ring, then this many outward ones.
			const everyIn =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'everyIn',  called: () => (Math.round(K.INVERT_EVERY_X_RINGS)), line: 619});
			const inwardOf =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'inwardOf',  called: () => ((n: number) => everyIn > 0 && n >= 0 && n % (everyIn + 1) === everyIn), line: 620});
			const dirOf =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'dirOf',  called: () => ((n: number) => (inwardOf(n) ? -1 : 1)), line: 621});
			// far rings rise out of the center from flat, not just fade; played rings shrink their peaks and leave outward
			const farAt =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'farAt',  called: () => ((z: number) => smoothstep((zFar - z) / 0.9)), line: 623});
			const playedAt =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'playedAt',  called: () => ((z: number) => (z >= K.Z_NOW ? 1 : smoothstep((z - 1) / (K.Z_NOW - 1)))), line: 624});
			// most of the way down within a beat of being played
			const sunkAt =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'sunkAt',  called: () => ((tau: number) => (tau >= 0 ? 1 : Math.exp(tau / (beat * 0.7)))), line: 626});
			const liftOf =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'liftOf',  called: () => ((z: number, flat: number) => (ridge / z) * flat * presence), line: 627});
			// a full circle eases the empty shoulder onto one height. The notes stay where they are.
			// The mirror does not use that: each end eases toward its own height, so the sides meet flat.
			const closed =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'closed',  called: () => (arc >= 0.999), line: 630});
			// @what - ease the ends of a ring so the join does not corner
			// @why - a closed ring's two ends are different samples; a mirror's ends meet their own copies with a slope
			// @how - smoothstep is flat at the join and flat again where it hands back to the line
			const heightsOf =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'heightsOf',  called: () => ((data: Float32Array) => {
            				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (!closed && !mirrored), line: 635})) return data;
            				// across runs 2 units over the semicircle, so 0.08 is 4% of that half. The closed ring uses the empty shoulder.
            				const reach =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'reach',  called: () => (mirrored ? 0.08 : Math.max(0.08, 1 - K.LANE_SPAN)), line: 637});
            				const n =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'n',  called: () => (Math.max(2, Math.min((POINTS >> 1) - 1, Math.round((reach * (POINTS - 1)) / 2)))), line: 638});
            				const left =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'left',  called: () => (data[0]), line: 639});
            				const right =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'right',  called: () => (data[POINTS - 1]), line: 640});
            				const midH =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'midH',  called: () => ((left + right) * 0.5), line: 641});
            				for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 642}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (seamH[i] = data[i]), line: 642});
            				for (let k = 0; k < n;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (k++), line: 643})) {
            					const s =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 's',  called: () => (smoothstep(k / (n - 1))), line: 644});
            					// the mirror keeps each end's own height. The closed ring meets on their average.
            					const holdL =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'holdL',  called: () => (mirrored ? left : midH), line: 646});
            					const holdR =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'holdR',  called: () => (mirrored ? right : midH), line: 647});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (seamH[k] = data[k] * s + holdL * (1 - s)), line: 648});
            					const j =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'j',  called: () => (POINTS - 1 - k), line: 649});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (seamH[j] = data[j] * s + holdR * (1 - s)), line: 650});
            				}
            				return seamH;
            			}), line: 634});

			// ---- colour ------------------------------------------------------------------------------------
			// loudness is read against the band the camera uses (LATELY_*), not 0..1, where most of the palette is never reached
			const pal =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'pal',  called: () => (palette(COLOURS, frame.palette ?? [colorRgb])), line: 657});
			const rel =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'rel',  called: () => ((level: number) => smoothstep((level - K.LATELY_QUIET) / (K.LATELY_LOUD - K.LATELY_QUIET))), line: 658});
			// its own envelope, slower than the line's: the colour follows the passage, not every hit
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (soundAt += (rel(c.energy) - soundAt) * Math.min(1, c.dt / 0.8)), line: 660});
			const tint =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'tint',  called: () => ((loud: number, near: number) => {
            				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (COLOURS.follows === "height"), line: 662})) return paletteAt(pal, loud);
            				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (COLOURS.follows === "depth"), line: 663})) return paletteAt(pal, near);
            				return paletteAt(pal, soundAt);
            			}), line: 661});
			// with a cover palette the line and section rows turn towards the cover's other colours; picked colours as picked
			const grey =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'grey',  called: () => (pal.every(p => p.s < GREY)), line: 667});
			const turn =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'turn',  called: () => (COLOURS.mode === "cover" ? 1 : 0), line: 668});
			const liveHue =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'liveHue',  called: () => (keyHue(shown, viewTime, c.dt) * COLOURS.harmony), line: 669});
			const lit =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'lit',  called: () => (tint(rel(live[LEVEL]), 1)), line: 670});
			const liveS =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'liveS',  called: () => (grey ? lit.s : Math.min(1, lit.s + 0.08)), line: 671});
			const liveRgb =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'liveRgb',  called: () => (hslToRgb(familyHue(pal, lit, liveHue, turn), liveS, accentLightness(liveS, Math.min(0.8, lit.l + 0.16)))), line: 672});
			// 8, 9. a colour for each note, left to right as the lanes stand: along the palette, through familyHue, so it
			// stays inside the cover's colours like everything else
			const noteRgb: Rgb[] =
				 tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'noteRgb',  called: () => (FEATURES.strands.on || FEATURES.notes.on
                					? Array.from({ length: 12 }, (_, f) => {
                						const n =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'n',  called: () => (paletteAt(pal, f / 11)), line: 678});
                						const s =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 's',  called: () => (grey ? n.s : Math.min(1, n.s + 0.08)), line: 679});
                						return hslToRgb(familyHue(pal, n, liveHue, turn), s, accentLightness(s, Math.min(0.8, n.l + 0.16)));
                					})
                					: []), line: 676});

			// a hole is open only while one of the opacity knobs has moved. At 1 the page stays covered.
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (setCanvasHoles(K.SKY < 1 || K.BELOW < 1 || K.UNDER < 1)), line: 685});
			// @why - a semi-transparent black painted over the previous frame would darken it again each frame.
			// Clearing first lets the sky alpha sit on empty pixels, so 1 is the old opaque black.
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.clearRect(0, 0, width, height)), line: 688});
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.lineJoin = "round"), line: 689});
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.lineCap = "round"), line: 690});
			// BANK: the whole picture rolls a little with the sway, about the bright ring's center. Undone before the glow,
			// and put back only for the filled now line, which is painted after the glow.
			const bankAngle =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'bankAngle',  called: () => (Math.sin(swayClock * 0.2) * K.BANK * 0.05), line: 693});
			const banked =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'banked',  called: () => (K.BANK > 0), line: 694});
			const applyBank =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'applyBank',  called: () => (() => {
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.save()), line: 696});
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.translate(cx, cy)), line: 697});
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.rotate(bankAngle)), line: 698});
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.translate(-cx, -cy)), line: 699});
            			}), line: 695});
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (banked), line: 701}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (applyBank()), line: 701});
			// outside the bright ring is the ground, inside it is the sky. Oversized so a rolled view still covers the
			// corners. One fill when they match, which is every frame until a knob moves.
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fillStyle = rgbString(BLACK, K.BELOW)), line: 704});
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fillRect(-width, -height, width * 3, height * 3)), line: 705});
			// @why - painting the inside over the outside cannot clear it. A transparent disk leaves the outside black
			// showing through, so the disk is erased first and only then painted at its own opacity.
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (K.SKY !== K.BELOW), line: 708})) {
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.save()), line: 709});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.globalCompositeOperation = "destination-out"), line: 710});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.beginPath()), line: 711});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.arc(cx, cy, rNow, 0, TAU)), line: 712});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fillStyle = rgbString(BLACK)), line: 713});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fill()), line: 714});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.restore()), line: 715});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (K.SKY > 0), line: 716})) {
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.beginPath()), line: 717});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.arc(cx, cy, rNow, 0, TAU)), line: 718});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fillStyle = rgbString(BLACK, K.SKY)), line: 719});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fill()), line: 720});
				}
			}

			// ---- 1. the glow at the center ----------------------------------------------------------------------
			// brightness follows the next twelve beats, colour the coming section. Drawn first so the inner rings
			// silhouette against it; kept dim because the glow pass blooms whatever is bright.
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (FEATURES.horizon.on), line: 727})) {
				const strength =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'strength',  called: () => (smoothstep((ahead - 0.1) / 0.45) * presence * fade), line: 728});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (strength > 0.01), line: 729})) {
					const far =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'far',  called: () => (tint(rel(ahead), 0)), line: 730});
					const lean =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'lean',  called: () => (FEATURES.grid.on ? keyHueAt(shown, viewTime + K.FUTURE_BEATS * beat * 0.8) * COLOURS.harmony : liveHue), line: 731});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (skyLean = Number.isNaN(skyLean) || !isPlaying ? lean : skyLean + (lean - skyLean) * Math.min(1, c.dt / 0.6)), line: 732});
					const sky =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'sky',  called: () => (hslToRgb(familyHue(pal, far, skyLean, turn * 0.3), far.s * 0.85, Math.min(0.7, far.l + 0.05))), line: 733});
					const gx =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'gx',  called: () => (centerAt(zFar)), line: 734});
					const glowR =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'glowR',  called: () => (Math.max(1, short * K.SKY_HEIGHT)), line: 735});
					const dawn =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'dawn',  called: () => (ctx.createRadialGradient(gx, cy, 0, gx, cy, glowR)), line: 736});
					const a =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'a',  called: () => (K.SKY_BRIGHT * strength), line: 737});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (dawn.addColorStop(0, rgbString(sky, a))), line: 738});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (dawn.addColorStop(0.2, rgbString(sky, a * 0.6))), line: 739});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (dawn.addColorStop(0.45, rgbString(sky, a * 0.25))), line: 740});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (dawn.addColorStop(0.7, rgbString(sky, a * 0.07))), line: 741});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (dawn.addColorStop(1, rgbString(sky, 0))), line: 742});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fillStyle = dawn), line: 743});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.beginPath()), line: 744});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.arc(gx, cy, glowR, 0, TAU)), line: 745});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fill()), line: 746});
				}
			}

			// ---- 6. the dust ------------------------------------------------------------------------------------
			// specks carried at the rings' speed on the track's clock: short streaks along the line of flight,
			// outside the baseline so a ring never hides one
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (FEATURES.dust.on && presence > 0.02), line: 753})) {
				const span =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'span',  called: () => (K.PAST_BEATS + K.FUTURE_BEATS), line: 754});
				const light =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'light',  called: () => (presence * (0.1 + c.energy * 0.5) * K.DUST_LIGHT), line: 755});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.lineWidth = Math.max(1, scale * 0.0011)), line: 756});
				// one stroke per speck: a path's GPU cost goes by the area it spans
				for (let i = 0; i < DUST;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 758})) {
					const along =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'along',  called: () => ((((dust[i * 4 + 2] * span - viewTime / beat) % span) + span) % span), line: 759});
					const z =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'z',  called: () => (K.Z_NOW + (along - K.PAST_BEATS) * beat * zPerSec), line: 760});
					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (z < 1.02), line: 761})) continue;
					const a =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'a',  called: () => (farAt(z) * playedAt(z) * light * dust[i * 4 + 3]), line: 762});
					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (a < 0.015), line: 763})) continue;
					const z2 =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'z2',  called: () => (z + 0.08), line: 764});
					const across =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'across',  called: () => (Math.max(-1, Math.min(1, dust[i * 4] / 2.4))), line: 765});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.strokeStyle = rgbString(liveRgb, Math.min(0.42, a * 1.2))), line: 766});
					const streak =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'streak',  called: () => ((reflected: boolean) => {
                    						const [x1, y1] =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: '[x1, y1]',  called: () => (place(z, across, (dust[i * 4 + 1] * ridge) / z, reflected)), line: 768});
                    						const [x2, y2] =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: '[x2, y2]',  called: () => (place(z2, across, (dust[i * 4 + 1] * ridge) / z2, reflected)), line: 769});
                    						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.beginPath()), line: 770});
                    						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.moveTo(x1, y1)), line: 771});
                    						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.lineTo(x2, y2)), line: 772});
                    						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.stroke()), line: 773});
                    					}), line: 767});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (streak(false)), line: 775});
					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (mirrored), line: 776}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (streak(true)), line: 776});
				}
			}

			// ---- one ring: the band between its baseline and its crest, then the crest line ----------------------
			//   flat     how much of its height it still has (what has been played sinks)
			//   alpha    the line's strength
			//   glint    how brightly its body is lit from "now" (4)
			const row =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'row',  called: () => ((data: Float32Array, z: number, flat: number, alpha: number, lineWidth: number, lean: number, level: number, glint: number, turned = 0, dir = 1) => {
            				const rBase =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'rBase',  called: () => (radiusAt(z)), line: 785});
            				const lift =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'lift',  called: () => (liftOf(z, flat)), line: 786});
            				const h =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'h',  called: () => (heightsOf(data)), line: 787});
            				// beyond FINE_UNTIL every other point is drawn, and a ring so small that its points are under a pixel
            				// and a half apart is drawn with fewer still. A mirror draws the full circle, so it is measured that way.
            				const around =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'around',  called: () => ((mirrored ? 1 : arc) * TAU), line: 790});
            				const stride =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'stride',  called: () => (Math.max(z > K.FINE_UNTIL ? 2 : 1, Math.min(8, Math.ceil((1.5 * (POINTS - 1)) / Math.max(8, rBase * around))))), line: 791});
            				let nIdx =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'nIdx',  called: () => (0), line: 792});
            				for (let i = 0; i < POINTS; i += stride)  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (indexBuf[nIdx++] = i), line: 793});
            				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (indexBuf[nIdx - 1] !== POINTS - 1), line: 794}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (indexBuf[nIdx++] = POINTS - 1), line: 794});
            				const crestOf =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'crestOf',  called: () => ((i: number) => dir * h[i] * lift), line: 795});
            				const first =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'first',  called: () => ({ on: true }), line: 796});
            				const dot =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'dot',  called: () => ((i: number, reflected: boolean, radial: number) => {
                            					const [x, y] =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: '[x, y]',  called: () => (place(z, ACROSS[i], radial, reflected)), line: 798});
                            					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (first.on), line: 799})) {
                            						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.moveTo(x, y)), line: 800});
                            						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (first.on = false), line: 801});
                            					} else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.lineTo(x, y)), line: 802});
                            				}), line: 797});
            				// upper half forward, then the same samples back on the reflection. The baseline returns the other way.
            				const traceCrest =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'traceCrest',  called: () => (() => {
                            					for (let k = 0; k < nIdx;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (k++), line: 806}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (dot(indexBuf[k], false, crestOf(indexBuf[k]))), line: 806});
                            					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (mirrored), line: 807})) for (let k = nIdx - 1; k >= 0;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (k--), line: 807}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (dot(indexBuf[k], true, crestOf(indexBuf[k]))), line: 807});
                            				}), line: 805});
            				const traceBaseline =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'traceBaseline',  called: () => (() => {
                            					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (mirrored), line: 810})) {
                            						for (let k = 0; k < nIdx;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (k++), line: 811}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (dot(indexBuf[k], true, 0)), line: 811});
                            						for (let k = nIdx - 1; k >= 0;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (k--), line: 812}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (dot(indexBuf[k], false, 0)), line: 812});
                            					} else for (let k = nIdx - 1; k >= 0;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (k--), line: 813}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (dot(indexBuf[k], false, 0)), line: 813});
                            				}), line: 809});
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.beginPath()), line: 815});
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (traceCrest()), line: 816});
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (traceBaseline()), line: 817});
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.closePath()), line: 818});

            				// ---- 3. colour by height, the ring's own colour ----
            				// hue is the section's, depth removes saturation (haze), the ring's loudness sets lightness
            				const far =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'far',  called: () => (Math.max(0, Math.min(1, (z - K.Z_NOW) / (zFar - K.Z_NOW)))), line: 822});
            				const base =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'base',  called: () => (tint(rel(level), 1 - far)), line: 823});
            				const sat =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'sat',  called: () => (base.s * 0.9 * (FEATURES.height.on ? 1 - far * 0.45 : 1)), line: 824});
            				const hue =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'hue',  called: () => (familyHue(pal, base, lean, turned)), line: 825});
            				const rgb =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'rgb',  called: () => (hslToRgb(hue, sat, base.l * (FEATURES.height.on ? 0.42 + level * 0.5 : 0.55 + level * 0.6))), line: 826});

            				// ---- 4. lit mountains ----
            				// body faintly lit from the crest inward: the light goes in the colour, never the alpha, or it stops hiding
            				// the rings behind. Kept dim so the glow pass leaves it alone.
            				// UNDER is how see-through that black is. The crest stroke below is not multiplied.
            				const solid =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'solid',  called: () => (Math.min(1, flat * 1.5) * K.FILL * K.UNDER), line: 832});
            				// @why - the sky is already painted under this shape, so a thinner body would still look black.
            				// The shape is cleared first and the black put back at `solid`. Rings drawn behind this one
            				// go with the sky: the same pixels cannot hide them and show the page.
            				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (K.UNDER < 1), line: 836})) {
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.save()), line: 837});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.globalCompositeOperation = "destination-out"), line: 838});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fillStyle = rgbString(BLACK)), line: 839});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fill()), line: 840});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.restore()), line: 841});
            				}
            				const gx =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'gx',  called: () => (centerAt(z)), line: 843});
            				// the lit colour sits on the crest, whichever side of the baseline that is
            				const crestR =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'crestR',  called: () => (Math.max(1, rBase + dir * lift * 1.1)), line: 845});
            				const litInner =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'litInner',  called: () => (crestR < rBase), line: 846});
            				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (FEATURES.lit.on && glint > 0.03 && Math.abs(crestR - rBase) > 0.5), line: 847})) {
            					const body =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'body',  called: () => (ctx.createRadialGradient(gx, cy, Math.min(rBase, crestR), gx, cy, Math.max(rBase, crestR))), line: 848});
            					const lit =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'lit',  called: () => (rgbString({ r: rgb.r * glint, g: rgb.g * glint, b: rgb.b * glint }, solid)), line: 849});
            					const dark =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'dark',  called: () => (rgbString(BLACK, solid)), line: 850});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (body.addColorStop(0, litInner ? lit : dark)), line: 851});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (body.addColorStop(1, litInner ? dark : lit)), line: 852});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fillStyle = body), line: 853});
            				} else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fillStyle = rgbString(BLACK, solid)), line: 854});
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fill()), line: 855});
            				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (alpha < 0.004), line: 856})) return;

            				// ---- 3. colour by height, the peaks ----
            				// one radial stroke (a second stroke costs a quarter of the frame); no height, flat colour
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.beginPath()), line: 860});
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (first.on = true), line: 861});
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (traceCrest()), line: 862});
            				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (closed || mirrored), line: 863}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.closePath()), line: 863});
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.lineWidth = lineWidth), line: 864});
            				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (FEATURES.height.on && Math.abs(crestR - rBase) > 0.5), line: 865})) {
            					const pale =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'pale',  called: () => (hslToRgb(hue, sat * 0.55, Math.min(0.9, base.l + 0.26))), line: 866});
            					const peakR =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'peakR',  called: () => (Math.max(1, rBase + dir * lift * 1.15)), line: 867});
            					const up =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'up',  called: () => (ctx.createRadialGradient(gx, cy, Math.min(rBase, peakR), gx, cy, Math.max(rBase, peakR))), line: 868});
            					const atBase =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'atBase',  called: () => (rgbString(rgb, alpha)), line: 869});
            					const atPeak =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'atPeak',  called: () => (rgbString(pale, Math.min(1, alpha * 1.7))), line: 870});
            					const peakInner =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'peakInner',  called: () => (peakR < rBase), line: 871});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (up.addColorStop(0, peakInner ? atPeak : atBase)), line: 872});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (up.addColorStop(1, peakInner ? atBase : atPeak)), line: 873});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.strokeStyle = up), line: 874});
            				} else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.strokeStyle = rgbString(rgb, alpha)), line: 875});
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.stroke()), line: 876});
            			}), line: 784});

			// ---- the line at "now" --------------------------------------------------------------------------
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (shape(target, shown, viewTime, step)), line: 880});
			const chase =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'chase',  called: () => (Math.min(1, 14 * c.dt)), line: 881});
			// (paused, it is simply where it would have got to)
			for (let i = 0; i < POINTS + 2;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 883}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (live[i] += (target[i] - live[i]) * (isPlaying ? chase : 1)), line: 883});
			// 8. the notes of the sound under "now", eased the way the line is
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (FEATURES.strands.on), line: 885})) {
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (strandSeen !== strandKey()), line: 886})) {
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (setStrandHills()), line: 887});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (strandSeen = strandKey()), line: 888});
				}
				const now =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'now',  called: () => (shown && target[LEVEL] > 0 ? segmentAt(shown.segments, viewTime) : null), line: 890});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (strandAmp += (Math.pow(target[LEVEL], 0.8) * 1.5 - strandAmp) * (isPlaying ? chase : 1)), line: 891});
				for (let k = 0; k < 12;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (k++), line: 892}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (strandW[k] += ((shown && target[LEVEL] > 0 ? (now ? Math.pow(now.pitches[k], 1.5) : 0.35) : 0) - strandW[k]) * (isPlaying ? chase : 1)), line: 892});
			}
			// the body takes its place in the terrain; the line is drawn last, over the rows in front of it
			const drawLive =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'drawLive',  called: () => (() => row(live, K.Z_NOW, 1, 0, 1, liveHue, live[LEVEL], 0.14 + c.energy * 0.3, turn, dirOf(rowBefore(viewTime)))), line: 895});

			// ---- a sound has just been played: the mountains as they stand now are its echo ---------------------
			const segs =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'segs',  called: () => (shown?.segments), line: 898});
			let count =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'count',  called: () => (0), line: 899});
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (segs && segs.length > 0 && segs[0].start <= viewTime), line: 900})) {
				let lo =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'lo',  called: () => (0), line: 901});
				let hi =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'hi',  called: () => (segs.length - 1), line: 902});
				while (lo < hi) {
					const mid =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'mid',  called: () => ((lo + hi + 1) >> 1), line: 904});
					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (segs[mid].start <= viewTime), line: 905}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (lo = mid), line: 905});
					else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (hi = mid - 1), line: 906});
				}
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (count = lo + 1), line: 908});
			}
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (played >= 0 && count > played && count - played <= 3 && segs), line: 910})) {
				const seg =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'seg',  called: () => (segs[count - 1]), line: 911});
				const echo =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'echo',  called: () => (echoes.length < ECHO_MAX ? { data: new Float32Array(POINTS), age: 0, amp: 0 } : echoes.shift()!), line: 912});
				// `target`, not the eased line: the shape this sound has
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (echo.data.set(target.subarray(0, POINTS))), line: 914});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (echo.age = 0), line: 915});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (echo.amp = Math.min(1.2, Math.pow(10, seg.loudness_max / 20) / (shown?.hitScale || 0.56))), line: 916});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (echoes.push(echo)), line: 917});
			}
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (played = count), line: 919});

			// ---- 2. bars and section gates, the gates -------------------------------------------------------------
			// a row exactly on each section boundary, in the pale colour of the section it opens: a line and a colour only,
			// since sections are a timbral segmentation that can miss choruses; unsure boundaries are fainter.
			const sections =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'sections',  called: () => (FEATURES.grid.on ? shown?.sections : undefined), line: 924});
			let gate =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'gate',  called: () => (-1), line: 925});
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (sections), line: 926})) for (let i = sections.length - 1; i >= 1;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i--), line: 926})) if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (sections[i].start <= viewTime + K.FUTURE_BEATS * beat), line: 926})) {
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (gate = i), line: 927});
				break;
			}
			const gatesBehind =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'gatesBehind',  called: () => ((time: number) => {
            				while (sections && gate >= 1 && sections[gate].start >= time) {
            					const at =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'at',  called: () => (sections[gate].start), line: 932});
            					const tau =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'tau',  called: () => (at - viewTime), line: 933});
            					const z =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'z',  called: () => (K.Z_NOW + tau * zPerSec), line: 934});
            					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (z >= 1 && z <= zFar), line: 935})) {
            						let data =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'data',  called: () => (gates.get(gate)), line: 936});
            						if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (!data), line: 937})) {
            							 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (data = new Float32Array(POINTS + 2)), line: 938});
            							 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (shape(data, shown, at, step)), line: 939});
            							 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (gates.set(gate, data)), line: 940});
            						}
            						const sure =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'sure',  called: () => (0.35 + Math.min(1, sections[gate].confidence) * 0.65), line: 942});
            						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (row(data, z, playedAt(z) * sunkAt(tau) * farAt(z), farAt(z) * playedAt(z) * 0.85 * sure, Math.max(1.2, (scale * 0.003 * K.Z_NOW) / z), data[HUE] * COLOURS.harmony, 1, 0, turn, dirOf(rowBefore(at)))), line: 943});
            					}
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (gate--), line: 945});
            				}
            			}), line: 930});

			// ---- the terrain, far to near ------------------------------------------------------------------------
			const nearest =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'nearest',  called: () => (Math.max(0, rowBefore(viewTime - K.PAST_BEATS * beat))), line: 950});
			const furthest =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'furthest',  called: () => (Math.min(rowTimes.length - 1, rowBefore(viewTime + K.FUTURE_BEATS * beat) + 1)), line: 951});
			for (const n of rows.keys()) if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (n < nearest || n > furthest), line: 952}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rows.delete(n)), line: 952});
			let liveDrawn =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'liveDrawn',  called: () => (false), line: 953});
			// a long stretch of rows (FUTURE_BEATS, the gap knobs at their extremes) thins its far, weightless rows
			const thin =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'thin',  called: () => (Math.max(1, Math.ceil((furthest - nearest + 1) / MAX_ROWS))), line: 955});
			// radius of the last ring drawn: far rings bunch up toward the center, and a flat one less than a pixel
			// outside the last is hidden by it anyway
			let lastBase =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'lastBase',  called: () => (-Infinity), line: 958});
			for (let n = furthest; n >= nearest;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (n--), line: 959})) {
				const time =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'time',  called: () => (rowTimes[n]), line: 960});
				const tau =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'tau',  called: () => (time - viewTime), line: 961});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (!liveDrawn && tau < 0), line: 962})) {
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (gatesBehind(viewTime)), line: 963});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (drawLive()), line: 964});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (liveDrawn = true), line: 965});
				}
				const z =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'z',  called: () => (K.Z_NOW + tau * zPerSec), line: 967});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (z < 1 || z > zFar), line: 968})) continue;
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (thin > 1 && z > K.FINE_UNTIL && n % thin !== 0 && rowWeights[n] < 0.5), line: 969})) continue;
				const rBase =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'rBase',  called: () => (radiusAt(z)), line: 970});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rBase - lastBase < 1 && (ridge / z) * K.RIDGE_LIMIT * playedAt(z) * sunkAt(tau) * farAt(z) * presence < 1), line: 971})) continue;
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (lastBase = rBase), line: 972});
				let data =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'data',  called: () => (rows.get(n)), line: 973});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (!data), line: 974})) {
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (data = new Float32Array(POINTS + 2)), line: 975});
					// averaged over the row's own stretch: half the way to its neighbours, at most a half-beat
					const reach =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'reach',  called: () => (Math.min(step, (rowTimes[Math.min(rowTimes.length - 1, n + 1)] - rowTimes[Math.max(0, n - 1)]) / 2)), line: 977});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (shape(data, shown, time, Math.max(0.03, reach))), line: 978});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rows.set(n, data)), line: 979});
				}
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (gatesBehind(time)), line: 981});
				const seen =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'seen',  called: () => (farAt(z) * playedAt(z)), line: 982});
				// a row brightens as it comes under the playhead: the beat, crossing "now"
				const crossing =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'crossing',  called: () => (Math.exp(-Math.pow(tau / (beat * 0.35), 2))), line: 984});
				const level =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'level',  called: () => (data[LEVEL]), line: 985});
				// ---- 2. bars and section gates, the bars ----
				// the first beat of a bar is a little brighter and heavier
				const bar =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'bar',  called: () => (FEATURES.grid.on && rowBars[n]), line: 988});
				// an accent is heavier and brighter; a filler row is faintest
				const weight =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'weight',  called: () => (rowWeights[n]), line: 990});
				// how near "now" it is: what lights its body (4)
				const near =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'near',  called: () => (Math.exp(-Math.pow(tau / (beat * 2), 2))), line: 992});
				// PULSE: a row on a beat of the grid stands a little taller than one between; fixed to the row's own time,
				// so it rolls towards the viewer with the terrain
				const pulse =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'pulse',  called: () => (K.PULSE > 0 ? Math.max(0.4, 1 + K.PULSE * 0.3 * Math.cos((Math.PI * 2 * (time - (shown?.beats[0]?.start ?? 0))) / beat)) : 1), line: 995});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (row(
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
                				)), line: 996});
			}
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (!liveDrawn), line: 1009})) {
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (gatesBehind(viewTime)), line: 1010});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (drawLive()), line: 1011});
			}
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (gatesBehind(-1e9)), line: 1013});

			// ---- the echoes: a skin stretched between the ring and where the mountains stood ---------------------
			// it lifts off only where the mountain was, outward, or inward when that ring points inward
			const liftNow =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'liftNow',  called: () => (liftOf(K.Z_NOW, 1)), line: 1017});
			const life =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'life',  called: () => (K.ECHO_BEATS * beat), line: 1018});
			const dirNow =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'dirNow',  called: () => (dirOf(rowBefore(viewTime))), line: 1019});
			const srcH =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'srcH',  called: () => (heightsOf(live)), line: 1020});
			for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 1021}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (liveH[i] = srcH[i]), line: 1021});
			const atNow =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'atNow',  called: () => ((i: number, height: number, reflected: boolean) => place(K.Z_NOW, ACROSS[i], dirNow * height * liftNow, reflected)), line: 1022});
			// 9. colour by note: one conic gradient around the ring, a stop at each lane, opaque (the alpha is set on the context).
			// Built again for the filled line, because that fill is painted after the bank is undone and put back.
			const makeNoteGrad =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'makeNoteGrad',  called: () => (() => {
            				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (!(FEATURES.notes.on && K.NOTE_COLOUR > 0.01)), line: 1026})) return null;
            				const start =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'start',  called: () => (angleOf(-1)), line: 1027});
            				const grad =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'grad',  called: () => (ctx.createConicGradient(start, centerAt(K.Z_NOW), cy)), line: 1028});
            				const stops: { t: number; r: number; g: number; b: number }[] =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'stops',  called: () => ([]), line: 1029});
            				let prev =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'prev',  called: () => (-1), line: 1030});
            				const spanOf =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'spanOf',  called: () => (laneSpan()), line: 1031});
            				for (let f = 0; f < 12;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (f++), line: 1032})) {
            					const n =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'n',  called: () => (noteRgb[f]), line: 1033});
            					const m =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'm',  called: () => (K.NOTE_COLOUR), line: 1034});
            					const lane =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'lane',  called: () => (-spanOf + (2 * spanOf * f) / 11), line: 1035});
            					let d =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'd',  called: () => (angleOf(lane) - start), line: 1036});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (d = ((d % TAU) + TAU) % TAU), line: 1037});
            					let t =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 't',  called: () => (d / TAU), line: 1038});
            					// stops have to climb, and stay off the exact ends where the seam is one ray
            					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (t <= prev), line: 1040}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (t = Math.min(0.998, prev + 0.0008)), line: 1040});
            					else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (t = Math.min(0.998, Math.max(0.001, t))), line: 1041});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (prev = t), line: 1042});
            					const color =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'color',  called: () => ({ r: liveRgb.r + (n.r - liveRgb.r) * m, g: liveRgb.g + (n.g - liveRgb.g) * m, b: liveRgb.b + (n.b - liveRgb.b) * m }), line: 1043});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (stops.push({ t, ...color })), line: 1044});
            					// the reflection carries the same colour, so each side join is one colour meeting itself
            					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (mirrored), line: 1046})) {
            						const back =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'back',  called: () => (1 - t), line: 1047});
            						if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (back > t + 0.001 && back < 0.999), line: 1048}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (stops.push({ t: back, ...color })), line: 1048});
            					}
            				}
            				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (!mirrored), line: 1051})) {
            					// @what - fade the last note's colour into the first across the open bottom
            					// @why - pinning each end colour up to the seam makes the bright ring step from one to the other
            					const first =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'first',  called: () => (stops[0]), line: 1054});
            					const last =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'last',  called: () => (stops[stops.length - 1]), line: 1055});
            					const span =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'span',  called: () => (first.t + 1 - last.t), line: 1056});
            					const steps =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'steps',  called: () => (8), line: 1057});
            					for (let s = 1; s < steps;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (s++), line: 1058})) {
            						const u =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'u',  called: () => (s / steps), line: 1059});
            						let t =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 't',  called: () => (last.t + span * u), line: 1060});
            						if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (t >= 1), line: 1061}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (t -= 1), line: 1061});
            						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (stops.push({ t, r: last.r + (first.r - last.r) * u, g: last.g + (first.g - last.g) * u, b: last.b + (first.b - last.b) * u })), line: 1062});
            					}
            					const uSeam =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'uSeam',  called: () => (span > 1e-6 ? (1 - last.t) / span : 0), line: 1064});
            					const seam =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'seam',  called: () => ({ r: last.r + (first.r - last.r) * uSeam, g: last.g + (first.g - last.g) * uSeam, b: last.b + (first.b - last.b) * uSeam }), line: 1065});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (stops.push({ t: 0, ...seam })), line: 1066});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (stops.push({ t: 0.999, ...seam })), line: 1067});
            				}
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (stops.sort((p, q) => p.t - q.t)), line: 1069});
            				let placed =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'placed',  called: () => (-1), line: 1070});
            				for (const stop of stops) {
            					let t =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 't',  called: () => (Math.max(0, Math.min(0.999, stop.t))), line: 1072});
            					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (t <= placed), line: 1073}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (t = placed + 0.0004), line: 1073});
            					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (t > 0.999), line: 1074})) continue;
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (placed = t), line: 1075});
            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (grad.addColorStop(t, rgbString(stop))), line: 1076});
            				}
            				return grad;
            			}), line: 1025});
			const noteGrad =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'noteGrad',  called: () => (makeNoteGrad()), line: 1080});
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.save()), line: 1081});
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.globalCompositeOperation = "lighter"), line: 1082});
			for (let e = echoes.length - 1; e >= 0;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (e--), line: 1083})) {
				const echo =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'echo',  called: () => (echoes[e]), line: 1084});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (echo.age += c.dt), line: 1085});
				const t =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 't',  called: () => (echo.age / life), line: 1086});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (t >= 1), line: 1087})) {
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (echoes.splice(e, 1)), line: 1088});
					continue;
				}
				// it arrives over a few frames rather than appearing, and leaves slower than it came
				const a =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'a',  called: () => (smoothstep(echo.age / 0.04) * (1 - t) * (1 - t) * Math.min(1, 0.2 + echo.amp * 0.6) * presence), line: 1092});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (a < 0.01), line: 1093})) continue;
				const swell =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'swell',  called: () => (1 + (1 - (1 - t) * (1 - t)) * (K.ECHO_SWELL_SOFT + Math.min(1, echo.amp) * (K.ECHO_SWELL_HARD - K.ECHO_SWELL_SOFT))), line: 1094});
				const eh =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'eh',  called: () => (heightsOf(echo.data)), line: 1095});
				// the skin: from the echo back to the ring, the upper half then its reflection
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.beginPath()), line: 1097});
				let first =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'first',  called: () => (true), line: 1098});
				const add =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'add',  called: () => ((i: number, height: number, reflected: boolean) => {
                					const [x, y] =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: '[x, y]',  called: () => (atNow(i, height, reflected)), line: 1100});
                					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (first), line: 1101}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.moveTo(x, y)), line: 1101});
                					else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.lineTo(x, y)), line: 1102});
                					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (first = false), line: 1103});
                				}), line: 1099});
				for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 1105}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (add(i, Math.max(eh[i] * swell, liveH[i]), false)), line: 1105});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (mirrored), line: 1106})) for (let i = POINTS - 1; i >= 0;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i--), line: 1106}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (add(i, Math.max(eh[i] * swell, liveH[i]), true)), line: 1106});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (mirrored), line: 1107})) for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 1107}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (add(i, liveH[i], true)), line: 1107});
				for (let i = POINTS - 1; i >= 0;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i--), line: 1108}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (add(i, liveH[i], false)), line: 1108});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.closePath()), line: 1109});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (noteGrad), line: 1110})) {
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.globalAlpha = a * 0.22), line: 1111});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fillStyle = noteGrad), line: 1112});
				} else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fillStyle = rgbString(liveRgb, a * 0.22)), line: 1113});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fill()), line: 1114});
				// its edge: only where it stands off the ring, leaving the ring and coming back to it
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.beginPath()), line: 1116});
				let off =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'off',  called: () => (false), line: 1117});
				let prevX =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'prevX',  called: () => (0), line: 1118});
				let prevY =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'prevY',  called: () => (0), line: 1119});
				let seen =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'seen',  called: () => (false), line: 1120});
				const edge =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'edge',  called: () => ((i: number, reflected: boolean) => {
                					const h =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'h',  called: () => (eh[i] * swell), line: 1122});
                					const [lx, ly] =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: '[lx, ly]',  called: () => (atNow(i, liveH[i], reflected)), line: 1123});
                					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (h > liveH[i] + 0.004), line: 1124})) {
                						if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (!off), line: 1125}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.moveTo(seen ? prevX : lx, seen ? prevY : ly)), line: 1125});
                						const [x, y] =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: '[x, y]',  called: () => (atNow(i, h, reflected)), line: 1126});
                						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.lineTo(x, y)), line: 1127});
                						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (off = true), line: 1128});
                					} else if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (off), line: 1129})) {
                						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.lineTo(lx, ly)), line: 1130});
                						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (off = false), line: 1131});
                					}
                					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (prevX = lx), line: 1133});
                					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (prevY = ly), line: 1134});
                					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (seen = true), line: 1135});
                				}), line: 1121});
				for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 1137}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (edge(i, false)), line: 1137});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (mirrored), line: 1138})) for (let i = POINTS - 1; i >= 0;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i--), line: 1138}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (edge(i, true)), line: 1138});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (noteGrad), line: 1139})) {
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.globalAlpha = a * 0.85), line: 1140});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.strokeStyle = noteGrad), line: 1141});
				} else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.strokeStyle = rgbString(liveRgb, a * 0.85)), line: 1142});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.lineWidth = Math.max(1, scale * 0.0026 * (1 - t * 0.5))), line: 1143});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.stroke()), line: 1144});
			}
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.restore()), line: 1146});

			// ---- 8. the strands: the twelve notes of the sound at "now", whose sum is the line -----------------------
			// light only (they add to what is under them): a note's hill, or, with STRAND_WAVE, a wave at the note's pitch
			// ratio sliding along on the track's clock, so a paused picture does not move
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (FEATURES.strands.on && presence > 0.02 && strandAmp > 0.004), line: 1151})) {
				let top =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'top',  called: () => (0), line: 1152});
				for (let k = 0; k < 12;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (k++), line: 1153}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (top = Math.max(top, strandW[k])), line: 1153});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.save()), line: 1154});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.globalCompositeOperation = "lighter"), line: 1155});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.lineWidth = Math.max(1, scale * 0.0024)), line: 1156});
				const wave =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'wave',  called: () => (K.STRAND_WAVE), line: 1157});
				for (let k = 0; k < 12;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (k++), line: 1158})) {
					const w =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'w',  called: () => (strandW[k]), line: 1159});
					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (w < 0.03), line: 1160})) continue;
					const a =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'a',  called: () => (Math.min(1, 0.6 * K.STRAND_LIGHT * presence * (0.25 + (0.75 * w) / top))), line: 1161});
					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (a < 0.01), line: 1162})) continue;
					const ratio =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'ratio',  called: () => (Math.pow(2, k / 12)), line: 1163});
					const cycles =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'cycles',  called: () => (2 * ratio), line: 1164});
					const phase =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'phase',  called: () => (viewTime * 0.35 * ratio), line: 1165});
					const amp =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'amp',  called: () => (strandAmp * w), line: 1166});
					for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 1167})) {
						let y =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'y',  called: () => (STRAND_HILLS[k * POINTS + i]), line: 1168});
						// the window fades the ends of a straight line; on a mirror those ends are the side joins
						const win =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'win',  called: () => (mirrored ? 1 : STRAND_WINDOW[i]), line: 1170});
						if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (wave > 0.001), line: 1171}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (y = y * (1 - wave) + wave * (0.5 + 0.5 * Math.sin(Math.PI * 2 * (cycles * (ACROSS[i] + 1) * 0.5 + phase))) * win), line: 1171});
						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (strandY[i] = K.RIDGE_LIMIT * Math.tanh((y * amp) / K.RIDGE_LIMIT)), line: 1172});
					}
					const sh =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'sh',  called: () => (heightsOf(strandY)), line: 1174});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.beginPath()), line: 1175});
					let first =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'first',  called: () => (true), line: 1176});
					const add =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'add',  called: () => ((i: number, reflected: boolean) => {
                    						const [x, y] =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: '[x, y]',  called: () => (atNow(i, sh[i], reflected)), line: 1178});
                    						if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (first), line: 1179}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.moveTo(x, y)), line: 1179});
                    						else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.lineTo(x, y)), line: 1180});
                    						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (first = false), line: 1181});
                    					}), line: 1177});
					for (let i = 0; i < POINTS; i += 2)  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (add(i, false)), line: 1183});
					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => ((POINTS - 1) % 2 !== 0), line: 1184}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (add(POINTS - 1, false)), line: 1184});
					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (mirrored), line: 1185})) {
						for (let i = POINTS - 1; i >= 0; i -= 2)  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (add(i, true)), line: 1186});
						 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.closePath()), line: 1187});
					} else if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (closed), line: 1188}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.closePath()), line: 1188});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.strokeStyle = rgbString(noteRgb[Math.round(lanePos(k))], a)), line: 1189});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.stroke()), line: 1190});
				}
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.restore()), line: 1192});
			}

			// ---- the ring itself, on top ----------------------------------------------------------------------------
			// along the crest. The filled copy walks back along the baseline, which is the band under the peaks.
			// LINE only thickens the stroke.
			const strokeNow =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'strokeNow',  called: () => (() => {
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.beginPath()), line: 1199});
            				let first =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'first',  called: () => (true), line: 1200});
            				const add =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'add',  called: () => ((i: number, reflected: boolean) => {
                            					const [x, y] =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: '[x, y]',  called: () => (atNow(i, liveH[i], reflected)), line: 1202});
                            					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (first), line: 1203}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.moveTo(x, y)), line: 1203});
                            					else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.lineTo(x, y)), line: 1204});
                            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (first = false), line: 1205});
                            				}), line: 1201});
            				for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 1207}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (add(i, false)), line: 1207});
            				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (mirrored), line: 1208})) for (let i = POINTS - 1; i >= 0;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i--), line: 1208}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (add(i, true)), line: 1208});
            				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (closed || mirrored), line: 1209}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.closePath()), line: 1209});
            			}), line: 1198});
			const fillNow =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'fillNow',  called: () => (() => {
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.beginPath()), line: 1212});
            				let first =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'first',  called: () => (true), line: 1213});
            				const add =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'add',  called: () => ((i: number, height: number, reflected: boolean) => {
                            					const [x, y] =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: '[x, y]',  called: () => (atNow(i, height, reflected)), line: 1215});
                            					if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (first), line: 1216}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.moveTo(x, y)), line: 1216});
                            					else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.lineTo(x, y)), line: 1217});
                            					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (first = false), line: 1218});
                            				}), line: 1214});
            				for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 1220}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (add(i, liveH[i], false)), line: 1220});
            				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (mirrored), line: 1221})) for (let i = POINTS - 1; i >= 0;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i--), line: 1221}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (add(i, liveH[i], true)), line: 1221});
            				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (mirrored), line: 1222})) for (let i = 0; i < POINTS;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i++), line: 1222}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (add(i, 0, true)), line: 1222});
            				for (let i = POINTS - 1; i >= 0;  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (i--), line: 1223}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (add(i, 0, false)), line: 1223});
            				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.closePath()), line: 1224});
            			}), line: 1211});
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (!FEATURES.filled.on), line: 1226})) {
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (strokeNow()), line: 1227});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (noteGrad), line: 1228})) {
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.save()), line: 1229});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.globalAlpha = 0.95), line: 1230});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.strokeStyle = noteGrad), line: 1231});
				} else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.strokeStyle = rgbString(liveRgb, 0.95)), line: 1232});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.lineWidth = Math.max(1.5, scale * 0.0042) * K.LINE), line: 1233});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.stroke()), line: 1234});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (noteGrad), line: 1235}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.restore()), line: 1235});
			}

			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (banked), line: 1238}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.restore()), line: 1238});

			// the halo swells with the sound itself and with a moment
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (glow(ctx, ctx.canvas, width, height, scale, (0.3 + c.energy * 0.6 + c.impact * 0.5) * K.GLOW)), line: 1241});

			// @why - the glow adds a brightened blur back with "lighter". On a thin stroke that bloom falls on the
			// black beside it. On a solid fill it stacks across the interior and the colour blows out. Painted
			// after the glow, the fill stays the stroke's own colour, and it does not grow the thin line's halo.
			if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (FEATURES.filled.on), line: 1246})) {
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (banked), line: 1247}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (applyBank()), line: 1247});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (fillNow()), line: 1248});
				const fillGrad =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'fillGrad',  called: () => (makeNoteGrad()), line: 1249});
				const cover =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'cover',  called: () => (0.95 * K.UNDER), line: 1250});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (fillGrad), line: 1251})) {
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.save()), line: 1252});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.globalAlpha = cover), line: 1253});
					 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fillStyle = fillGrad), line: 1254});
				} else  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fillStyle = rgbString(liveRgb, cover)), line: 1255});
				 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.fill()), line: 1256});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (fillGrad), line: 1257}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.restore()), line: 1257});
				if ( tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (banked), line: 1258}))  tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (ctx.restore()), line: 1258});
			}
		},
		dispose() {
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (rows.clear()), line: 1262});
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (gates.clear()), line: 1263});
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (glow.dispose()), line: 1264});
			 tsWorksheetWatch({stringed: 'empty', type: 'expression', variable: undefined,  called: () => (setCanvasHoles(false)), line: 1265});
		}
	};
}

const ringPreset: PresetDefinition =  tsWorksheetWatch({stringed: 'empty', type: 'variable', variable: 'ringPreset',  called: () => ({ id: "ring", name: "Ring", experimental: true, create }), line: 1270});

} catch(error) {

  
}
}

__tsrun().then()

let ___done_ts_worksheet = "";
___done_ts_worksheet = "asdf";


function stringify(obj: any) {
  let cache: any = [];
  let str = JSON.stringify(obj, function(key, value) {
    if(typeof value === 'function') {
      const fn = __tsGetFn(value.toString()) ?? __tsGetArrowFn(value.toString());
      return fn;
    }
    if(value === undefined) {
      return '__TS_WORKSHEET_UNDEFINED__'
    }
    if (typeof value === "object" && value !== null) {
      if(value?.then) {
        return 'Promise';
      }
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
      return value === undefined ? '__TS_WORKSHEET_UNDEFINED__' : value;
    }
    return value;
  });
  cache = null; // reset the cache
  return str;
}



function __tsGetFn(str: string) {
  const noSpaces = str.replaceAll(' ', '');
  const __tsFnWithArgs = /(function.*\(.*\))/
  const result = __tsFnWithArgs.exec(noSpaces);
  if(result?.length) {
    
    const fn = result.at(-1);
    const afterKey = fn.substring('function'.length);
    return 'function ' + afterKey;
  }
  return undefined;
}

function __tsGetArrowFn(str: string) {
  const noSpaces = str.replaceAll(' ', '');
  const __tsArrowWithArgs= /(\({0,1}[A-Za-z]{1}[A-Za-z0-9_,]*\){0,1})=>/;
const __tsArrorWithoutArgs = /\(\){1}=>/;
  const arrowWithArgsResult = __tsArrowWithArgs.exec(noSpaces);
  if(arrowWithArgsResult?.length) {
    const args =  arrowWithArgsResult.at(-1);
    return 'arrow fn(' + args + ')';
  }
  const arrowWithoutArgsResult = __tsArrorWithoutArgs.exec(noSpaces);
  if(arrowWithoutArgsResult?.length) {
    return 'arrow fn()';
  }
  return undefined;
}

function tryToStringify(value: any) {
    let res = '';
    try {
        switch(typeof value) {
            case 'object':
                res = stringify(value);
                break;
            case 'function':
                res = __tsGetFn(value.toString()) ?? __tsGetArrowFn(value.toString());
                break;
            case 'bigint':
                res = value?.toString();
                break;    
            default: 
                // isNaN
                if(value !== value) {
                  res = value?.toString();
                } else {
                  res = value === undefined ? '__TS_WORKSHEET_UNDEFINED__' : value;
                }
        }
    } catch(err: any) {
        return err?.message.startsWith('Convert') ? 'Non displayable' : err?.message;
    }
    return res?.length > 2000 ? res?.substring(0, 2000) : res;
}

function __onError(error: any, dataValue: any) {
  const fixedError = error?.stack ?? error;
  const stringError = JSON.stringify(fixedError, Object.getOwnPropertyNames(fixedError));

  dataValue.type = 'error';
  dataValue.called = [error.message , stringError];
}
function save(hide: boolean, dataValue?: any) {
  if(hide) {
    return;
  }
  const isIpcCompatible = !false && typeof Bun === 'undefined' && !globalThis?.Deno && !os.platform().startsWith('win');
  if(dataValue) {
    dataFile.push(dataValue);
  }

  if(isIpcCompatible) {
    process.send(dataValue);
  }

  if(!dataValue && !isIpcCompatible) {
    __fs.writeFileSync('d:\\machinemessiah\\wairence\\vivy\\src\\presets\\.ws.data.json', JSON.stringify(dataFile));  
  }
}

function tsWorksheetWatch(data: {stringed: string, hide?: boolean, type: string, variable?: string, called: () => any, line: number }) {
  const dataValue = {...data, called: 'Failed Promise. Please use a .catch to display it'};
  let called: any;
  try {
      called = data.called();
  } catch(error) {
      __onError(error, dataValue);
      save(data.hide, dataValue);
      throw error;
  }

  if(data.type === 'throw') {
      __onError(called, dataValue);
      save(data.hide, dataValue);
      throw called;
  }

  if(called?.then) {
     data.called = called.then((r: any) => {
      dataValue.prefix = 'Resolved Promise: ';
        dataValue.called = tryToStringify(r);
         save(data.hide, dataValue);
         return r;
     }).catch((err: any) => {
      dataValue.prefix = 'Rejected Promise: ';
      dataValue.called = tryToStringify(err);
      dataValue.type = 'error';
      save(data.hide, dataValue);
      throw err;
     });
  } else {
      dataValue.called = tryToStringify(called);
      save(data.hide, dataValue);
  }

  return called;
}

function mylog(logFn: any, data: {type: string, called: any[], line: number }) {
    logFn(...data.called);
    data.called = data.called.map(entry => tryToStringify(entry)); 
    save(false, data);
}

if (globalThis?.Deno) {

  addEventListener("error", (event) => {
    event.preventDefault();
  });
  
  addEventListener("unhandledrejection", (e) => {
    e.preventDefault();
  });
  
  addEventListener("unload", () => {
    save(false);
  });
  }
  process?.on('uncaughtException', (error: Error) => {   
  });
  
  process?.on('unhandledRejection', () => {})
  
  process?.on('beforeExit', e => {
    if(typeof Bun !== 'undefined' && dataFile.some(e => e.type === 'error')) {
      process.exit(0);
    }
  })
  
  process?.on('exit', function() {
    save(false);
  });
      
    