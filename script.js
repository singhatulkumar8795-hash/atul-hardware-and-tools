const defaultProducts = [
  { id: 1, name: "Heavy Duty Kisan Khurpa", category: "Agriculture Tools", price: 249, old: 320, emoji: "🌿", color: "green", offer: "22% OFF" },
  { id: 2, name: "Professional Claw Hammer", category: "Carpentry Tools", price: 499, old: 650, emoji: "🔨", color: "orange", offer: "BESTSELLER" },
  { id: 3, name: "Premium Fishing Reel", category: "Fishing Tools", price: 899, old: 1100, emoji: "🎣", color: "blue", offer: "18% OFF" },
  { id: 4, name: "Universal Car Tool Kit", category: "Car Parts", price: 1299, old: 1699, emoji: "🧰", color: "orange", offer: "24% OFF" },
  { id: 5, name: "Steel Hand Saw 20 inch", category: "Carpentry Tools", price: 375, old: 450, emoji: "🪚", color: "orange" },
  { id: 6, name: "Bike Chain Lubricant", category: "Motorcycle Parts", price: 199, old: 240, emoji: "🏍️", color: "green" },
  { id: 7, name: "Diesel Fuel Filter", category: "Diesel Engine Parts", price: 580, old: 700, emoji: "⚙️", color: "blue" },
  { id: 8, name: "Garden Pruning Secateur", category: "Agriculture Tools", price: 299, old: 380, emoji: "✂️", color: "green" }
];
let products = JSON.parse(localStorage.getItem("atulProducts") || "null") || defaultProducts;
let cart = JSON.parse(localStorage.getItem("atulCart") || "[]");
let orders = JSON.parse(localStorage.getItem("atulOrders") || "[]");
let customer = JSON.parse(localStorage.getItem("atulCustomer") || "null");
let activeFilter = "all";

const productGrid = document.getElementById("productGrid");
const noResults = document.getElementById("noResults");
const toast = document.getElementById("toast");

function renderProducts() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const visible = products.filter((product) => {
    const matchesFilter = activeFilter === "all" || product.category === activeFilter;
    return matchesFilter && (!query || `${product.name} ${product.category}`.toLowerCase().includes(query));
  });
  productGrid.innerHTML = visible.map((product) => `
    <article class="product-card">
      ${product.offer ? `<span class="offer-tag">${product.offer}</span>` : ""}
      <div class="product-image ${product.color}">${product.emoji}</div>
      <div class="product-info">
        <small>${product.category}</small>
        <h3>${product.name}</h3>
        <span class="price">₹${product.price.toLocaleString("en-IN")}</span><span class="old-price">₹${product.old.toLocaleString("en-IN")}</span>
        <button class="add-btn" data-add="${product.id}">Add to cart</button>
      </div>
    </article>
  `).join("");
  noResults.style.display = visible.length ? "none" : "block";
}

function saveProducts() {
  localStorage.setItem("atulProducts", JSON.stringify(products));
  renderProducts();
  renderAdminProducts();
}

function renderAdminProducts() {
  document.getElementById("adminProducts").innerHTML = `
    <form id="productForm" class="admin-product-form">
      <input id="productName" required placeholder="Product name" />
      <input id="productCategory" required placeholder="Category" />
      <input id="productPrice" required type="number" min="1" placeholder="Price (₹)" />
      <input id="productEmoji" required maxlength="2" placeholder="Emoji" />
      <button class="button button-primary" type="submit">Add product</button>
    </form>
    <div class="admin-product-list">${products.map((product) => `
      <div class="admin-product-row"><span>${product.emoji}</span><div><strong>${product.name}</strong><small>${product.category} · ₹${product.price.toLocaleString("en-IN")}</small></div><button data-admin-remove="${product.id}" aria-label="Delete product"><i data-lucide="trash-2"></i></button></div>
    `).join("")}</div>`;
  document.getElementById("productForm").addEventListener("submit", (event) => {
    event.preventDefault();
    products.push({
      id: Date.now(),
      name: document.getElementById("productName").value.trim(),
      category: document.getElementById("productCategory").value.trim(),
      price: Number(document.getElementById("productPrice").value),
      old: Number(document.getElementById("productPrice").value),
      emoji: document.getElementById("productEmoji").value || "🔧",
      color: "green"
    });
    saveProducts();
    showToast("Product added");
  });
  document.querySelectorAll("[data-admin-remove]").forEach((button) => button.addEventListener("click", () => {
    products = products.filter((product) => product.id !== Number(button.dataset.adminRemove));
    saveProducts();
    showToast("Product removed");
  }));
  lucide.createIcons();
}

function renderAdminOrders() {
  const panel = document.getElementById("adminOrders");
  panel.innerHTML = orders.length ? orders.map((order) => `
    <div class="admin-order-row"><div><strong>#${order.id}</strong><small>${order.customer.name} · ${order.customer.phone}</small><small>${order.customer.address}</small></div><div><b>₹${order.total.toLocaleString("en-IN")}</b><span class="order-status">${order.status}</span></div></div>
  `).join("") : `<div class="orders-empty"><i data-lucide="package-open"></i><p>No COD orders yet.</p></div>`;
  lucide.createIcons();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function renderCart() {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById("cartCount").textContent = count;
  document.getElementById("drawerCount").textContent = `(${count})`;
  document.getElementById("cartTotal").textContent = `₹${total.toLocaleString("en-IN")}`;
  document.getElementById("cartItems").innerHTML = cart.map((item) => `
    <div class="cart-row">
      <div class="cart-row-image">${item.emoji}</div>
      <div><h4>${item.name}</h4><p>₹${item.price.toLocaleString("en-IN")} × ${item.quantity}</p><button data-remove="${item.id}">Remove</button></div>
    </div>
  `).join("");
  document.getElementById("cartEmpty").style.display = cart.length ? "none" : "block";
  document.getElementById("cartFooter").style.display = cart.length ? "block" : "none";
  localStorage.setItem("atulCart", JSON.stringify(cart));
}

function renderOrders() {
  const list = document.getElementById("ordersList");
  if (!orders.length) {
    list.innerHTML = `<div class="orders-empty"><i data-lucide="package-open"></i><p>No orders yet.</p><small>Your completed demo orders will appear here.</small></div>`;
  } else {
    list.innerHTML = orders.map((order) => `
      <div class="order-card">
        <div><strong>Order #${order.id}</strong><small>${order.date}</small></div>
        <span class="order-status">${order.status}</span>
        <p>${order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p>
        <b>₹${order.total.toLocaleString("en-IN")}</b>
      </div>
    `).join("");
  }
  lucide.createIcons();
}

function openModal(id) {
  document.getElementById(id).classList.add("open");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

function setFilter(category) {
  activeFilter = category;
  document.querySelectorAll(".filter-btn").forEach((button) => button.classList.toggle("active", button.dataset.filter === category));
  renderProducts();
  document.getElementById("products").scrollIntoView({ behavior: "smooth", block: "start" });
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    const product = products.find((item) => item.id === Number(addButton.dataset.add));
    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    renderCart();
    showToast(`${product.name} added to your cart`);
    return;
  }
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    cart = cart.filter((item) => item.id !== Number(removeButton.dataset.remove));
    renderCart();
    return;
  }
  const categoryButton = event.target.closest("[data-category]");
  if (categoryButton) setFilter(categoryButton.dataset.category);
});

document.querySelectorAll(".filter-btn").forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter)));
document.getElementById("searchForm").addEventListener("submit", (event) => { event.preventDefault(); renderProducts(); document.getElementById("products").scrollIntoView({ behavior: "smooth" }); });
document.getElementById("searchInput").addEventListener("input", renderProducts);

const drawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("drawerOverlay");
function toggleCart(open) { drawer.classList.toggle("open", open); overlay.classList.toggle("open", open); }
document.getElementById("cartBtn").addEventListener("click", () => toggleCart(true));
document.getElementById("closeCart").addEventListener("click", () => toggleCart(false));
overlay.addEventListener("click", () => toggleCart(false));

const loginModal = document.getElementById("loginModal");
document.getElementById("loginBtn").addEventListener("click", () => openModal("loginModal"));
document.getElementById("ordersBtn").addEventListener("click", () => {
  renderOrders();
  openModal("ordersModal");
});
document.getElementById("adminBtn").addEventListener("click", () => {
  renderAdminProducts();
  renderAdminOrders();
  openModal("adminModal");
});
document.querySelectorAll("[data-admin-tab]").forEach((tab) => tab.addEventListener("click", () => {
  document.querySelectorAll("[data-admin-tab]").forEach((item) => item.classList.toggle("active", item === tab));
  document.getElementById("adminProducts").hidden = tab.dataset.adminTab !== "products";
  document.getElementById("adminOrders").hidden = tab.dataset.adminTab !== "orders";
}));
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => closeModal(button.dataset.close)));
loginModal.addEventListener("click", (event) => { if (event.target === loginModal) loginModal.classList.remove("open"); });
document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  customer = { phone: document.getElementById("loginPhone").value };
  localStorage.setItem("atulCustomer", JSON.stringify(customer));
  document.getElementById("loginMessage").textContent = "Demo login successful. Your details are saved on this device.";
  window.setTimeout(() => closeModal("loginModal"), 1100);
});
document.getElementById("checkoutBtn").addEventListener("click", (event) => {
  event.preventDefault();
  if (!cart.length) return;
  document.getElementById("customerPhone").value = customer?.phone || "";
  toggleCart(false);
  openModal("checkoutModal");
});
document.getElementById("checkoutForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = {
    id: String(Date.now()).slice(-6),
    date: new Date().toLocaleDateString("en-IN"),
    status: "Order received",
    total,
    items: cart.map(({ id, name, quantity }) => ({ id, name, quantity })),
    customer: {
      name: document.getElementById("customerName").value,
      phone: document.getElementById("customerPhone").value,
      address: document.getElementById("customerAddress").value
    }
  };
  orders.unshift(order);
  localStorage.setItem("atulOrders", JSON.stringify(orders));
  customer = order.customer;
  localStorage.setItem("atulCustomer", JSON.stringify(customer));
  cart = [];
  renderCart();
  closeModal("checkoutModal");
  toggleCart(false);
  renderOrders();
  openModal("ordersModal");
  showToast(`Order #${order.id} placed successfully`);
});

renderProducts();
renderCart();
renderOrders();
renderAdminProducts();
lucide.createIcons();
