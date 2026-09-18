import { moveInstrumentation } from "../../scripts/aem";
const MOBILE_QUERY = window.matchMedia("(max-width: 768px)");
function parseTabItem(row) {
  const children = Array.from(row.children);
  const [headingDiv, iconDiv, bodyDiv, videoDiv] = children;
  return { row, headingDiv, iconDiv, bodyDiv, videoDiv };
}
function buildVideoEmbed(videoDiv) {
  const link = videoDiv?.querySelector("a");
  const src = link?.href ?? videoDiv?.textContent?.trim();
  if (!src) return null;
  const wrapper = document.createElement("div");
  wrapper.className = "tabs-video";
  wrapper.dataset.videoSrc = src;
  return wrapper;
}
function lazyLoadVideo(videoWrapper) {
  if (!videoWrapper || videoWrapper.dataset.loaded) return;
  const src = videoWrapper.dataset.videoSrc;
  if (!src) return;
  const isDirectFile = /\.(mp4|webm|ogg)$/i.test(src);
  let el;
  if (isDirectFile) {
    const video = document.createElement("video");
    video.src = src;
    video.controls = true;
    video.preload = "metadata";
    el = video;
  } else {
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.loading = "lazy";
    iframe.allow = "accelerometer; autoplay; encrypted-media; picture-in-picture";
    iframe.title = "Embedded video";
    el = iframe;
  }
  videoWrapper.append(el);
  videoWrapper.dataset.loaded = "true";
}
function unloadVideo(videoWrapper) {
  if (!videoWrapper || !videoWrapper.dataset.loaded) return;
  const media = videoWrapper.querySelector("video, iframe");
  if (media instanceof HTMLVideoElement) media.pause();
  if (media instanceof HTMLIFrameElement) {
    media.src = media.src;
  }
}
function activateTab(block, targetId) {
  block.querySelectorAll('[role="tab"]').forEach((btn) => {
    const selected = btn.dataset.targetId === targetId;
    btn.setAttribute("aria-selected", String(selected));
    btn.tabIndex = selected ? 0 : -1;
  });
  block.querySelectorAll('[role="tabpanel"]').forEach((panel) => {
    const isTarget = panel.id === targetId;
    panel.hidden = !isTarget;
    const video = panel.querySelector(".tabs-video");
    if (isTarget) lazyLoadVideo(video);
    else unloadVideo(video);
  });
}
function toggleAccordionPanel(trigger) {
  const panel = document.getElementById(trigger.dataset.targetId ?? "");
  if (!panel) return;
  const expanded = trigger.getAttribute("aria-expanded") === "true";
  trigger.setAttribute("aria-expanded", String(!expanded));
  panel.hidden = expanded;
  const video = panel.querySelector(".tabs-video");
  if (!expanded) lazyLoadVideo(video);
  else unloadVideo(video);
}
function wireKeyboardNav(tablist) {
  tablist.addEventListener("keydown", (e) => {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex === -1) return;
    let nextIndex = null;
    if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (e.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") nextIndex = 0;
    if (e.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex !== null) {
      e.preventDefault();
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    }
  });
}
function applyLayoutMode(block, isMobile) {
  const tablist = block.querySelector(".tabs-list");
  const panelsWrapper = block.querySelector(".tabs-panels");
  const triggers = Array.from(block.querySelectorAll(".tabs-trigger"));
  if (!tablist || !panelsWrapper) return;
  if (isMobile) {
    triggers.forEach((btn) => {
      const panel = document.getElementById(btn.dataset.targetId ?? "");
      if (!panel) return;
      const expanded = btn.getAttribute("aria-selected") === "true";
      btn.removeAttribute("role");
      btn.setAttribute("aria-expanded", String(expanded));
      btn.removeAttribute("aria-selected");
      btn.tabIndex = 0;
      panel.hidden = !expanded;
      panel.removeAttribute("role");
      btn.insertAdjacentElement("afterend", panel);
    });
    block.classList.add("tabs-accordion-mode");
  } else {
    block.classList.remove("tabs-accordion-mode");
    const wasExpanded = triggers.find((btn) => btn.getAttribute("aria-expanded") === "true");
    const activeId = (wasExpanded ?? triggers[0])?.dataset.targetId;
    triggers.forEach((btn) => {
      const panel = document.getElementById(btn.dataset.targetId ?? "");
      if (!panel) return;
      btn.setAttribute("role", "tab");
      btn.removeAttribute("aria-expanded");
      btn.setAttribute("aria-selected", String(btn.dataset.targetId === activeId));
      btn.tabIndex = btn.dataset.targetId === activeId ? 0 : -1;
      panel.setAttribute("role", "tabpanel");
      panelsWrapper.append(panel);
    });
    if (activeId) activateTab(block, activeId);
  }
}
function decorate(block) {
  const rows = [...block.children];
  const items = rows.map(parseTabItem);
  const blockId = block.id || `tabs-${Math.random().toString(36).slice(2, 8)}`;
  const tablist = document.createElement("div");
  tablist.setAttribute("role", "tablist");
  tablist.className = "tabs-list";
  const panelsWrapper = document.createElement("div");
  panelsWrapper.className = "tabs-panels";
  items.forEach(({ row, headingDiv, iconDiv, bodyDiv, videoDiv }, i) => {
    const panelId = `${blockId}-panel-${i}`;
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "tabs-trigger";
    trigger.dataset.targetId = panelId;
    trigger.setAttribute("role", "tab");
    trigger.setAttribute("aria-controls", panelId);
    trigger.setAttribute("aria-selected", String(i === 0));
    trigger.tabIndex = i === 0 ? 0 : -1;
    const iconImg = iconDiv?.querySelector("img");
    if (iconImg && iconDiv) {
      const iconSpan = document.createElement("span");
      iconSpan.className = "tabs-trigger-icon";
      iconSpan.append(iconDiv.querySelector("picture") ?? iconImg);
      trigger.append(iconSpan);
    }
    if (headingDiv) {
      headingDiv.classList.add("tabs-trigger-label");
      trigger.append(headingDiv);
    }
    trigger.addEventListener("click", () => {
      if (MOBILE_QUERY.matches) toggleAccordionPanel(trigger);
      else activateTab(block, panelId);
    });
    tablist.append(trigger);
    const panel = document.createElement("div");
    moveInstrumentation(row, panel);
    panel.className = "tabs-panel";
    panel.id = panelId;
    panel.setAttribute("role", "tabpanel");
    panel.hidden = i !== 0;
    if (bodyDiv) {
      bodyDiv.classList.add("tabs-body");
      panel.append(bodyDiv);
    }
    const videoEmbed = buildVideoEmbed(videoDiv);
    if (videoEmbed) panel.append(videoEmbed);
    videoDiv?.remove();
    panelsWrapper.append(panel);
    row.remove();
  });
  block.append(tablist, panelsWrapper);
  wireKeyboardNav(tablist);
  applyLayoutMode(block, MOBILE_QUERY.matches);
  MOBILE_QUERY.addEventListener("change", (e) => applyLayoutMode(block, e.matches));
  const firstPanel = panelsWrapper.querySelector(".tabs-panel");
  if (firstPanel && !firstPanel.hidden) {
    lazyLoadVideo(firstPanel.querySelector(".tabs-video"));
  }
}
export {
  decorate as default
};
