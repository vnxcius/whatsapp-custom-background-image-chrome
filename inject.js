const IMAGE_QUALITY = 0.85;
const MAX_IMAGE_WIDTH = 1200;
const CHAT_CONTEXT_MENU = "._ak4w._ap4-._ap4_";
const CHAT_DIV = ".x10l6tqk.x13vifvy.x1o0tod.xh8yej3.x5yr21d.x1wwuglj.x1vs56c6";
const CHAT_BACKGROUND_DIV =
  "._aiwn._aiwm.app-wrapper-web.os-win.x1h89ln0.xoeyzqq";

const BACKGROUND_IMAGE_OPACITY = localStorage.getItem("customBgOpacity");
let backgroundImageOpacity = BACKGROUND_IMAGE_OPACITY || 0.3;

const resetBackground = () => {
  localStorage.removeItem("customBackground");
  localStorage.removeItem("customBgOpacity");

  backgroundImageOpacity = 0.3;

  const div = document.querySelector(CHAT_DIV);
  if (div) {
    div.style.backgroundImage = "";
    div.style.opacity = "";
    div.style.backgroundPosition = "";
    div.style.backgroundSize = "";
  }
};

const applyBackground = (targetDiv) => {
  const savedBackground = localStorage.getItem("customBackground");
  if (savedBackground && targetDiv) {
    targetDiv.style.backgroundImage = `url(${savedBackground})`;
    targetDiv.style.backgroundSize = "cover";
    targetDiv.style.backgroundPosition = "center";
    targetDiv.style.opacity = backgroundImageOpacity;
  }
};

const handleFileInput = () => {
  const input = document.getElementById("bg");
  if (!input) return;

  input.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = MAX_IMAGE_WIDTH / img.width;
        canvas.width = MAX_IMAGE_WIDTH;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
        localStorage.setItem("customBackground", compressedBase64);

        applyBackground(div);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
};

const startObserver = () => {
  const chatBgDiv = document.querySelector(CHAT_BACKGROUND_DIV);
  if (!chatBgDiv) return;

  console.log("Successfully detected background div");
  let lastMenu = null;

  const backgroundDivObserver = new MutationObserver(async () => {
    const chatContextMenu = document.querySelector(CHAT_CONTEXT_MENU);
    if (!chatContextMenu || chatContextMenu === lastMenu) return;

    lastMenu = chatContextMenu;
    console.log("Injected 'Change Background Image' button");

    const ul = chatContextMenu.querySelector("ul");
    const li = ul.querySelector("div:nth-child(1)");

    if (!chatContextMenu.querySelector(".wapp-changer")) {
      const res = await fetch(chrome.runtime.getURL("input.html"));
      const html = await res.text();
      const template = document.createElement("template");
      template.innerHTML = html.trim();
      const fragment = template.content.cloneNode(true);

      li.appendChild(fragment);

      const bgOpacityInput = chatContextMenu.querySelector("#opacity");
      if (bgOpacityInput) {
        bgOpacityInput.value = backgroundImageOpacity * 100;

        bgOpacityInput.addEventListener("change", () => {
          const value = bgOpacityInput.value / 100;
          localStorage.setItem("customBgOpacity", value);
          backgroundImageOpacity = value;
          applyBackground(document.querySelector(CHAT_DIV));
        });
      }

      handleFileInput();

      const resetBtn = chatContextMenu.querySelector("#resetBackground");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          resetBackground();
        });
      }
    }

    const removalObserver = new MutationObserver(() => {
      if (!document.body.contains(chatContextMenu)) {
        lastMenu = null;
        removalObserver.disconnect();
      }
    });
    removalObserver.observe(document.body, { childList: true, subtree: true });
  });

  backgroundDivObserver.observe(chatBgDiv, {
    childList: true,
    subtree: true,
  });
};

const polling = setInterval(() => {
  const divEl = document.querySelector(CHAT_DIV);
  if (divEl) {
    clearInterval(polling);
    applyBackground(divEl);
    startObserver();
  }
}, 1000);

let div;
const appObserver = new MutationObserver(() => {
  const chatDiv = document.querySelector(CHAT_DIV);
  if (chatDiv && chatDiv !== div) {
    div = chatDiv;
    applyBackground(div);
  }
});

appObserver.observe(document.body, {
  childList: true,
  subtree: true,
});
