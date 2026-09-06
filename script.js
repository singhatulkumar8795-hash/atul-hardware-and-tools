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
let cloudMode = false;
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
      <div class="product-image ${product.color}">${product.image ? `<img src="${product.image}" alt="${product.name}" loading="lazy">` : product.emoji}</div>
      <div class="product-info">
        <small>${product.category}</small>
        <h3>${product.name}</h3>
        <span class="price">₹${product.price.toLocaleString("en-IN")}</span><span class="old-price">₹${product.old.toLocaleString("en-IN")}</span>
        <button class="add-btn" data-detail="${product.id}">View details</button>
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

async function loadCloudData() {
  try {
    const cloudProducts = await window.atulCloud.listProducts();
    cloudMode = true;
    if (cloudProducts.length) {
      products = cloudProducts.map((product) => ({
        id: product.id, name: product.name, category: product.category,
        price: product.price, old: product.old_price, quantity: product.quantity, description: product.description, specification: product.specification, emoji: product.emoji, color: product.color, image: product.image
      }));
      localStorage.setItem("atulProducts", JSON.stringify(products));
      renderProducts();
      renderAdminProducts();
    }
  } catch (error) {
    console.warn("Cloud sync unavailable; using local mode.", error.message);
  }
}

async function loadAdminOrders() {
  const cloudOrders = await window.atulCloud.listOrders();
  orders = cloudOrders.map((order) => ({
    id: order.order_number, date: new Date(order.created_at).toLocaleDateString("en-IN"),
    status: order.status, total: order.total, items: order.items,
    customer: { name: order.customer_name, phone: order.customer_phone, address: order.customer_address }
  }));
  renderAdminOrders();
}

function renderAdminProducts() {
  document.getElementById("adminProducts").innerHTML = `
    <form id="productForm" class="admin-product-form">
      <input id="productName" required placeholder="Product name" />
      <input id="productCategory" required placeholder="Category" />
      <input id="productPrice" required type="number" min="1" placeholder="Price (₹)" />
      <input id="productOldPrice" type="number" min="1" placeholder="MRP / old price (₹)" />
      <input id="productQuantity" required type="number" min="0" placeholder="Product quantity / stock" />
      <input id="productImage" type="url" placeholder="Product photo URL" />
      <textarea id="productDescription" required placeholder="Product description"></textarea>
      <textarea id="productSpecification" required placeholder="Product specification"></textarea>
      <input id="productEmoji" maxlength="2" placeholder="Emoji (optional)" />
      <button class="button button-primary" type="submit">Add product</button>
    </form>
    <div class="admin-product-list">${products.map((product) => `
      <div class="admin-product-row"><span>${product.image ? `<img src="${product.image}" alt="">` : product.emoji}</span><div><strong>${product.name}</strong><small>${product.category} · ₹${product.price.toLocaleString("en-IN")} · Stock: ${product.quantity ?? 0}</small></div><button data-admin-edit="${product.id}" aria-label="Edit product"><i data-lucide="pencil"></i></button><button data-admin-remove="${product.id}" aria-label="Delete product"><i data-lucide="trash-2"></i></button></div>
    `).join("")}</div>`;
  document.getElementById("productForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = event.currentTarget.querySelector("button[type=\"submit\"]");
    submitButton.disabled = true;
    submitButton.textContent = "Saving...";
    const product = {
      id: Date.now(),
      name: document.getElementById("productName").value.trim(),
      category: document.getElementById("productCategory").value.trim(),
      price: Number(document.getElementById("productPrice").value),
      old: Number(document.getElementById("productOldPrice").value) || Number(document.getElementById("productPrice").value),
      quantity: Number(document.getElementById("productQuantity").value),
      description: document.getElementById("productDescription").value.trim(),
      specification: document.getElementById("productSpecification").value.trim(),
      emoji: document.getElementById("productEmoji").value.trim() || "🔧",
      color: "green",
      image: document.getElementById("productImage").value.trim()
    };
    try {
      if (cloudMode) {
        const saved = await window.atulCloud.insertProduct(product);
        product.id = saved.id;
      }
      products.push(product);
      saveProducts();
      event.currentTarget.reset();
      showToast(cloudMode ? "Product saved to cloud" : "Product saved on this device");
    } catch (error) {
      console.error("Product save failed.", error);
      showToast("Product could not be saved. Check admin access.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Add product";
    }
  });
  document.querySelectorAll("[data-admin-edit]").forEach((button) => button.addEventListener("click", () => {
    const product = products.find((item) => item.id === Number(button.dataset.adminEdit));
    if (!product) return;
    const name = window.prompt("Product name", product.name);
    if (name === null) return;
    const category = window.prompt("Category", product.category);
    if (category === null) return;
    const priceText = window.prompt("Price (₹)", String(product.price));
    if (priceText === null || !Number(priceText)) return;
    const image = window.prompt("Image URL (optional)", product.image || "");
    product.name = name.trim();
    product.category = category.trim();
    product.price = Number(priceText);
    product.old = Number(priceText);
    product.image = image.trim();
    if (cloudMode) window.atulCloud.updateProduct(product).catch((error) => console.warn("Product cloud update failed.", error.message));
    saveProducts();
    showToast("Product updated");
  }));
  document.querySelectorAll("[data-admin-remove]").forEach((button) => button.addEventListener("click", () => {
    const productId = Number(button.dataset.adminRemove);
    products = products.filter((product) => product.id !== productId);
    if (cloudMode) window.atulCloud.deleteProduct(productId).catch((error) => console.warn("Product cloud delete failed.", error.message));
    saveProducts();
    showToast("Product removed");
  }));
  lucide.createIcons();
}

function renderAdminOrders() {
  const panel = document.getElementById("adminOrders");
  const pending = orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status)).length;
  const sales = orders.filter((order) => order.status !== "Cancelled").reduce((sum, order) => sum + order.total, 0);
  document.getElementById("adminOrderCount").textContent = orders.length;
  document.getElementById("adminPendingCount").textContent = pending;
  document.getElementById("adminSalesTotal").textContent = `₹${sales.toLocaleString("en-IN")}`;
  panel.innerHTML = orders.length ? orders.map((order) => `
    <div class="admin-order-row"><div><strong>#${order.id}</strong><small>${order.customer.name} · ${order.customer.phone}</small><small>${addressText(order.customer.address)}</small></div><div><b>₹${order.total.toLocaleString("en-IN")}</b><select class="status-select" data-order-status="${order.id}">${["Order received", "Confirmed", "Packed", "Out for delivery", "Delivered", "Cancelled"].map((status) => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}</select></div></div>
  `).join("") : `<div class="orders-empty"><i data-lucide="package-open"></i><p>No COD orders yet.</p></div>`;
  lucide.createIcons();
  document.querySelectorAll("[data-order-status]").forEach((select) => select.addEventListener("change", async () => {
    const order = orders.find((item) => item.id === select.dataset.orderStatus);
    order.status = select.value;
    localStorage.setItem("atulOrders", JSON.stringify(orders));
    try {
      await window.atulCloud.updateOrderStatus(order.id, order.status);
      showToast("Order status updated");
    } catch (error) {
      showToast("Could not update cloud order");
    }
  }));
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
      <div><h4>${item.name}</h4><p>₹${item.price.toLocaleString("en-IN")} each</p><div class="quantity-control"><button data-quantity="${item.id}" data-change="-1" aria-label="Decrease quantity">−</button><b>${item.quantity}</b><button data-quantity="${item.id}" data-change="1" aria-label="Increase quantity">+</button><button class="remove-item" data-remove="${item.id}">Remove</button></div></div>
    </div>
  `).join("");
  document.getElementById("cartEmpty").style.display = cart.length ? "none" : "block";
  document.getElementById("cartFooter").style.display = cart.length ? "block" : "none";
  localStorage.setItem("atulCart", JSON.stringify(cart));
}

function renderOrders() {
  const list = document.getElementById("ordersList");
  const customerOrders = customer?.phone
    ? orders.filter((order) => order.customer?.phone === customer.phone)
    : [];
  if (!customerOrders.length) {
    list.innerHTML = `<div class="orders-empty"><i data-lucide="package-open"></i><p>No orders yet.</p><small>Your completed demo orders will appear here.</small></div>`;
  } else {
    list.innerHTML = customerOrders.map((order) => `
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

function updateAccountLabel() {
  document.getElementById("accountLabel").textContent = customer?.name ? customer.name.split(" ")[0] : "Login";
}

function addressText(address) {
  if (!address) return "";
  if (typeof address === "string") return address;
  return [address.house, address.village, address.city, address.district, address.state, address.pincode, address.landmark].filter(Boolean).join(", ");
}

function normalizeCustomer() {
  if (!customer) return;
  const legacyAddress = customer.address;
  if (!Array.isArray(customer.addresses)) {
    customer.addresses = legacyAddress && typeof legacyAddress === "object" ? [{ id: Date.now(), label: "Address 1", ...legacyAddress }] : [];
  } else if (!customer.addresses.length && legacyAddress && typeof legacyAddress === "object") {
    customer.addresses = [{ id: Date.now(), label: "Address 1", ...legacyAddress }];
  }
  customer.defaultAddressId = customer.defaultAddressId || customer.addresses[0]?.id || null;
  customer.address = customer.addresses.find((address) => address.id === customer.defaultAddressId) || customer.addresses[0] || null;
}

function saveCustomer() {
  normalizeCustomer();
  localStorage.setItem("atulCustomer", JSON.stringify(customer));
  updateAccountLabel();
}

function readAddress(prefix) {
  return {
    house: document.getElementById(`${prefix}House`).value.trim(),
    village: document.getElementById(`${prefix}Village`).value.trim(),
    city: document.getElementById(`${prefix}City`).value.trim(),
    district: document.getElementById(`${prefix}District`).value.trim(),
    state: document.getElementById(`${prefix}State`).value.trim(),
    pincode: document.getElementById(`${prefix}Pincode`).value.trim(),
    landmark: document.getElementById(`${prefix}Landmark`).value.trim()
  };
}

function fillProfileForm() {
  normalizeCustomer();
  document.getElementById("profileName").value = customer?.name || "";
  document.getElementById("profilePhone").value = customer?.phone || "";
  const address = customer?.address || {};
  document.getElementById("profileHouse").value = address.house || "";
  document.getElementById("profileVillage").value = address.village || "";
  document.getElementById("profileCity").value = address.city || "";
  document.getElementById("profileDistrict").value = address.district || "";
  document.getElementById("profileState").value = address.state || "Uttar Pradesh";
  document.getElementById("profilePincode").value = address.pincode || "";
  document.getElementById("profileLandmark").value = address.landmark || "";
  document.getElementById("addressEditorTitle").textContent = address.house ? "Edit address" : "Address details";
  renderAddressList();
}

function renderAddressList() {
  normalizeCustomer();
  const list = document.getElementById("addressList");
  list.innerHTML = customer?.addresses?.length ? customer.addresses.map((address) => `
    <div class="saved-address ${address.id === customer.defaultAddressId ? "selected" : ""}">
      <div><strong>${address.label || "Delivery address"}</strong><small>${addressText(address)}</small></div>
      <div class="address-actions"><button type="button" data-edit-address="${address.id}">Edit</button><button type="button" data-default-address="${address.id}">${address.id === customer.defaultAddressId ? "Default" : "Use"}</button><button type="button" data-delete-address="${address.id}">Delete</button></div>
    </div>
  `).join("") : `<small class="no-address">No saved address yet. Add one below.</small>`;
}

function clearAddressForm() {
  ["profileHouse", "profileVillage", "profileCity", "profileDistrict", "profilePincode", "profileLandmark"].forEach((id) => { document.getElementById(id).value = ""; });
  document.getElementById("profileState").value = "Uttar Pradesh";
  document.getElementById("addressEditorTitle").textContent = "Add new address";
  document.getElementById("profileHouse").dataset.editingId = "";
}

function fillCheckoutAddress(address) {
  if (!address) return;
  document.getElementById("customerHouse").value = address.house || "";
  document.getElementById("customerVillage").value = address.village || "";
  document.getElementById("customerCity").value = address.city || "";
  document.getElementById("customerDistrict").value = address.district || "";
  document.getElementById("customerState").value = address.state || "Uttar Pradesh";
  document.getElementById("customerPincode").value = address.pincode || "";
  document.getElementById("customerLandmark").value = address.landmark || "";
}

function renderCheckoutAddresses() {
  normalizeCustomer();
  const picker = document.getElementById("checkoutAddressPicker");
  const select = document.getElementById("checkoutAddressSelect");
  if (!customer?.addresses?.length) {
    picker.hidden = true;
    return;
  }
  picker.hidden = false;
  select.innerHTML = customer.addresses.map((address) =>
    `<option value="${address.id}" ${address.id === customer.defaultAddressId ? "selected" : ""}>${address.label || "Saved address"} — ${addressText(address)}</option>`
  ).join("");
  fillCheckoutAddress(customer.addresses.find((address) => address.id === Number(select.value)) || customer.addresses[0]);
}

async function lookupPincode(prefix) {
  const pincode = document.getElementById(`${prefix}Pincode`).value.trim();
  if (!/^\d{6}$/.test(pincode)) return;
  const message = prefix === "profile" ? document.getElementById("pinMessage") : null;
  if (message) message.textContent = "Finding district and state...";
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const [result] = await response.json();
    const office = result?.Status === "Success" ? result.PostOffice?.[0] : null;
    if (!office) throw new Error("PIN not found");
    document.getElementById(`${prefix}District`).value = office.District || "";
    document.getElementById(`${prefix}State`).value = office.State || "";
    if (!document.getElementById(`${prefix}Village`).value) document.getElementById(`${prefix}Village`).value = office.Block || office.Name || "";
    if (message) message.textContent = "District and state filled from PIN.";
  } catch (error) {
    if (message) message.textContent = "PIN not found. Please enter district and state manually.";
  }
}

function setFilter(category) {
  activeFilter = category;
  document.querySelectorAll(".filter-btn").forEach((button) => button.classList.toggle("active", button.dataset.filter === category));
  renderProducts();
  document.getElementById("products").scrollIntoView({ behavior: "smooth", block: "start" });
}

document.addEventListener("click", (event) => {
  const detailButton = event.target.closest("[data-detail]");
  if (detailButton) {
    const product = products.find((item) => item.id === Number(detailButton.dataset.detail));
    if (!product) return;
    document.getElementById("productDetail").innerHTML = `
      <div class="detail-image ${product.color}">${product.image ? `<img src="${product.image}" alt="${product.name}">` : product.emoji}</div>
      <small class="detail-category">${product.category}</small>
      <h2>${product.name}</h2>
      <p class="detail-copy">Reliable quality from Atul Hardware and Tools. Suitable for professional work, workshop use and everyday repairs.</p>
      <p class="detail-copy">${product.description || "Quality tool for workshop and everyday use."}</p>
      <p class="detail-copy"><strong>Specification:</strong> ${product.specification || "Details available from the shop."}</p>
      <p class="detail-copy"><strong>Available quantity:</strong> ${product.quantity ?? 0}</p>
      <strong class="detail-price">₹${product.price.toLocaleString("en-IN")}</strong>
      ${product.old ? `<span class="old-price">₹${product.old.toLocaleString("en-IN")}</span>` : ""}
      <button class="button button-primary detail-add" data-add="${product.id}">Add to cart</button>`;
    openModal("productModal");
    lucide.createIcons();
    return;
  }
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    const product = products.find((item) => item.id === Number(addButton.dataset.add));
    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    renderCart();
    showToast(`${product.name} added to your cart`);
    if (event.target.closest(".detail-add")) closeModal("productModal");
    return;
  }
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    cart = cart.filter((item) => item.id !== Number(removeButton.dataset.remove));
    renderCart();
    return;
  }
  const quantityButton = event.target.closest("[data-quantity]");
  if (quantityButton) {
    const item = cart.find((cartItem) => cartItem.id === Number(quantityButton.dataset.quantity));
    if (item) {
      item.quantity += Number(quantityButton.dataset.change);
      if (item.quantity <= 0) cart = cart.filter((cartItem) => cartItem.id !== item.id);
      renderCart();
    }
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
document.getElementById("loginBtn").addEventListener("click", () => {
  if (customer?.phone) {
    fillProfileForm();
    openModal("profileModal");
  } else {
    openModal("loginModal");
  }
});
document.getElementById("newAddressBtn").addEventListener("click", clearAddressForm);
document.getElementById("profilePincode").addEventListener("blur", () => lookupPincode("profile"));
document.getElementById("customerPincode").addEventListener("blur", () => lookupPincode("customer"));
document.getElementById("checkoutAddressSelect").addEventListener("change", (event) => {
  const address = customer?.addresses?.find((item) => item.id === Number(event.target.value));
  fillCheckoutAddress(address);
});
document.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-address]");
  if (editButton) {
    const address = customer?.addresses?.find((item) => item.id === Number(editButton.dataset.editAddress));
    if (!address) return;
    document.getElementById("profileHouse").value = address.house || "";
    document.getElementById("profileVillage").value = address.village || "";
    document.getElementById("profileCity").value = address.city || "";
    document.getElementById("profileDistrict").value = address.district || "";
    document.getElementById("profileState").value = address.state || "Uttar Pradesh";
    document.getElementById("profilePincode").value = address.pincode || "";
    document.getElementById("profileLandmark").value = address.landmark || "";
    document.getElementById("profileHouse").dataset.editingId = address.id;
    document.getElementById("addressEditorTitle").textContent = "Edit address";
    return;
  }
  const defaultButton = event.target.closest("[data-default-address]");
  if (defaultButton) {
    customer.defaultAddressId = Number(defaultButton.dataset.defaultAddress);
    customer.address = customer.addresses.find((item) => item.id === customer.defaultAddressId);
    saveCustomer();
    fillProfileForm();
    return;
  }
  const deleteButton = event.target.closest("[data-delete-address]");
  if (deleteButton) {
    customer.addresses = customer.addresses.filter((item) => item.id !== Number(deleteButton.dataset.deleteAddress));
    customer.defaultAddressId = customer.addresses[0]?.id || null;
    customer.address = customer.addresses[0] || null;
    saveCustomer();
    fillProfileForm();
  }
});
document.getElementById("ordersBtn").addEventListener("click", () => {
  renderOrders();
  openModal("ordersModal");
});
document.getElementById("adminBtn").addEventListener("click", () => {
  if (!window.atulCloud.isAdmin()) {
    openModal("adminLoginModal");
    return;
  }
  renderAdminProducts();
  loadAdminOrders().catch(() => showToast("Could not load cloud orders"));
  openModal("adminModal");
});
document.getElementById("adminLoginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.getElementById("adminLoginMessage");
  message.textContent = "Signing in...";
  try {
    await window.atulCloud.signIn(document.getElementById("adminEmail").value, document.getElementById("adminPassword").value);
    closeModal("adminLoginModal");
    await loadCloudData();
    await loadAdminOrders();
    renderAdminProducts();
    renderAdminOrders();
    openModal("adminModal");
  } catch (error) {
    message.textContent = "Login failed. Check email and password.";
  }
});
document.getElementById("adminSignout").addEventListener("click", () => {
  window.atulCloud.signOut();
  closeModal("adminModal");
  showToast("Admin signed out");
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
  customer = {
    name: document.getElementById("loginName").value.trim(),
    phone: document.getElementById("loginPhone").value,
    addresses: [{ id: Date.now(), label: "Address 1", ...readAddress("login") }]
  };
  customer.defaultAddressId = customer.addresses[0].id;
  customer.address = customer.addresses[0];
  saveCustomer();
  document.getElementById("loginMessage").textContent = "Demo login successful. Your details are saved on this device.";
  window.setTimeout(() => closeModal("loginModal"), 1100);
});
document.getElementById("profileForm").addEventListener("submit", (event) => {
  event.preventDefault();
  customer = {
    name: document.getElementById("profileName").value.trim(),
    phone: document.getElementById("profilePhone").value,
    addresses: customer.addresses || []
  };
  const address = { id: Number(document.getElementById("profileHouse").dataset.editingId) || Date.now(), label: "Address 1", ...readAddress("profile") };
  const existingIndex = customer.addresses.findIndex((item) => item.id === address.id);
  if (existingIndex >= 0) customer.addresses[existingIndex] = address;
  else customer.addresses.push(address);
  customer.defaultAddressId = customer.defaultAddressId || address.id;
  customer.address = customer.addresses.find((item) => item.id === customer.defaultAddressId) || address;
  saveCustomer();
  document.getElementById("profileMessage").textContent = "Profile saved successfully.";
  window.setTimeout(() => closeModal("profileModal"), 900);
});
document.getElementById("customerLogout").addEventListener("click", () => {
  customer = null;
  localStorage.removeItem("atulCustomer");
  updateAccountLabel();
  closeModal("profileModal");
  showToast("You have been logged out");
});
document.getElementById("checkoutBtn").addEventListener("click", (event) => {
  event.preventDefault();
  if (!cart.length) return;
  document.getElementById("customerPhone").value = customer?.phone || "";
  document.getElementById("customerName").value = customer?.name || "";
  renderCheckoutAddresses();
  if (!customer?.addresses?.length) fillCheckoutAddress(typeof customer?.address === "object" ? customer.address : null);
  toggleCart(false);
  openModal("checkoutModal");
});
document.getElementById("checkoutForm").addEventListener("submit", async (event) => {
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
      address: readAddress("customer")
    }
  };
  orders.unshift(order);
  let cloudSaved = false;
  try {
    await window.atulCloud.insertOrder({
      ...order,
      customer: { ...order.customer, address: addressText(order.customer.address) }
    });
    cloudSaved = true;
  } catch (error) {
    console.warn("Order cloud save failed.", error.message);
  }
  localStorage.setItem("atulOrders", JSON.stringify(orders));
  const savedAddresses = customer?.phone === order.customer.phone ? customer.addresses || [] : [];
  const matchingAddress = savedAddresses.find((address) => addressText(address) === addressText(order.customer.address));
  customer = {
    name: order.customer.name,
    phone: order.customer.phone,
    addresses: matchingAddress ? savedAddresses : [
      ...savedAddresses,
      { id: Date.now(), label: "Address 1", ...order.customer.address }
    ]
  };
  customer.defaultAddressId = matchingAddress?.id || customer.addresses[customer.addresses.length - 1]?.id || null;
  customer.address = customer.addresses.find((address) => address.id === customer.defaultAddressId) || order.customer.address;
  saveCustomer();
  cart = [];
  renderCart();
  closeModal("checkoutModal");
  toggleCart(false);
  renderOrders();
  document.getElementById("successMessage").textContent = `Order #${order.id} is confirmed. Cash on delivery selected.`;
  document.getElementById("successSummary").innerHTML = `<strong>₹${order.total.toLocaleString("en-IN")}</strong><small>${order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</small><small>${addressText(order.customer.address)}</small>`;
  document.getElementById("successWhatsapp").onclick = () => {
    const message = `Hello Atul Hardware and Tools, my COD order #${order.id} is confirmed. Total ₹${order.total}. Delivery address: ${addressText(order.customer.address)}`;
    window.open(`https://wa.me/918795484365?text=${encodeURIComponent(message)}`, "_blank");
  };
  openModal("successModal");
  showToast(cloudSaved ? `Order #${order.id} placed successfully` : `Order #${order.id} saved on this device only`);
});

renderProducts();
renderCart();
renderOrders();
renderAdminProducts();
updateAccountLabel();
lucide.createIcons();
loadCloudData();
