function parseTabItem(row) {
  const children = Array.from(row.children);
  const [headingDiv, iconDiv, bodyDiv, videoDiv] = children;
  return { row, headingDiv, iconDiv, bodyDiv, videoDiv };
}
function buildVideoEmbed(videoDiv) {
  const link = videoDiv?.querySelector("a");
  const src = link?.href;
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
    if (iconImg) {
      const iconSpan = document.createElement("span");
      iconSpan.className = "tabs-trigger-icon";
      iconSpan.append(iconDiv.querySelector("picture") ?? iconImg);
      trigger.append(iconSpan);
    }
    if (headingDiv) {
      headingDiv.classList.add("tabs-trigger-label");
      trigger.append(headingDiv);
    }
    trigger.addEventListener("click", () => activateTab(block, panelId));
    tablist.append(trigger);
    const panel = document.createElement("div");
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
    panelsWrapper.append(panel);
    row.remove();
  });
  block.append(tablist, panelsWrapper);
  const firstPanel = panelsWrapper.querySelector(".tabs-panel");
  if (firstPanel && !firstPanel.hidden) {
    lazyLoadVideo(firstPanel.querySelector(".tabs-video"));
  }
}
export {
  decorate as default
};
