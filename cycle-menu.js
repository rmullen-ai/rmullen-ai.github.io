document.querySelectorAll(".nav-menu").forEach(menu => {
  const toggle = menu.querySelector("summary");
  const options = menu.querySelector(".nav-options");
  let pinned = false;

  function closeMenu() {
    pinned = false;
    menu.open = false;
  }

  menu.addEventListener("pointerenter", event => {
    if (event.pointerType === "mouse") menu.open = true;
  });

  menu.addEventListener("pointerleave", event => {
    if (event.pointerType === "mouse" && !pinned && !options.contains(document.activeElement)) {
      closeMenu();
    }
  });

  toggle.addEventListener("click", event => {
    event.preventDefault();
    pinned = !pinned;
    menu.open = pinned;
  });

  menu.addEventListener("focusout", event => {
    if (!menu.contains(event.relatedTarget)) closeMenu();
  });

  menu.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu.open) {
      event.preventDefault();
      closeMenu();
      toggle.focus();
    }
  });

  document.addEventListener("pointerdown", event => {
    if (!menu.contains(event.target)) closeMenu();
  });
});
