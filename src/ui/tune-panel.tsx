import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FRAME_RATES, frameRate, setFrameRate } from "../frame-rate";
import { t, tr } from "./text";
import { Knob, movedText, resetKnobs, setKnob, tuningOf } from "../presets/tune";
import { ColourSection, LyricsSection, PictureSection } from "./colour-panel";
import { IconButton, ICON_CLOSE, ICON_COPY, ICON_RESET } from "./icons";
import { columnSpans, labelIsWide, RangeControl } from "./range-control";

type Tab = "preset" | "colour" | "picture" | "lyrics";
const TABS: Tab[] = ["preset", "colour", "picture", "lyrics"];

// The knobs panel (T), in tabs. Preset: the preset on screen's numbers as sliders, double-click a name
// to reset it, "Copy" puts the moved values on the clipboard, to become the new defaults in tune(...).
export function TunePanel({ presetId, onClose }: { presetId: string; onClose: () => void }) {
	const [, redraw] = useState(0);
	// drawn beside the panel, where its scrolling cannot cut it off
	const [hint, setHint] = useState<{ text: string; foot: string; top: number; right: number } | null>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const hintRef = useRef<HTMLDivElement>(null);
	// our own hairline scrollbar: Spotify's client-wide scrollbar style wins over the panel's
	const [bar, setBar] = useState<{ top: number; height: number; right: number } | null>(null);
	const measureBar = () => {
		const p = panelRef.current;
		const parent = p?.offsetParent;
		if (!p || !parent || p.scrollHeight <= p.clientHeight + 1) return setBar(b => (b ? null : b));
		const box = parent.getBoundingClientRect();
		const r = p.getBoundingClientRect();
		const height = Math.max(24, (p.clientHeight / p.scrollHeight) * (r.height - 16));
		const top = r.top - box.top + 8 + (p.scrollTop / (p.scrollHeight - p.clientHeight)) * (r.height - 16 - height);
		const right = box.right - r.right + 3;
		setBar(b => (b && Math.abs(b.top - top) < 0.5 && Math.abs(b.height - height) < 0.5 && b.right === right ? b : { top, height, right }));
	};
	useLayoutEffect(measureBar);
	// a hint beside one of the lowest rows would run past the window's edge
	useLayoutEffect(() => {
		const el = hintRef.current;
		const parent = el?.offsetParent;
		if (!hint || !el || !parent) return;
		const top = Math.max(8, Math.min(hint.top, parent.clientHeight - el.offsetHeight - 12));
		if (top < hint.top) setHint({ ...hint, top });
	}, [hint]);
	useEffect(() => {
		window.addEventListener("resize", measureBar);
		return () => window.removeEventListener("resize", measureBar);
	}, []);
	// which groups are open. A group with a basic knob starts open; the rest start closed. Remembered per preset.
	const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
	const groupKey = (name: string) => `${presetId}:${name}`;
	const groupIsOpen = (name: string, hasBasic: boolean) => {
		const known = openGroups[groupKey(name)];
		if (known !== undefined) return known;
		try {
			const stored = localStorage.getItem(`vivy:group:${groupKey(name)}`);
			if (stored === "0" || stored === "1") return stored === "1";
		} catch {
			// storage denied: the default stands
		}
		return hasBasic;
	};
	const toggleGroup = (name: string, hasBasic: boolean) => {
		const next = !groupIsOpen(name, hasBasic);
		setHint(null);
		setOpenGroups(g => ({ ...g, [groupKey(name)]: next }));
		try {
			localStorage.setItem(`vivy:group:${groupKey(name)}`, next ? "1" : "0");
		} catch {
			// storage denied: it returns to the default next time
		}
	};
	const [tab, setTab] = useState<Tab>(() => {
		try {
			const stored = localStorage.getItem("vivy:tab");
			return TABS.some(id => id === stored) ? (stored as Tab) : "preset";
		} catch {
			return "preset";
		}
	});
	const chooseTab = (id: Tab) => {
		setHint(null);
		setTab(id);
		try {
			localStorage.setItem("vivy:tab", id);
		} catch {
			// opens on the first tab next time
		}
	};
	const tuning = tuningOf(presetId);
	const refresh = () => redraw(n => n + 1);
	// a feature flipped with its number key (the preset's own listener runs first)
	useEffect(() => {
		window.addEventListener("visualizer-feature", refresh);
		return () => window.removeEventListener("visualizer-feature", refresh);
	}, []);
	const copy = () => {
		const text = movedText(presetId);
		navigator.clipboard?.writeText(text || "nothing moved").catch(() => {});
		Spicetify.showNotification(t(text ? "panel.copied" : "panel.nothingMoved"));
	};
	const explain = (text: string, foot: string, row: HTMLElement) => {
		const panel = panelRef.current;
		const parent = panel?.offsetParent;
		if (!text || !panel || !parent) return;
		const p = parent.getBoundingClientRect();
		setHint({ text, foot, top: row.getBoundingClientRect().top - p.top, right: p.right - panel.getBoundingClientRect().left + 10 });
	};
	const showHint = (knob: Knob, row: HTMLElement) =>
		explain(knob.hint && tr(`${presetId}.${knob.key}.hint`, knob.hint), t("panel.knobFoot", { value: +knob.def.toPrecision(3) }), row);
	const knobControl = (k: Knob, span: 1 | 2) => {
		const value = tuning!.values[k.key];
		const range = k.max - k.min;
		return (
			<RangeControl
				key={k.key}
				label={tr(`${presetId}.${k.key}`, k.label)}
				value={value}
				min={k.min}
				max={k.max}
				step={k.key === "POINTS" ? 12 : range / 400}
				coarse={k.key === "POINTS" ? 12 : range / 40}
				def={k.def}
				display={k.key === "POINTS" ? String(+value) : String(+value.toPrecision(3))}
				span={span}
				onChange={n => (setKnob(presetId, k.key, n), refresh())}
				onEnter={row => showHint(k, row)}
				onLeave={() => setHint(null)}
			/>
		);
	};
	const groupSection = (name: string, title: string, hasBasic: boolean, children: React.ReactNode) => {
		const open = groupIsOpen(name, hasBasic);
		return (
			<section key={name} className="vivy-tune-group">
				<button type="button" className="vivy-tune-group-title" aria-expanded={open} onClick={() => toggleGroup(name, hasBasic)}>
					<span>{title}</span>
					<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M6 9l6 6 6-6" />
					</svg>
				</button>
				{open ? <div className="vivy-tune-group-body">{children}</div> : null}
			</section>
		);
	};
	const presetGroups = () => {
		if (!tuning) return null;
		const order: string[] = [];
		const buckets = new Map<string, Knob[]>();
		for (const k of tuning.knobs) {
			const name = k.group || "general";
			if (!buckets.has(name)) {
				order.push(name);
				buckets.set(name, []);
			}
			buckets.get(name)!.push(k);
		}
		const sections = order.map(name => {
			const list = buckets.get(name)!;
			const labels = list.map(k => tr(`${presetId}.${k.key}`, k.label));
			const spans = columnSpans(labels.map(labelIsWide));
			return groupSection(
				name,
				tr(`group.${name}`, name),
				list.some(k => k.basic),
				list.map((k, i) => knobControl(k, spans[i] as 1 | 2))
			);
		});
		if (tuning.features.length > 0) {
			const labels = tuning.features.map((f, i) => `${i < 9 ? `${i + 1}. ` : ""}${tr(`${presetId}.${i + 1}`, f.name)}`);
			const spans = columnSpans(labels.map(labelIsWide));
			sections.push(
				groupSection(
					"effects",
					t("panel.effects"),
					false,
					tuning.features.map((f, i) => (
						<label key={f.name} className={`vivy-tune-feature${spans[i] === 2 ? " vivy-span-2" : ""}`}>
							<input type="checkbox" checked={f.on} onChange={() => ((f.on = !f.on), refresh())} />
							{labels[i]}
						</label>
					))
				)
			);
		}
		return sections;
	};
	return (
		<>
			<div className="vivy-tune" ref={panelRef} onMouseDown={e => e.stopPropagation()} onScroll={() => (setHint(null), measureBar())}>
				<div className="vivy-tune-head">
					<div className="vivy-tune-title">
						<b>{t("panel.title")}</b>
						{tab === "preset" ? (
							<>
								<IconButton small label={t("panel.copy")} icon={ICON_COPY} onClick={copy} />
								<IconButton small label={t("panel.reset")} icon={ICON_RESET} onClick={() => (resetKnobs(presetId), refresh())} />
							</>
						) : null}
						<IconButton small label={t("panel.close")} icon={ICON_CLOSE} onClick={onClose} />
					</div>
					<div className="vivy-seg vivy-tabs" role="tablist">
						{TABS.map(id => (
							<button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => chooseTab(id)}>
								{t(`tab.${id}`)}
							</button>
						))}
					</div>
				</div>
				{tab === "preset" ? (
					!tuning || (tuning.knobs.length === 0 && tuning.features.length === 0) ? (
						<div className="vivy-tune-none">{t("panel.noKnobs")}</div>
					) : (
						presetGroups()
					)
				) : null}
				{tab === "colour" ? (
					<ColourSection key={presetId} presetId={presetId} panel={panelRef} explain={(text, row) => explain(text, "", row)} unexplain={() => setHint(null)} />
				) : null}
				{tab === "picture" ? (
					<>
						<PictureSection explain={(text, row) => explain(text, "", row)} unexplain={() => setHint(null)} />
						<div className="vivy-tune-sub">{t("fps.title")}</div>
						<div className="vivy-seg">
							{FRAME_RATES.map(fps => (
								<button
									key={fps}
									className={frameRate() === fps ? "on" : ""}
									onMouseEnter={e => explain(t("fps.hint"), t("fps.foot"), e.currentTarget)}
									onMouseLeave={() => setHint(null)}
									onClick={() => (setFrameRate(fps), refresh())}
								>
									{fps || t("fps.monitor")}
								</button>
							))}
						</div>
					</>
				) : null}
				{tab === "lyrics" ? <LyricsSection explain={(text, row) => explain(text, "", row)} unexplain={() => setHint(null)} /> : null}
			</div>
			{bar ? <div className="vivy-tune-bar" style={{ top: bar.top, height: bar.height, right: bar.right }} /> : null}
			{hint ? (
				<div className="vivy-tune-hint" ref={hintRef} style={{ top: hint.top, right: hint.right }}>
					<div>{hint.text}</div>
					{hint.foot ? <small>{hint.foot}</small> : null}
				</div>
			) : null}
		</>
	);
}
