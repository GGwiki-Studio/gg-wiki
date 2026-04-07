import type { StratSlideData } from '@/components/strat-viewer/strat.types'
import type { BuilderObject } from '@/components/builder/builder.types'

export function generateStratHtml(title: string, slideData: StratSlideData): string {
  const { slide, tags } = slideData
  const objectsJson = JSON.stringify(slide.objects)
  const tagsJson = JSON.stringify(tags)
  const bgUrl = slide.backgroundImage || ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} — GGWiki Strat</title>
<script src="https://unpkg.com/konva@9/konva.min.js"><\/script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0e0e0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; padding: 20px; min-height: 100vh; }
.wrapper { width: 100%; max-width: 1200px; }
.header { margin-bottom: 12px; }
.header h1 { font-size: 18px; font-weight: 500; color: #eee; }
.header p { font-size: 12px; color: #555; margin-top: 2px; }
.viewer { position: relative; background: #141414; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; }
#canvas-container { width: 100%; background: #111; }
.bottom-bar { display: flex; justify-content: space-between; padding: 6px 12px; border-top: 1px solid #2a2a2a; }
.bottom-bar span { font-size: 10px; color: #555; }

.filter-btn { position: absolute; top: 10px; left: 10px; z-index: 10; background: rgba(20,20,20,0.85); border: 1px solid #3a3a3a; border-radius: 6px; padding: 5px 10px; font-size: 11px; color: #aaa; cursor: pointer; display: flex; align-items: center; gap: 5px; }
.filter-btn.active { border-color: #534AB7; color: #CECBF6; }
.filter-badge { background: #534AB7; color: #fff; font-size: 9px; padding: 1px 5px; border-radius: 99px; }
.filter-dropdown { display: none; position: absolute; top: 38px; left: 10px; z-index: 10; width: 190px; background: rgba(22,22,22,0.95); border: 1px solid #2a2a2a; border-radius: 8px; padding: 6px 0; max-height: 200px; overflow-y: auto; }
.filter-dropdown.open { display: block; }
.filter-dropdown::-webkit-scrollbar { width: 3px; }
.filter-dropdown::-webkit-scrollbar-track { background: transparent; }
.filter-dropdown::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
.filter-item { display: flex; align-items: center; gap: 8px; padding: 6px 12px; cursor: pointer; width: 100%; border: none; background: none; }
.filter-item:hover { background: #1e1e1e; }
.filter-check { width: 14px; height: 14px; border-radius: 3px; border: 1px solid #444; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.filter-check.active { border-color: currentColor; background: currentColor; }
.filter-label { font-size: 12px; color: #888; }
.filter-label.active { color: #eee; }
.clear-btn { width: 100%; padding: 4px 12px; border: none; background: none; text-align: left; font-size: 11px; color: #666; cursor: pointer; margin-bottom: 4px; }
.clear-btn:hover { color: #aaa; }

.tooltip { display: none; position: absolute; z-index: 20; min-width: 180px; max-width: 260px; background: rgba(22,22,22,0.95); border: 1px solid #2a2a2a; border-radius: 10px; padding: 10px 14px; pointer-events: auto; }
.tooltip.show { display: block; }
.tooltip-label { font-size: 13px; font-weight: 500; color: #eee; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tooltip-desc { font-size: 11px; color: #777; margin: 4px 0 6px; line-height: 1.5; max-height: 80px; overflow-y: auto; word-break: break-word; }
.tooltip-desc::-webkit-scrollbar { width: 3px; }
.tooltip-desc::-webkit-scrollbar-track { background: transparent; }
.tooltip-desc::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
.tooltip-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.tooltip-tag { font-size: 10px; padding: 2px 8px; border-radius: 99px; }

.footer { margin-top: 12px; text-align: center; font-size: 10px; color: #333; }
</style>
</head>
<body>

<div class="wrapper">
  <div class="header">
    <h1>${escapeHtml(title)}</h1>
    <p>Exported from GGWiki</p>
  </div>

  <div class="viewer" id="viewer">
    <button class="filter-btn" id="filterBtn" onclick="toggleFilter()">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
      Filter tags
      <span class="filter-badge" id="filterBadge" style="display:none">0</span>
    </button>
    <div class="filter-dropdown" id="filterDropdown"></div>
    <div id="canvas-container"></div>
    <div class="tooltip" id="tooltip">
      <div class="tooltip-label" id="tipLabel"></div>
      <div class="tooltip-desc" id="tipDesc"></div>
      <div class="tooltip-tags" id="tipTags"></div>
    </div>
    <div class="bottom-bar">
      <span>Hover objects to inspect</span>
      <span id="objectCount"></span>
    </div>
  </div>

  <div class="footer">GGWiki &mdash; Interactive strategy viewer</div>
</div>

<script>
const STAGE_W = 1100, STAGE_H = 700;
const objects = ${objectsJson};
const tags = ${tagsJson};
const bgUrl = "${bgUrl}";

let activeTagIds = [];
let hideTimeout = null;
let stage, layer;

function init() {
  const container = document.getElementById('canvas-container');
  const w = container.clientWidth;
  const scale = w / STAGE_W;

  stage = new Konva.Stage({ container: 'canvas-container', width: w, height: STAGE_H * scale, scaleX: scale, scaleY: scale });
  layer = new Konva.Layer();
  stage.add(layer);

  if (bgUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      layer.add(new Konva.Image({ image: img, x: 0, y: 0, width: STAGE_W, height: STAGE_H, listening: false }));
      layer.moveToBottom();
      addObjects();
    };
    img.src = bgUrl;
  } else {
    addObjects();
  }

  buildFilterDropdown();
  updateCount();

  window.addEventListener('resize', () => {
    const nw = container.clientWidth;
    const ns = nw / STAGE_W;
    stage.width(nw);
    stage.height(STAGE_H * ns);
    stage.scaleX(ns);
    stage.scaleY(ns);
    stage.batchDraw();
  });

  document.addEventListener('mousedown', (e) => {
    const dd = document.getElementById('filterDropdown');
    const btn = document.getElementById('filterBtn');
    if (!dd.contains(e.target) && !btn.contains(e.target)) dd.classList.remove('open');
  });
}

function addObjects() {
  const sorted = [...objects].sort((a, b) => a.canvas.zIndex - b.canvas.zIndex);
  sorted.forEach((obj) => {
    if (!obj.canvas.visible) return;
    const node = createNode(obj);
    if (!node) return;
    node._objData = obj;
    node.on('mouseenter', () => onHover(obj, node));
    node.on('mouseleave', onLeave);
    layer.add(node);
  });
  layer.batchDraw();
}

function createNode(obj) {
  const c = obj.canvas;
  const s = obj.style || {};
  const base = { x: c.x, y: c.y, rotation: c.rotation, opacity: c.opacity, draggable: false };

  switch (obj.type) {
    case 'rectangle':
      return new Konva.Rect({ ...base, width: c.width, height: c.height, fill: s.fill, stroke: s.stroke, strokeWidth: s.strokeWidth, cornerRadius: obj.cornerRadius || 0, perfectDrawEnabled: false });
    case 'ellipse':
      return new Konva.Ellipse({ ...base, radiusX: c.width / 2, radiusY: c.height / 2, offsetX: -c.width / 2, offsetY: -c.height / 2, fill: s.fill, stroke: s.stroke, strokeWidth: s.strokeWidth, perfectDrawEnabled: false });
    case 'text':
      return new Konva.Text({ ...base, text: obj.text, width: c.width, height: c.height, fontSize: obj.fontSize, fontFamily: obj.fontFamily, align: obj.align, fill: s.fill });
    case 'arrow':
      return new Konva.Arrow({ ...base, points: [0, c.height / 2, c.width, c.height / 2], pointerLength: obj.pointerLength, pointerWidth: obj.pointerWidth, stroke: s.stroke, fill: s.fill, strokeWidth: s.strokeWidth, hitStrokeWidth: 24, perfectDrawEnabled: false });
    case 'line':
      return new Konva.Line({ ...base, points: [0, c.height / 2, c.width, c.height / 2], stroke: s.stroke, strokeWidth: s.strokeWidth, hitStrokeWidth: 24, perfectDrawEnabled: false });
    case 'image':
    case 'icon': {
      const group = new Konva.Group({ ...base, width: c.width, height: c.height });
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        group.add(new Konva.Image({ image: img, width: c.width, height: c.height }));
        layer.batchDraw();
      };
      img.src = obj.src;
      return group;
    }
    default: return null;
  }
}

function onHover(obj, node) {
  if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
  node.shadowEnabled(true);
  node.shadowColor('#fff');
  node.shadowBlur(10);
  layer.batchDraw();

  const tip = document.getElementById('tooltip');
  const label = obj.metadata.label.trim();
  const desc = obj.metadata.description.trim();
  const objTags = tags.filter(t => obj.metadata.tagIds.includes(t.id));
  if (!label && !desc && objTags.length === 0) return;

  document.getElementById('tipLabel').textContent = label;
  document.getElementById('tipLabel').style.display = label ? 'block' : 'none';
  document.getElementById('tipDesc').textContent = desc;
  document.getElementById('tipDesc').style.display = desc ? 'block' : 'none';
  document.getElementById('tipTags').innerHTML = objTags.map(t =>
    '<span class="tooltip-tag" style="background:' + t.color + '33;color:' + t.color + '">' + esc(t.name) + '</span>'
  ).join('');

  const pos = stage.getPointerPosition();
  const viewer = document.getElementById('viewer').getBoundingClientRect();
  let tx = pos.x + 12, ty = pos.y - 10;
  tip.classList.add('show');
  const tr = tip.getBoundingClientRect();
  if (tx + tr.width > viewer.width) tx = pos.x - tr.width - 12;
  if (ty + tr.height > viewer.height) ty = viewer.height - tr.height - 8;
  if (ty < 8) ty = 8;
  if (tx < 8) tx = 8;
  tip.style.left = tx + 'px';
  tip.style.top = ty + 'px';
}

function onLeave() {
  hideTimeout = setTimeout(() => {
    document.getElementById('tooltip').classList.remove('show');
    layer.children.forEach(n => { if (n.shadowEnabled) { n.shadowEnabled(false); } });
    layer.batchDraw();
  }, 150);
}

document.getElementById('tooltip').addEventListener('mouseenter', () => {
  if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
});
document.getElementById('tooltip').addEventListener('mouseleave', onLeave);

function toggleFilter() {
  document.getElementById('filterDropdown').classList.toggle('open');
}

function buildFilterDropdown() {
  const dd = document.getElementById('filterDropdown');
  if (tags.length === 0) { document.getElementById('filterBtn').style.display = 'none'; return; }
  renderFilterItems();
}

function renderFilterItems() {
  const dd = document.getElementById('filterDropdown');
  let html = '';
  if (activeTagIds.length > 0) {
    html += '<button class="clear-btn" onclick="clearFilters()">Clear filters</button>';
  }
  tags.forEach(t => {
    const active = activeTagIds.includes(t.id);
    html += '<button class="filter-item" onclick="toggleTag(\\'' + t.id + '\\')">';
    html += '<div class="filter-check' + (active ? ' active' : '') + '" style="' + (active ? 'border-color:' + t.color + ';background:' + t.color : '') + '">';
    if (active) html += '<svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" stroke-width="2.5"><polyline points="2,6 5,9 10,3"/></svg>';
    html += '</div>';
    html += '<span class="filter-label' + (active ? ' active' : '') + '">' + esc(t.name) + '</span>';
    html += '</button>';
  });
  dd.innerHTML = html;

  const btn = document.getElementById('filterBtn');
  const badge = document.getElementById('filterBadge');
  if (activeTagIds.length > 0) {
    btn.classList.add('active');
    badge.style.display = 'inline';
    badge.textContent = activeTagIds.length;
  } else {
    btn.classList.remove('active');
    badge.style.display = 'none';
  }
}

function toggleTag(id) {
  if (activeTagIds.includes(id)) activeTagIds = activeTagIds.filter(i => i !== id);
  else activeTagIds.push(id);
  applyFilter();
  renderFilterItems();
}

function clearFilters() {
  activeTagIds = [];
  applyFilter();
  renderFilterItems();
}

function applyFilter() {
  layer.children.forEach(node => {
    if (!node._objData) return;
    const obj = node._objData;
    if (activeTagIds.length === 0) { node.opacity(obj.canvas.opacity); node.listening(true); return; }
    const match = obj.metadata.tagIds.some(id => activeTagIds.includes(id));
    node.opacity(match ? obj.canvas.opacity : 0.15);
    node.listening(match);
  });
  layer.batchDraw();
  updateCount();
}

function updateCount() {
  const total = objects.length;
  const visible = activeTagIds.length > 0
    ? objects.filter(o => o.metadata.tagIds.some(id => activeTagIds.includes(id))).length
    : total;
  const tagText = tags.length > 0 ? ' \\u00b7 ' + tags.length + ' tags' : '';
  document.getElementById('objectCount').textContent =
    (activeTagIds.length > 0 ? visible + ' of ' + total + ' objects' : total + ' objects') + tagText;
}

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

window.addEventListener('DOMContentLoaded', init);
<\/script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}