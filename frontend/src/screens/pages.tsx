import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { CameraCard } from "../components/CameraCard";
import { EditableGrid } from "../components/EditableGrid";
import { EntityPicker } from "../components/EntityPicker";
import { EntityIcon, HDIcon } from "../components/HDIcon";
import { HomeWidget, WIDGET_LABELS } from "../components/HomeWidget";
import { PageGaugeModal, PageStudioControls, PageWidgetPickerModal } from "../components/PageStudio";
import { SensorStyledCard } from "../components/SensorVisuals";
import type { TranslationKey } from "../i18n";
import { arrange, entityKey, getLayout, keyId, pageScreen, setHidden, showItem, type WidgetKey } from "../layout";
import { usePlan } from "../plan";
import { isSecurityEntity } from "../security";
import type { HomeSmartPageConfig, PageCustomGauge } from "../types/config";
import type { DiscoveredEntity } from "../types/discovery";
import type { HomeAssistant } from "../types/home-assistant";
import { entityIndex, type ScreenProps } from "./types";

// The dock's other screens (Media, Security, Scenes and custom pages) as content any layout can show:
// a title, a count and an editable set of devices drawn by the layout's own cards or rows.

export type CollectionPage = "scenes" | "media" | "security" | "cameras";

export type PageRef = { kind: "collection"; id: CollectionPage } | { kind: "custom"; page: HomeSmartPageConfig };

const PAGE_DOMAINS: Record<CollectionPage, string[]> = {
  scenes: ["scene"],
  media: ["media_player"],
  security: ["alarm_control_panel", "camera", "lock", "binary_sensor"],
  cameras: ["camera"],
};
const ADD_LABELS: Record<CollectionPage, TranslationKey> = { scenes: "addScenes", media: "addMedia", security: "addSecurity", cameras: "addCameras" };

/** The frame that gives a camera page its 16:9 cells, for the columns chosen. */
function cameraFrame(grid: ReactNode, columns: number) {
  return <div className="camera-page" style={{ "--cols-set": columns, "--cols-phone": Math.min(columns, 2) } as CSSProperties}>{grid}</div>;
}

function CameraColumns({ columns, onPick, t }: { columns: number; onPick: (value: number) => void; t: (key: TranslationKey) => string }) {
  return <div className="room-options__row"><span className="eyebrow">{t("cameraColumns")}</span><div className="room-options__icons" role="radiogroup" aria-label={t("cameraColumns")}>{[1, 2, 3, 4].map((value) => <button aria-checked={columns === value} key={value} onClick={() => onPick(value)} role="radio" type="button">{value}</button>)}</div></div>;
}

function formatGaugeState(hass: HomeAssistant, entityId: string): { formatted: string; numeric: number | null; unit: string } {
  const stateObj = hass.states[entityId];
  const raw = stateObj?.state ?? "";
  const numeric = Number.isFinite(Number.parseFloat(raw)) ? Number.parseFloat(raw) : null;
  const unit = typeof stateObj?.attributes?.unit_of_measurement === "string" ? stateObj.attributes.unit_of_measurement : "";
  const fn = (hass as unknown as { formatEntityState?: (s: typeof stateObj) => string }).formatEntityState;
  if (stateObj && typeof fn === "function") {
    try {
      return { formatted: fn.call(hass, stateObj), numeric, unit };
    } catch { /* fallback */ }
  }
  return { formatted: raw ? (unit ? `${raw} ${unit}` : raw) : "—", numeric, unit };
}

export interface PageBodyOptions {
  className: string;
  render: (entity: DiscoveredEntity) => ReactNode;
  /** Opens a device's details (camera pages draw their own cards in every layout). */
  open?: (entity: DiscoveredEntity) => void;
  /** Cards can be made double size (grids of cards, not rows or chips). */
  sizable?: boolean;
}

export interface PageContent {
  id: string;
  title: string;
  count: number;
  accent?: string;
  /** The devices (or the empty state) and the picker to add more. */
  body: (options: PageBodyOptions) => ReactNode;
  roomName: (entity: DiscoveredEntity) => string | undefined;
}

export function pageId(ref: PageRef): string {
  return ref.kind === "collection" ? ref.id : ref.page.id;
}

export function usePageContent(props: ScreenProps, ref: PageRef): PageContent {
  return ref.kind === "collection" ? useCollection(props, ref.id) : useCustomPage(props, ref.page);
}

function useCollection(props: ScreenProps, page: CollectionPage): PageContent {
  const { config, data, editing, hass, language, onConfig, onLayout, t } = props;
  const [picking, setPicking] = useState(false);
  const isCameras = page === "cameras";
  const columns = config.camera_columns ?? 2;
  const everywhere = useMemo(() => entityIndex(props.catalogRooms), [props.catalogRooms]);
  const plan = usePlan();
  const layout = getLayout(config, page);
  // Only entities of this screen's kind, both in the list and in the picker.
  const belongs = (entity: DiscoveredEntity) => PAGE_DOMAINS[page].includes(entity.domain) && (page !== "security" || entity.domain === "alarm_control_panel" || isSecurityEntity(entity, hass.states[entity.entity_id]));
  const native = entityIndex(data.rooms);
  const nativeIds = [...native.byId.values()].filter(belongs).map((entity) => entity.entity_id);
  const nativeSet = new Set(nativeIds);
  // Added from rooms that are not in the panel (or from no room at all).
  const added = (layout.added ?? []).filter((id) => !nativeSet.has(id) && everywhere.byId.has(id) && belongs(everywhere.byId.get(id)!));
  const { visible, hidden } = arrange([...nativeIds, ...added].map(entityKey), layout, true);
  const shown = visible.map(keyId);

  const withFrame = (grid: ReactNode) => isCameras ? cameraFrame(grid, columns) : grid;

  // In the picker a check means "on this screen": native items are hidden or shown, others added or removed.
  const toggle = (id: string) => {
    const key = entityKey(id);
    if (nativeSet.has(id)) onLayout(page, shown.includes(id) ? setHidden(layout, key, true) : showItem(layout, key, visible));
    else if (added.includes(id)) onLayout(page, { ...layout, added: added.filter((item) => item !== id) });
    else if (plan.allow(id)) onLayout(page, { ...setHidden(layout, key, false), added: [...added, id] });
  };

  return {
    id: page,
    title: page === "cameras" ? t("camerasTitle") : t(page),
    count: visible.length,
    roomName: everywhere.roomName,
    body: ({ className, open, render, sizable = false }) => <>
      {isCameras && editing && <section className="room-options" aria-label={t("cameraColumns")}><CameraColumns columns={columns} onPick={(camera_columns) => onConfig((current) => ({ ...current, camera_columns }))} t={t} /></section>}
      {visible.length === 0 && !editing
        ? <section className="empty-state"><p>{t("noVisibleEntities")}</p><button className="hd-pill" onClick={() => { props.onToggleEdit(); setPicking(true); }} type="button"><HDIcon name="plus" size={16} />{t(ADD_LABELS[page])}</button></section>
        : withFrame(<EditableGrid
            hass={props.hass}
            sections
            addLabel={t(ADD_LABELS[page])}
            cameraGrid={isCameras ? columns : undefined}
            className={isCameras ? "camera-grid" : className}
            editing={editing}
            hiddenItems={hidden.map((key) => ({ key, label: everywhere.byId.get(keyId(key))?.name ?? keyId(key) }))}
            items={visible.map((key) => {
              const entity = everywhere.byId.get(keyId(key))!;
              return { key, label: entity.name, removal: nativeSet.has(entity.entity_id) ? "hide" : "remove", node: isCameras && open ? <CameraCard entity={entity} hass={hass} onOpen={open} t={t} whole /> : render(entity) };
            })}
            layout={layout}
            onAdd={() => setPicking(true)}
            onLayout={(next) => onLayout(page, next)}
            onRemove={(key) => onLayout(page, { ...layout, added: added.filter((id) => id !== keyId(key)) })}
            sizable={sizable || isCameras}
            t={t}
          />)}
      {picking && <EntityPicker domains={PAGE_DOMAINS[page]} filter={belongs} language={language} onClose={() => setPicking(false)} onToggle={toggle} rooms={props.catalogRooms} selected={shown} t={t} title={t(ADD_LABELS[page])} />}
    </>,
  };
}

function useCustomPage(props: ScreenProps, page: HomeSmartPageConfig): PageContent {
  const { allRooms, config, editing, hass, language, onConfig, onLayout, onNavigate, t } = props;
  const [picking, setPicking] = useState(false);
  const [pickingWidgets, setPickingWidgets] = useState(false);
  const [gaugeModal, setGaugeModal] = useState<{ open: boolean; gauge?: PageCustomGauge }>({ open: false });

  const { byId, roomName } = useMemo(() => entityIndex(allRooms), [allRooms]);
  const screen = pageScreen(page.id);
  const layout = getLayout(config, screen);
  const isCameras = page.type === "cameras";
  const columns = page.columns ?? 2;

  const autoMatchedIds = useMemo(() => {
    const af = page.auto_filter;
    if (af && ((af.domains?.length ?? 0) > 0 || (af.device_classes?.length ?? 0) > 0)) {
      const domSet = new Set(af.domains ?? []);
      const dcSet = new Set(af.device_classes ?? []);
      return [...byId.values()]
        .filter((e) => domSet.has(e.domain) || (e.device_class != null && dcSet.has(e.device_class)))
        .map((e) => e.entity_id);
    }
    if ((page.type === "scenes" || isCameras) && page.entity_ids.length === 0) {
      return [...byId.values()]
        .filter((entity) => entity.domain === (isCameras ? "camera" : "scene"))
        .map((entity) => entity.entity_id);
    }
    return [];
  }, [byId, isCameras, page.auto_filter, page.entity_ids.length, page.type]);

  const explicitSet = new Set(page.entity_ids);
  const combinedEntityIds = [...new Set([...page.entity_ids.filter((id) => byId.has(id)), ...autoMatchedIds])];
  const widgetKeys = page.widgets ?? [];
  const gauges = page.custom_gauges ?? [];
  const gaugeById = new Map(gauges.map((g) => [`gauge:${g.id}`, g]));

  const allKeys = [
    ...widgetKeys,
    ...gauges.map((g) => `gauge:${g.id}`),
    ...combinedEntityIds.map(entityKey),
  ];

  const { visible, hidden } = arrange(allKeys, layout);
  const updatePage = (patch: Partial<HomeSmartPageConfig>) => {
    onConfig((current) => ({
      ...current,
      pages: current.pages.map((item) => (item.id === page.id ? { ...item, ...patch } : item)),
    }));
  };

  const handleDuplicate = () => {
    const newId = `page-${page.type}-${Date.now().toString(36)}`;
    const clone: HomeSmartPageConfig = {
      ...page,
      id: newId,
      title: `${page.title} (2)`.slice(0, 80),
      entity_ids: [...page.entity_ids],
      ...(page.widgets ? { widgets: [...page.widgets] } : {}),
      ...(page.custom_gauges ? { custom_gauges: page.custom_gauges.map((g) => ({ ...g })) } : {}),
      ...(page.auto_filter ? { auto_filter: { ...page.auto_filter } } : {}),
    };
    const oldLayout = config.layouts[screen];
    onConfig((current) => ({
      ...current,
      pages: [...current.pages, clone],
      ...(oldLayout ? { layouts: { ...current.layouts, [pageScreen(newId)]: { ...oldLayout } } } : {}),
    }));
    onNavigate?.(newId);
  };

  const handleDelete = () => {
    onConfig((current) => {
      const nextPages = current.pages.filter((item) => item.id !== page.id);
      const { [screen]: _removed, ...restLayouts } = current.layouts;
      return {
        ...current,
        pages: nextPages,
        layouts: restLayouts,
        navigation: {
          ...current.navigation,
          order: (current.navigation.order ?? []).filter((id) => id !== page.id),
        },
      };
    });
    onNavigate?.("home");
  };

  const framed = (grid: ReactNode) => {
    if (isCameras) return cameraFrame(grid, columns);
    if (page.columns) {
      return <div style={{ "--tab-cols": page.columns } as CSSProperties}>{grid}</div>;
    }
    return grid;
  };

  const toggleWidget = (widgetKey: string) => {
    const current = page.widgets ?? [];
    const next = current.includes(widgetKey) ? current.filter((w) => w !== widgetKey) : [...current, widgetKey];
    updatePage({ widgets: next });
  };

  const saveGauge = (gauge: PageCustomGauge) => {
    const current = page.custom_gauges ?? [];
    const exists = current.some((g) => g.id === gauge.id);
    const next = exists ? current.map((g) => (g.id === gauge.id ? gauge : g)) : [...current, gauge];
    updatePage({ custom_gauges: next });
    setGaugeModal({ open: false });
  };

  const deleteGauge = (gaugeId: string) => {
    updatePage({ custom_gauges: (page.custom_gauges ?? []).filter((g) => g.id !== gaugeId) });
    setGaugeModal({ open: false });
  };

  const itemLabel = (key: string): string => {
    if (key.startsWith("widget:")) return t(WIDGET_LABELS[key as WidgetKey] ?? "grid");
    if (key.startsWith("gauge:")) {
      const g = gaugeById.get(key);
      return g?.label || byId.get(g?.entity_id ?? "")?.name || g?.entity_id || key;
    }
    return byId.get(keyId(key))?.name ?? keyId(key);
  };

  const automaticOnly = autoMatchedIds.length > 0 && page.entity_ids.length === 0;

  return {
    id: page.id,
    title: page.title,
    count: visible.length,
    accent: page.accent,
    roomName,
    body: ({ className, open, render, sizable = false }) => {
      const gridClass = isCameras
        ? "camera-grid"
        : page.columns
          ? `${className} hs-custom-cols`
          : className;

      const extraAddTiles = !isCameras ? (
        <>
          <button className="hd-add-tile" onClick={() => setPickingWidgets(true)} type="button">
            <span><HDIcon name="layout" size={22} /></span>
            {t("tabAddWidget")}
          </button>
          <button className="hd-add-tile" onClick={() => setGaugeModal({ open: true })} type="button">
            <span><HDIcon name="sensor" size={22} /></span>
            {t("tabAddGauge")}
          </button>
        </>
      ) : undefined;

      return (
        <>
          {editing && (
            <PageStudioControls
              isCameras={isCameras}
              language={language}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onUpdatePage={updatePage}
              page={page}
              t={t}
            />
          )}
          {visible.length === 0 && !editing
            ? (
              <section className="empty-state">
                <button className="hd-pill" onClick={() => { props.onToggleEdit(); setPicking(true); }} type="button">
                  <HDIcon name="plus" size={16} />{t("addDevices")}
                </button>
              </section>
            )
            : framed(
              <EditableGrid
                addLabel={t("addDevices")}
                cameraGrid={isCameras ? columns : undefined}
                className={gridClass}
                editing={editing}
                extraAddTiles={extraAddTiles}
                hass={props.hass}
                hiddenItems={hidden.map((key) => ({ key, label: itemLabel(key) }))}
                items={visible.map((key) => {
                  if (key.startsWith("widget:")) {
                    const wk = key as WidgetKey;
                    return {
                      key,
                      label: itemLabel(key),
                      removal: "remove",
                      node: <HomeWidget config={config} data={props.data} hass={hass} kind={wk} language={language} onOpen={open ?? (() => undefined)} t={t} />,
                    };
                  }
                  if (key.startsWith("gauge:")) {
                    const g = gaugeById.get(key)!;
                    const entity = byId.get(g.entity_id);
                    const { formatted, numeric, unit } = formatGaugeState(hass, g.entity_id);
                    const lbl = g.label || entity?.name || (hass.states[g.entity_id]?.attributes?.friendly_name as string | undefined) || g.entity_id;
                    const dummyEntity: DiscoveredEntity = entity ?? {
                      entity_id: g.entity_id,
                      domain: g.entity_id.split(".")[0] || "sensor",
                      name: lbl,
                      area_id: "",
                      device_id: null,
                      device_class: null,
                      icon: null,
                    };
                    return {
                      key,
                      label: lbl,
                      removal: "remove",
                      node: (
                        <SensorStyledCard
                          color={g.color}
                          entityId={g.entity_id}
                          formattedValue={formatted}
                          hass={hass}
                          icon={<EntityIcon entity={dummyEntity} />}
                          label={lbl}
                          language={language}
                          max={g.max}
                          min={g.min}
                          onClick={() => { if (open) open(dummyEntity); }}
                          onConfigure={editing ? () => setGaugeModal({ open: true, gauge: g }) : undefined}
                          styleMode={g.style && g.style !== "default" ? g.style : "gauge"}
                          t={t}
                          unit={unit}
                          value={numeric}
                        />
                      ),
                    };
                  }
                  const entity = byId.get(keyId(key))!;
                  const isExplicit = explicitSet.has(entity.entity_id);
                  return {
                    key,
                    label: entity.name,
                    removal: isExplicit ? "remove" : "hide",
                    node: isCameras && open ? <CameraCard entity={entity} hass={hass} onOpen={open} t={t} whole /> : render(entity),
                  };
                })}
                layout={layout}
                onAdd={() => setPicking(true)}
                onLayout={(next) => onLayout(screen, next)}
                onRemove={(key) => {
                  if (key.startsWith("widget:")) {
                    updatePage({ widgets: (page.widgets ?? []).filter((w) => w !== key) });
                  } else if (key.startsWith("gauge:")) {
                    const gid = keyId(key);
                    updatePage({ custom_gauges: (page.custom_gauges ?? []).filter((g) => g.id !== gid) });
                  } else {
                    const eid = keyId(key);
                    if (explicitSet.has(eid)) {
                      updatePage({ entity_ids: page.entity_ids.filter((id) => id !== eid) });
                    } else {
                      onLayout(screen, setHidden(layout, key, true));
                    }
                  }
                }}
                sections
                sizable={sizable || isCameras}
                t={t}
                trayDevices={automaticOnly || autoMatchedIds.length > 0}
              />,
            )}
          {picking && (
            <EntityPicker
              domains={page.type === "scenes" ? ["scene"] : isCameras ? ["camera"] : undefined}
              language={language}
              onClose={() => setPicking(false)}
              onToggle={(id) => {
                if (page.entity_ids.includes(id)) updatePage({ entity_ids: page.entity_ids.filter((item) => item !== id) });
                else updatePage({ entity_ids: [...page.entity_ids, id] });
              }}
              rooms={props.catalogRooms}
              selected={page.entity_ids}
              t={t}
            />
          )}
          {pickingWidgets && (
            <PageWidgetPickerModal
              onClose={() => setPickingWidgets(false)}
              onToggle={toggleWidget}
              selected={page.widgets ?? []}
              t={t}
            />
          )}
          {gaugeModal.open && (
            <PageGaugeModal
              hass={hass}
              initial={gaugeModal.gauge}
              language={language}
              onClose={() => setGaugeModal({ open: false })}
              onDelete={gaugeModal.gauge ? () => deleteGauge(gaugeModal.gauge!.id) : undefined}
              onSave={saveGauge}
              rooms={props.catalogRooms}
              t={t}
            />
          )}
        </>
      );
    },
  };
}
