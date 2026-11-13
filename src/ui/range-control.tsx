import React, { CSSProperties, useEffect, useRef } from "react";

// A label is wide enough that its slider needs the whole row, not half of one.
const WIDE_AT = 32 - 4;
// @why - 32 is the label width, 4 is the longest value length
// @example - LABEL:[this should fit okay buuut if] VALUE:[2.36]
// @note - the label is 29 chars, which is fine, but the value is 4 chars, which reults in a total of 33 chars, which is too wide for `WIDE_AT=32`

// @what - how many columns each control takes, then which of those must grow so no cell is left empty
// @why - a two-column control cannot start in the second cell, and a group must not end on a single cell
export function columnSpans(wide: boolean[]): number[] {
	const span = wide.map(w => (w ? 2 : 1));
	let col = 0;
	for (let i = 0; i < span.length; i++) {
		if (col + span[i] > 2) {
			span[i - 1] = 2;
			col = 0;
		}
		col += span[i];
		if (col === 2) col = 0;
	}
	if (col === 1) span[span.length - 1] = 2;
	return span;
}

export const labelIsWide = (label: string) => label.length >= WIDE_AT;

// One slider: a thick track filled up to the thumb, and a square beside it.
// The square's two halves step the value, and the wheel over the square does the same,
// so the value can move without dragging.
export function RangeControl({
	label,
	value,
	min,
	max,
	step,
	coarse,
	def,
	display,
	span = 1,
	onChange,
	onEnter,
	onLeave
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	coarse: number;
	def?: number;
	display: string;
	span?: 1 | 2;
	onChange: (value: number) => void;
	onEnter?: (row: HTMLElement) => void;
	onLeave?: () => void;
}) {
	const moved = def !== undefined && value !== def;
	const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
	const stepRef = useRef<HTMLDivElement>(null);
	const clamp = (n: number) => Math.min(max, Math.max(min, n));
	const nudge = (dir: number) => onChange(clamp(value + dir * coarse));
	// @why - the panel scrolls on the wheel. A passive listener cannot cancel that, so this one is not passive.
	useEffect(() => {
		const el = stepRef.current;
		if (!el) return;
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			e.stopPropagation();
			onChange(clamp(value + (e.deltaY < 0 ? 1 : -1) * coarse));
		};
		el.addEventListener("wheel", onWheel, { passive: false });
		return () => el.removeEventListener("wheel", onWheel);
	}, [value, min, max, coarse, onChange]);
	const icon = (name: "chart-up" | "chart-down") => {
		// @why - the Spicetify.SVGicons are JUST the path strings, so we need to wrap them in an SVG element to make them displayable
		let iconWrapped = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">`;
		if (typeof Spicetify !== "undefined") {
			iconWrapped += Spicetify.SVGIcons[name];
			iconWrapped += `</svg>`;
			return iconWrapped;
		}
		// @note - in case the icons can't be found, use unicode arrows instead
		return (name === "chart-up" ? "∧" : "∨");
	};
	return (
		<div
			className={`vivy-tune-knob${moved ? " moved" : ""}${span === 2 ? " vivy-span-2" : ""}`}
			onMouseEnter={e => onEnter?.(e.currentTarget)}
			onMouseLeave={() => onLeave?.()}
			onFocus={e => onEnter?.(e.currentTarget)}
			onBlur={() => onLeave?.()}
		>
			<div className="vivy-tune-label" onDoubleClick={() => def !== undefined && onChange(def)}>
				<span>{label}</span>
				<span>{display}</span>
			</div>
			<div className="vivy-tune-row">
				<input
					type="range"
					min={min}
					max={max}
					step={step}
					value={value}
					style={{ "--fill": `${pct}%` } as CSSProperties}
					onChange={e => onChange(Number(e.target.value))}
				/>
				<div className="vivy-tune-step" ref={stepRef}>
					<button type="button" aria-label={`${label} up`} dangerouslySetInnerHTML={{ __html: icon("chart-up") }} onClick={() => nudge(1)} />
					<button type="button" aria-label={`${label} down`} dangerouslySetInnerHTML={{ __html: icon("chart-down") }} onClick={() => nudge(-1)} />
				</div>
			</div>
		</div>
	);
}
