// Terrain's WebGL2 renderer. The song is a height field over (time, note): `setTrack` puts its chroma (twelve note weights,
// loudness, sharpness, section hue, level per row of time) in a float texture once per track, and the vertex shader builds
// the mountains from it (a gaussian hill per note), so nothing is uploaded per frame and a knob is only a uniform.
// One draw call is the whole terrain: there is no vertex buffer, `gl_VertexID` says which corner of which cell of the grid.

export type TerrainFrame = {
	width: number;
	height: number;
	// column-major view-projection
	vp: Float32Array;
	// the song: the clock, seconds per beat, where the beat grid starts, the data's rows per second and count, the track's end
	time: number;
	beat: number;
	beat0: number;
	rate: number;
	rows: number;
	end: number;
	// the grid of rows drawn: time of the first, seconds between them, how many; beats of past and future shown
	anchor: number;
	dt: number;
	meshRows: number;
	past: number;
	future: number;
	// the mountains
	halfWidth: number;
	heightScale: number;
	hill: number;
	hillAmp: number;
	jag: number;
	limit: number;
	laneSpan: number;
	lane: Float32Array;
	presence: number;
	harmony: number;
	// colour: six stops along the palette, a colour for each of the twelve places a note can stand, and what the gradient follows (0 height, 1 depth, 2 note, 3 sound)
	ramp: Float32Array;
	laneRgb: Float32Array;
	follows: number;
	soundAt: number;
	quiet: number;
	loud: number;
	// surface and lines
	fill: number;
	light: number;
	glint: number;
	rowLines: number;
	laneLines: number;
	contourLight: number;
	contours: number;
	lineWidth: number;
	fogStart: number;
	lit: boolean;
	rowsOn: boolean;
	lanesOn: boolean;
	contoursOn: boolean;
	nowOn: boolean;
	// reflection (0 = off), dust (0 = off), horizon glow (strength 0 = off)
	mirror: number;
	dust: number;
	dustRgb: [number, number, number];
	sky: [number, number, number];
	skyStrength: number;
	horizonY: number;
	skyHeight: number;
	skyWidth: number;
	skyX: number;
};

export type TerrainRenderer = {
	canvas: HTMLCanvasElement;
	// a GPU reset, a driver update, sleep: the context goes, and everything made in it with it
	lost: () => boolean;
	dispose: () => void;
	// `data`: 16 floats per row (see terrain.ts); null for no track
	setTrack: (data: Float32Array | null, rows: number) => void;
	draw: (f: TerrainFrame) => void;
};

const COLUMNS = 96;
const DUST = 70;

const MESH_VS = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
uniform sampler2D uData;
uniform mat4 uVP;
uniform float uTime, uBeat, uRate, uRows, uEnd, uAnchor, uDt, uMeshRows, uPast, uFuture;
uniform float uWidth, uHeight, uHill, uHillAmp, uJag, uLimit, uPresence, uMirror, uHarmony;
uniform float uLane[12];
out vec3 vWorld;
out float vH;
out float vT;
out float vTb;
out float vLevel;
out float vLean;
out float vU;

const ivec2 CORNER[6] = ivec2[6](ivec2(0, 0), ivec2(1, 0), ivec2(0, 1), ivec2(1, 0), ivec2(1, 1), ivec2(0, 1));

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y) * 2.0 - 1.0;
}
vec4 texel(int r, int c) { return texelFetch(uData, ivec2(c, clamp(r, 0, int(uRows) - 1)), 0); }
vec4 rowAt(int r, float f, int c) { return mix(texel(r, c), texel(r + 1, c), f); }

void main() {
	int q = gl_VertexID / 6;
	int corner = gl_VertexID - q * 6;
	int qr = q / ${COLUMNS - 1};
	int qc = q - qr * ${COLUMNS - 1};
	ivec2 off = CORNER[corner];
	// far rows first, so a see-through terrain is painted back to front
	float j = uMeshRows - 1.0 - float(qr + off.y);
	float t = uAnchor + j * uDt;
	float x = -1.0 + 2.0 * float(qc + off.x) / ${(COLUMNS - 1).toFixed(1)};

	float fr = clamp(t, 0.0, uEnd) * uRate;
	int i0 = int(floor(fr));
	float f = fr - floor(fr);
	vec4 a0 = rowAt(i0, f, 0);
	vec4 a1 = rowAt(i0, f, 1);
	vec4 a2 = rowAt(i0, f, 2);
	vec4 a3 = rowAt(i0, f, 3);
	float w[12] = float[12](a0.x, a0.y, a0.z, a0.w, a1.x, a1.y, a1.z, a1.w, a2.x, a2.y, a2.z, a2.w);
	float s = 0.0;
	for (int k = 0; k < 12; k++) {
		float d = (x - uLane[k]) / uHill;
		s += w[k] * exp(-d * d);
	}
	float h = s * uHillAmp * a3.x;
	h *= 1.0 + vnoise(vec2(x * 9.0, t * 2.2)) * a3.y * uJag;
	h = uLimit * tanh(max(h, 0.0) / uLimit);
	h *= smoothstep(0.0, 0.3, t) * smoothstep(0.0, 0.3, uEnd - t);

	float tb = (t - uTime) / uBeat;
	// what has been played sinks, what is far rises out of the fog
	float sunk = tb >= 0.0 ? 1.0 : exp(tb / 0.7);
	float rise = 1.0 - smoothstep(uFuture * 0.8, uFuture, tb);
	h *= sunk * rise * uPresence;

	vWorld = vec3(x * uWidth, h * uHeight * uMirror, tb);
	vH = h;
	vT = t;
	vTb = tb;
	vLevel = a3.w;
	vLean = a3.z * uHarmony;
	vU = x;
	gl_Position = uVP * vec4(vWorld, 1.0);
}`;

const MESH_FS = `#version 300 es
precision highp float;
uniform vec3 uRamp[6];
uniform vec3 uLaneRgb[12];
uniform vec3 uLightDir;
uniform float uFollows, uSoundAt, uQuiet, uLoud, uFill, uLight, uGlint, uRowLines, uLaneLines, uContourLight, uContours;
uniform float uLineW, uFogStart, uFuture, uLimit, uLaneSpan, uRowDt, uBar, uBeat0, uPass, uMirrorAmt;
uniform float uLit, uRowsOn, uLanesOn, uContoursOn, uNowOn;
in vec3 vWorld;
in float vH;
in float vT;
in float vTb;
in float vLevel;
in float vLean;
in float vU;
out vec4 o;

vec3 ramp(float f) {
	float p = clamp(f, 0.0, 1.0) * 5.0;
	int i = min(int(floor(p)), 4);
	return mix(uRamp[i], uRamp[i + 1], p - float(i));
}
// the colour turned about the grey axis: the section's key leaning the hue
vec3 hueRot(vec3 c, float turns) {
	float a = turns * 6.2831853;
	float s = sin(a);
	float co = cos(a);
	vec3 k = vec3(0.57735);
	return c * co + cross(k, c) * s + k * dot(k, c) * (1.0 - co);
}
// a line of constant c, uLineW pixels either side, however the surface is tilted
float lineAt(float c) {
	float g = abs(fract(c - 0.5) - 0.5) / max(fwidth(c), 1e-6);
	return 1.0 - clamp(g / uLineW, 0.0, 1.0);
}

void main() {
	float hn = clamp(vH / uLimit, 0.0, 1.0);
	float lvl = smoothstep(0.0, 1.0, (vLevel - uQuiet) / (uLoud - uQuiet));
	float ahead = clamp(vTb / uFuture, 0.0, 1.0);
	float f = uFollows < 0.5 ? mix(lvl, hn, 0.4) : uFollows < 1.5 ? 1.0 - ahead : uFollows < 2.5 ? clamp(vU / (2.0 * uLaneSpan) + 0.5, 0.0, 1.0) : uSoundAt;
	vec3 base = hueRot(ramp(f), vLean);
	float close = exp(-(vTb * vTb) / 4.0);
	float fog = smoothstep(uFogStart * uFuture, uFuture, vTb);

	// 4. the body: dim, lit from the ridge and from "now", never bright enough to bloom
	vec3 surf = vec3(0.0);
	if (uLit > 0.5 && uPass < 0.5) {
		vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
		if (n.y < 0.0) n = -n;
		float lam = max(dot(n, uLightDir), 0.0);
		surf = base * (uLight * (0.05 + 0.45 * lam) * (0.25 + 0.75 * close) * (0.3 + hn * 1.2) + uGlint * close * hn * 0.6);
	}

	// 2. a line on every row and a heavier one on every bar; they brighten as they cross "now"
	vec3 lineCol = base * (0.55 + 0.9 * hn);
	float crossing = 1.0 + 2.0 * exp(-(vTb * vTb) / 0.1225);
	vec3 lines = vec3(0.0);
	if (uRowsOn > 0.5) lines += lineCol * (lineAt(vT / uRowDt) * 0.5 + lineAt((vT - uBeat0) / uBar) * 0.9) * uRowLines * crossing;
	// 3. a line along each note's lane, brighter where the note is strong
	if (uLanesOn > 0.5) {
		float pos = (vU + uLaneSpan) / (2.0 * uLaneSpan) * 11.0;
		float n = clamp(floor(pos + 0.5), 0.0, 11.0);
		float du = abs(pos - n) * (2.0 * uLaneSpan / 11.0);
		float m = pos > -0.5 && pos < 11.5 ? 1.0 - clamp(du / (max(fwidth(vU), 1e-6) * uLineW), 0.0, 1.0) : 0.0;
		lines += uLaneRgb[int(n)] * m * uLaneLines * (0.1 + hn * 1.4);
	}
	// a contour at every step of height
	if (uContoursOn > 0.5 && hn > 0.02) lines += base * lineAt(hn * uContours) * uContourLight * 0.35 * (0.4 + hn);
	// the line at "now"
	if (uNowOn > 0.5) lines += mix(base, vec3(1.0), 0.45) * (1.0 - clamp(abs(vTb) / max(fwidth(vTb), 1e-6) / (uLineW * 1.6), 0.0, 1.0)) * 1.1;

	if (uPass > 0.5) {
		o = vec4(lines * (1.0 - fog) * uMirrorAmt, 1.0);
		return;
	}
	vec3 c = (surf * uFill + lines) * (1.0 - fog * 0.95);
	o = vec4(c, clamp(uFill + max(lines.r, max(lines.g, lines.b)), 0.0, 1.0));
}`;

const SKY_VS = `#version 300 es
void main() {
	vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
	gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
// a low wide band along the horizon, brightest on it: a third as far below as above
const SKY_FS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec3 uSky;
uniform float uStrength, uHorizon, uSkyH, uSkyW, uSkyX;
out vec4 o;
void main() {
	vec2 uv = gl_FragCoord.xy / uRes;
	float dy = (uv.y - uHorizon) / (uSkyH * (uv.y > uHorizon ? 1.0 : 0.33));
	float dx = (uv.x - uSkyX) / uSkyW;
	o = vec4(uSky * uStrength * exp(-dy * dy * 2.5) * exp(-dx * dx * 2.5), 1.0);
}`;

const DUST_VS = `#version 300 es
precision highp float;
uniform mat4 uVP;
uniform float uTime, uBeat, uWidth, uHeight, uLimit, uPast, uFuture, uPointSize;
out float vA;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
	float id = float(gl_VertexID);
	float r1 = hash(vec2(id, 1.0));
	float r2 = hash(vec2(id, 2.0));
	float r3 = hash(vec2(id, 3.0));
	float r4 = hash(vec2(id, 4.0));
	float span = uPast + uFuture;
	// carried at the terrain's speed, on the track's clock
	float tb = fract(r3 - uTime / uBeat / span) * span - uPast;
	vA = (1.0 - smoothstep(uFuture * 0.8, uFuture, tb)) * smoothstep(-uPast, -uPast * 0.3, tb) * (0.4 + 0.6 * r4);
	gl_Position = uVP * vec4((r1 * 2.0 - 1.0) * uWidth * 1.2, uHeight * uLimit * (1.0 + r2 * 2.4), tb, 1.0);
	gl_PointSize = uPointSize * (1.0 + r4);
}`;
const DUST_FS = `#version 300 es
precision highp float;
uniform vec3 uColour;
uniform float uLight;
in float vA;
out vec4 o;
void main() {
	float g = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
	o = vec4(uColour * vA * g * uLight, 1.0);
}`;

// null without WebGL2 (headless check, or switched off, or only a software renderer, which 2D Ridgeline beats);
// the simulation still runs so its numbers are checked
export function createTerrainRenderer(): TerrainRenderer | null {
	if (typeof document === "undefined") return null;
	const canvas = document.createElement("canvas");
	const gl = canvas.getContext("webgl2", { alpha: false, antialias: true, premultipliedAlpha: false, depth: true }) as WebGL2RenderingContext | null;
	if (!gl || typeof gl.createShader !== "function" || typeof gl.texImage2D !== "function") return null;
	const info = gl.getExtension("WEBGL_debug_renderer_info");
	const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
	if (/swiftshader|llvmpipe|software/i.test(renderer)) {
		gl.getExtension("WEBGL_lose_context")?.loseContext();
		return null;
	}

	const program = (name: string, vs: string, fs: string) => {
		const p = gl.createProgram()!;
		for (const [type, src] of [
			[gl.VERTEX_SHADER, vs],
			[gl.FRAGMENT_SHADER, fs]
		] as const) {
			const s = gl.createShader(type)!;
			gl.shaderSource(s, src);
			gl.compileShader(s);
			if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`terrain ${name} shader: ${gl.getShaderInfoLog(s)}`);
			gl.attachShader(p, s);
		}
		gl.linkProgram(p);
		if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`terrain ${name} link: ${gl.getProgramInfoLog(p)}`);
		return p;
	};
	const mesh = program("mesh", MESH_VS, MESH_FS);
	const sky = program("sky", SKY_VS, SKY_FS);
	const dust = program("dust", DUST_VS, DUST_FS);
	const where = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();
	const at = (p: WebGLProgram, name: string) => {
		let m = where.get(p);
		if (!m) where.set(p, (m = new Map()));
		if (!m.has(name)) m.set(name, gl.getUniformLocation(p, name));
		return m.get(name) ?? null;
	};
	const f1 = (p: WebGLProgram, name: string, v: number) => gl.uniform1f(at(p, name), v);
	const flag = (p: WebGLProgram, name: string, on: boolean) => gl.uniform1f(at(p, name), on ? 1 : 0);

	const texture = gl.createTexture()!;
	const vao = gl.createVertexArray()!;
	let rows = 0;

	return {
		canvas,
		lost: () => gl.isContextLost(),
		dispose() {
			gl.getExtension("WEBGL_lose_context")?.loseContext();
			canvas.width = canvas.height = 0;
		},
		setTrack(data, n) {
			rows = data ? n : 0;
			if (!data) return;
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 4, n, 0, gl.RGBA, gl.FLOAT, data);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		},
		draw(f) {
			if (canvas.width !== f.width || canvas.height !== f.height) {
				canvas.width = f.width;
				canvas.height = f.height;
			}
			gl.viewport(0, 0, f.width, f.height);
			gl.clearColor(0, 0, 0, 1);
			gl.clearDepth(1);
			gl.depthMask(true);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.bindVertexArray(vao);
			gl.enable(gl.BLEND);
			gl.disable(gl.DEPTH_TEST);

			// 1. the glow on the horizon
			if (f.skyStrength > 0.004) {
				gl.useProgram(sky);
				gl.blendFunc(gl.ONE, gl.ONE);
				gl.uniform2f(at(sky, "uRes"), f.width, f.height);
				gl.uniform3f(at(sky, "uSky"), f.sky[0], f.sky[1], f.sky[2]);
				f1(sky, "uStrength", f.skyStrength);
				f1(sky, "uHorizon", f.horizonY);
				f1(sky, "uSkyH", f.skyHeight);
				f1(sky, "uSkyW", f.skyWidth);
				f1(sky, "uSkyX", f.skyX);
				gl.drawArrays(gl.TRIANGLES, 0, 3);
			}

			// the terrain
			if (rows > 0 && f.meshRows > 1) {
				gl.useProgram(mesh);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.uniform1i(at(mesh, "uData"), 0);
				gl.uniformMatrix4fv(at(mesh, "uVP"), false, f.vp);
				for (const [name, v] of Object.entries({
					uTime: f.time,
					uBeat: f.beat,
					uRate: f.rate,
					uRows: f.rows,
					uEnd: f.end,
					uAnchor: f.anchor,
					uDt: f.dt,
					uMeshRows: f.meshRows,
					uPast: f.past,
					uFuture: f.future,
					uWidth: f.halfWidth,
					uHeight: f.heightScale,
					uHill: f.hill,
					uHillAmp: f.hillAmp,
					uJag: f.jag,
					uLimit: f.limit,
					uPresence: f.presence,
					uHarmony: f.harmony,
					uFollows: f.follows,
					uSoundAt: f.soundAt,
					uQuiet: f.quiet,
					uLoud: f.loud,
					uFill: f.fill,
					uLight: f.light,
					uGlint: f.glint,
					uRowLines: f.rowLines,
					uLaneLines: f.laneLines,
					uContourLight: f.contourLight,
					uContours: f.contours,
					uLineW: f.lineWidth,
					uFogStart: f.fogStart,
					uLaneSpan: f.laneSpan,
					uRowDt: f.beat / 2,
					uBar: f.beat * 4,
					uBeat0: f.beat0,
					uMirrorAmt: f.mirror
				}))
					f1(mesh, name, v);
				gl.uniform1fv(at(mesh, "uLane"), f.lane);
				gl.uniform3fv(at(mesh, "uRamp"), f.ramp);
				gl.uniform3fv(at(mesh, "uLaneRgb"), f.laneRgb);
				// from above and a little behind "now"
				gl.uniform3f(at(mesh, "uLightDir"), -0.35, 0.8, -0.5);
				flag(mesh, "uLit", f.lit);
				flag(mesh, "uRowsOn", f.rowsOn);
				flag(mesh, "uLanesOn", f.lanesOn);
				flag(mesh, "uContoursOn", f.contoursOn);
				flag(mesh, "uNowOn", f.nowOn);
				const count = (f.meshRows - 1) * (COLUMNS - 1) * 6;

				// solid: the depth buffer sorts it; see-through: far rows were drawn first, so it is painted back to front
				if (f.fill >= 0.99) {
					gl.enable(gl.DEPTH_TEST);
					gl.depthFunc(gl.LEQUAL);
				}
				gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
				f1(mesh, "uPass", 0);
				f1(mesh, "uMirror", 1);
				gl.drawArrays(gl.TRIANGLES, 0, count);
				gl.disable(gl.DEPTH_TEST);

				// 8. its reflection: the lines only, upside down, added over the dark ground
				if (f.mirror > 0.01) {
					gl.blendFunc(gl.ONE, gl.ONE);
					f1(mesh, "uPass", 1);
					f1(mesh, "uMirror", -1);
					gl.drawArrays(gl.TRIANGLES, 0, count);
				}

				// 6. the dust
				if (f.dust > 0.004) {
					gl.useProgram(dust);
					gl.blendFunc(gl.ONE, gl.ONE);
					gl.uniformMatrix4fv(at(dust, "uVP"), false, f.vp);
					for (const [name, v] of Object.entries({ uTime: f.time, uBeat: f.beat, uWidth: f.halfWidth, uHeight: f.heightScale, uLimit: f.limit, uPast: f.past, uFuture: f.future, uPointSize: Math.max(2, f.lineWidth * 2.2), uLight: f.dust }))
						f1(dust, name, v);
					gl.uniform3f(at(dust, "uColour"), f.dustRgb[0], f.dustRgb[1], f.dustRgb[2]);
					gl.drawArrays(gl.POINTS, 0, DUST);
				}
			}
			gl.bindVertexArray(null);
		}
	};
}
