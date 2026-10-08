/* =========================================================
   STEP 3: JavaScript = the behaviour (what happens on click)
   ========================================================= */
"use strict";

/* ---- 1. DATA (our products) ---- */
const PRODUCTS = [
  { id: 1, name: "Assam Morning",    type: "black",  price: 320, origin: "Assam",      color: "linear-gradient(135deg,#7a3b1d,#c0713a)" },
  { id: 2, name: "Darjeeling First", type: "black",  price: 540, origin: "Darjeeling", color: "linear-gradient(135deg,#a2562a,#e09b52)" },
  { id: 3, name: "Nilgiri Green",    type: "green",  price: 410, origin: "Nilgiri",    color: "linear-gradient(135deg,#1f7a5f,#5fc29a)" },
  { id: 4, name: "Jasmine Pearl",    type: "green",  price: 620, origin: "Darjeeling", color: "linear-gradient(135deg,#2e8b6e,#a6e0b8)" },
  { id: 5, name: "Tulsi Calm",       type: "herbal", price: 260, origin: "Maharashtra",color: "linear-gradient(135deg,#6a3d7c,#c28ad6)" },
  { id: 6, name: "Ginger Lemon",     type: "herbal", price: 280, origin: "Kerala",     color: "linear-gradient(135deg,#e08a1e,#ffd166)" }
];

/* ---- 2. SELECT HTML ELEMENTS ---- */
const $ = (id) => document.getElementById(id);
const grid = $("productGrid");
const emptyMsg = $("emptyMsg");
const searchInput = $("search");
const filters = $("filters");
const cartBtn = $("cartBtn");
const cartCount = $("cartCount");
const cartDrawer = $("cartDrawer");
const cartItems = $("cartItems");
const cartEmpty = $("cartEmpty");
const cartTotal = $("cartTotal");
const overlay = $("overlay");
const toast = $("toast");

/* ---- 3. STATE (what the app remembers) ---- */
let activeType = "all";
let searchText = "";
let cart = loadCart();   // object: { productId: quantity }

/* ---- 4. HELPERS ---- */
const rupees = (n) => "₹" + n.toLocaleString("en-IN");

// Troubleshooting: localStorage can fail (private mode), so we use try/catch
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || {};
  } catch (err) {
    console.error("Could not read cart:", err);
    return {};
  }
}
function saveCart() {
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch (err) {
    console.error("Could not save cart:", err);
  }
}

let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 2200);
}

// Performance: debounce = wait until the user stops typing
function debounce(fn, delay = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

/* ---- 5. SHOW PRODUCTS ---- */
function renderProducts() {
  const list = PRODUCTS.filter((p) => {
    const typeOk = activeType === "all" || p.type === activeType;
    const textOk = p.name.toLowerCase().includes(searchText);
    return typeOk && textOk;
  });

  // Build all cards as one string, then add to page ONCE (faster)
  grid.innerHTML = list.map((p, i) => `
    <article class="card" style="animation-delay:${i * 80}ms">
      <div class="card-art" style="background:${p.color}" aria-hidden="true">${p.name[0]}</div>
      <div class="card-body">
        <span class="tag">${p.type}</span>
        <h3>${p.name}</h3>
        <p class="meta">From ${p.origin}</p>
        <div class="card-foot">
          <span class="price">${rupees(p.price)}</span>
          <button class="btn" data-add="${p.id}">Add to cart</button>
        </div>
      </div>
    </article>`).join("");

  emptyMsg.hidden = list.length > 0;
}

/* ---- 6. CART LOGIC ---- */
function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  const product = PRODUCTS.find((p) => p.id === id);
  showToast(product.name + " added to cart");
}

function changeQty(id, change) {
  cart[id] = (cart[id] || 0) + change;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCart();
}

function renderCart() {
  const ids = Object.keys(cart);
  let total = 0;
  let count = 0;

  cartItems.innerHTML = ids.map((id) => {
    const p = PRODUCTS.find((x) => x.id === Number(id));
    if (!p) return "";                       // safety check
    const qty = cart[id];
    total += p.price * qty;
    count += qty;
    return `
      <li>
        <strong>${p.name}</strong>
        <span>${rupees(p.price * qty)}</span>
        <div class="qty">
          <button data-minus="${p.id}" aria-label="Remove one ${p.name}">-</button>
          <span>${qty}</span>
          <button data-plus="${p.id}" aria-label="Add one ${p.name}">+</button>
        </div>
      </li>`;
  }).join("");

  cartCount.textContent = count;
  cartCount.classList.remove("bump");
  void cartCount.offsetWidth;           // restart animation
  cartCount.classList.add("bump");
  cartTotal.textContent = rupees(total);
  cartEmpty.hidden = ids.length > 0;
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
}
function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
}

/* ---- 7. EVENTS (listen to clicks) ---- */
// Event delegation: ONE listener for all buttons (better performance)
grid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (btn) addToCart(Number(btn.dataset.add));
});

cartItems.addEventListener("click", (e) => {
  const plus = e.target.closest("[data-plus]");
  const minus = e.target.closest("[data-minus]");
  if (plus) changeQty(Number(plus.dataset.plus), 1);
  if (minus) changeQty(Number(minus.dataset.minus), -1);
});

filters.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
  chip.classList.add("active");
  activeType = chip.dataset.type;
  renderProducts();
});

searchInput.addEventListener("input", debounce(() => {
  searchText = searchInput.value.trim().toLowerCase();
  renderProducts();
}));

cartBtn.addEventListener("click", openCart);
$("closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });

$("clearCart").addEventListener("click", () => {
  cart = {};
  saveCart();
  renderCart();
});

$("checkoutBtn").addEventListener("click", () => {
  if (Object.keys(cart).length === 0) {
    showToast("Add a tea before you place the order");
    return;
  }
  cart = {};
  saveCart();
  renderCart();
  closeCart();
  showToast("Order placed. Thank you!");
});

// Mobile menu
const menuToggle = $("menuToggle");
const navList = $("navList");
menuToggle.addEventListener("click", () => {
  const open = navList.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});
navList.addEventListener("click", () => {
  navList.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
});

/* ---- 8. CONTACT FORM VALIDATION (Troubleshooting) ---- */
const form = $("contactForm");

function setError(fieldId, message) {
  const input = $(fieldId);
  $(fieldId + "Error").textContent = message;
  input.parentElement.classList.toggle("invalid", Boolean(message));
  return !message;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();                       // stop page reload
  const name = $("name").value.trim();
  const email = $("email").value.trim();
  const message = $("message").value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const okName    = setError("name",    name.length < 2 ? "Enter your name (at least 2 letters)." : "");
  const okEmail   = setError("email",   !emailPattern.test(email) ? "Enter a valid email, like name@example.com." : "");
  const okMessage = setError("message", message.length < 10 ? "Write at least 10 characters." : "");

  const success = $("formSuccess");
  if (okName && okEmail && okMessage) {
    success.textContent = "Thanks " + name + ". We will reply within 2 days.";
    success.hidden = false;
    form.reset();
  } else {
    success.hidden = true;
  }
});

/* ---- 9. START THE APP ---- */
$("year").textContent = new Date().getFullYear();
renderProducts();
renderCart();

/* ---- 10. SCROLL ANIMATION: show sections when they enter the screen ---- */
const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((el) => observer.observe(el));
} else {
  revealItems.forEach((el) => el.classList.add("show"));   // old browsers
}
