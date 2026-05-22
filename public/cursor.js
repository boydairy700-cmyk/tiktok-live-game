document.addEventListener("DOMContentLoaded", () => {
    // Check if it's a touch device, if so, don't show custom cursor
    if (window.matchMedia("(pointer: coarse)").matches) return;

    // Create cursor elements
    const cursor = document.createElement("div");
    cursor.classList.add("custom-cursor");
    
    const cursorDot = document.createElement("div");
    cursorDot.classList.add("custom-cursor-dot");
    
    document.body.appendChild(cursor);
    document.body.appendChild(cursorDot);

    // Track mouse movement
    document.addEventListener("mousemove", (e) => {
        cursorDot.style.left = `${e.clientX}px`;
        cursorDot.style.top = `${e.clientY}px`;
        
        // Add a slight delay to the outer circle for a "trailing" animation effect
        setTimeout(() => {
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;
        }, 40);
    });

    // Add click effects
    document.addEventListener("mousedown", () => {
        cursor.classList.add("clicking");
    });
    document.addEventListener("mouseup", () => {
        cursor.classList.remove("clicking");
    });

    // Add hover effects to interactive elements (using mutation observer or direct targeting)
    const addHoverToElements = () => {
        const hoverElements = document.querySelectorAll('a, button, .game-card, .cyber-card, input, select, .esports-card');
        hoverElements.forEach(el => {
            // Prevent adding multiple listeners
            if(el.dataset.cursorHoverAttached) return;
            el.dataset.cursorHoverAttached = "true";

            el.addEventListener("mouseenter", () => cursor.classList.add("hovering"));
            el.addEventListener("mouseleave", () => cursor.classList.remove("hovering"));
        });
    };

    addHoverToElements();
    
    // In case elements are dynamically added
    const observer = new MutationObserver(() => addHoverToElements());
    observer.observe(document.body, { childList: true, subtree: true });
});
