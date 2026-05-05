"use client";

import { HomeLandingColumn } from "@/app/components/home-landing-column";
import { HomeTimelineSection } from "@/app/components/home-timeline-section";
import { AppChrome } from "@/app/components/app-chrome";
import { buildHomeViewAbsoluteUrl } from "@/lib/home-view-url";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  parseRoleQueryParam,
  parseSessionIdQueryParam,
  parseSourceQueryParam,
  parseTimelineRangeParams,
} from "@/lib/timeline-query-params";
import type { AgentRoleKey, EventSource, RalphEventsApiPayload } from "ralph-workspace-sdk";

type ApiPayload = RalphEventsApiPayload;

export function HomeLoadingFallback() {
  return (
    <AppChrome active="home">
      <main className="mx-auto max-w-xl px-5 pb-24 pt-14 sm:max-w-lg sm:pt-20">
        <p className="text-center text-sm text-muted">불러오는 중…</p>
      </main>
    </AppChrome>
  );
}

export function HomePageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const roleFilter = useMemo(
    () => parseRoleQueryParam(searchParams.get("role")),
    [searchParams],
  );

  const sessionIdFilter = useMemo(
    () => parseSessionIdQueryParam(searchParams.get("sessionId")),
    [searchParams],
  );

  const rangeParsed = useMemo(
    () =>
      parseTimelineRangeParams(
        searchParams.get("from"),
        searchParams.get("to"),
      ),
    [searchParams],
  );

  const fromToFilter = rangeParsed.ok ? rangeParsed : null;
  const fromIsoCanon = rangeParsed.ok ? rangeParsed.fromIso : null;
  const toIsoCanon = rangeParsed.ok ? rangeParsed.toIso : null;

  const sourceFilter = useMemo(
    () => parseSourceQueryParam(searchParams.get("source")),
    [searchParams],
  );

  const currentViewUrl = useMemo(() => {
    if (typeof window === "undefined" || !window.location?.origin) return "";
    return buildHomeViewAbsoluteUrl(window.location.origin, pathname || "/", {
      role: roleFilter,
      sessionId: sessionIdFilter,
      fromIso: fromToFilter?.fromIso ?? null,
      toIso: fromToFilter?.toIso ?? null,
      source: sourceFilter,
    });
  }, [
    fromToFilter?.fromIso,
    fromToFilter?.toIso,
    pathname,
    roleFilter,
    sessionIdFilter,
    sourceFilter,
  ]);

  useEffect(() => {
    const raw = searchParams.get("role");
    if (raw === null) return;
    if (parseRoleQueryParam(raw) !== null) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("role");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const raw = searchParams.get("sessionId");
    if (raw === null) return;
    if (parseSessionIdQueryParam(raw) !== null) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("sessionId");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const f = searchParams.get("from");
    const t = searchParams.get("to");
    if (f === null && t === null) return;
    if (rangeParsed.ok) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("from");
    next.delete("to");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
  }, [pathname, rangeParsed.ok, router, searchParams]);

  useEffect(() => {
    if (!fromIsoCanon || !toIsoCanon) return;
    const f = searchParams.get("from")?.trim() ?? "";
    const t = searchParams.get("to")?.trim() ?? "";
    if (f === fromIsoCanon && t === toIsoCanon) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("from", fromIsoCanon);
    next.set("to", toIsoCanon);
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
  }, [fromIsoCanon, pathname, router, searchParams, toIsoCanon]);

  useEffect(() => {
    const raw = searchParams.get("source");
    if (raw === null) return;
    if (parseSourceQueryParam(raw) !== null) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("source");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
  }, [pathname, router, searchParams]);

  const setRoleQuery = useCallback(
    (role: AgentRoleKey | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (role == null) next.delete("role");
      else next.set("role", role);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setSessionIdQuery = useCallback(
    (sessionId: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      const trimmed = sessionId?.trim() ?? "";
      if (trimmed === "") next.delete("sessionId");
      else next.set("sessionId", trimmed);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setSourceQuery = useCallback(
    (source: EventSource | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (source == null) next.delete("source");
      else next.set("source", source);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [knownSessionIds, setKnownSessionIds] = useState<string[]>([]);
  const [sessionManual, setSessionManual] = useState("");
  const [fromDraft, setFromDraft] = useState("");
  const [toDraft, setToDraft] = useState("");
  const [copyDone, setCopyDone] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const applyFromToDraftToUrl = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    const f = fromDraft.trim();
    const t = toDraft.trim();
    if (!f || !t) {
      next.delete("from");
      next.delete("to");
    } else {
      next.set("from", f);
      next.set("to", t);
    }
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
  }, [fromDraft, pathname, router, searchParams, toDraft]);

  const clearFromToQuery = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("from");
    next.delete("to");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    setFromDraft(searchParams.get("from")?.trim() ?? "");
    setToDraft(searchParams.get("to")?.trim() ?? "");
  }, [searchParams]);

  const sessionSelectChoices = useMemo(() => {
    const s = new Set(knownSessionIds);
    if (sessionIdFilter) s.add(sessionIdFilter);
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [knownSessionIds, sessionIdFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ tail: "1200" });
      if (roleFilter) qs.set("role", roleFilter);
      if (sessionIdFilter) qs.set("sessionId", sessionIdFilter);
      if (fromToFilter) {
        qs.set("from", fromToFilter.fromIso);
        qs.set("to", fromToFilter.toIso);
      }
      if (sourceFilter) qs.set("source", sourceFilter);
      const r = await fetch(`/api/ralph/events?${qs.toString()}`);
      const j = (await r.json()) as ApiPayload;
      setData(j);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fromToFilter, roleFilter, sessionIdFilter, sourceFilter]);

  const copyCurrentViewUrl = useCallback(async () => {
    if (!currentViewUrl) return;
    try {
      await navigator.clipboard.writeText(currentViewUrl);
      setCopyDone(true);
      setCopyError(null);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setCopyDone(false);
      setCopyError("클립보드 접근이 막혀 URL을 직접 복사해야 합니다.");
    }
  }, [currentViewUrl]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 4000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (sessionIdFilter != null) return;
    if (!data?.events) return;
    const ids = new Set<string>();
    for (const e of data.events) {
      if (typeof e.sessionId === "string" && e.sessionId.trim() !== "") {
        ids.add(e.sessionId);
      }
    }
    setKnownSessionIds([...ids].sort((a, b) => a.localeCompare(b)));
  }, [data, sessionIdFilter]);

  const events = data?.events ?? [];
  const s = data?.summary;
  const timelineEmpty = data?.error === "TIMELINE_EMPTY";
  const headlineMetric =
    s?.rowCount != null && s.rowCount > 0
      ? `표시 중인 활동 ${s.rowCount.toLocaleString()}건`
      : "아직 표시된 활동이 없어요";

  return (
    <AppChrome active="home">
      <main className="mx-auto max-w-xl px-5 pb-24 pt-14 sm:max-w-lg sm:pt-20">
        <HomeLandingColumn
          data={data}
          events={events}
          timelineEmpty={timelineEmpty}
          sessionIdFilter={sessionIdFilter}
          headlineMetric={headlineMetric}
          summary={s}
          loading={loading}
          onReload={load}
        />

        <HomeTimelineSection
          data={data}
          events={events}
          loading={loading}
          copyDone={copyDone}
          copyError={copyError}
          currentViewUrl={currentViewUrl}
          onCopyViewUrl={copyCurrentViewUrl}
          sessionIdFilter={sessionIdFilter}
          roleFilter={roleFilter}
          sourceFilter={sourceFilter}
          sessionSelectChoices={sessionSelectChoices}
          sessionManual={sessionManual}
          setSessionManual={setSessionManual}
          setSessionIdQuery={setSessionIdQuery}
          setRoleQuery={setRoleQuery}
          setSourceQuery={setSourceQuery}
          fromDraft={fromDraft}
          toDraft={toDraft}
          setFromDraft={setFromDraft}
          setToDraft={setToDraft}
          applyFromToDraftToUrl={applyFromToDraftToUrl}
          clearFromToQuery={clearFromToQuery}
        />
      </main>
    </AppChrome>
  );
}
