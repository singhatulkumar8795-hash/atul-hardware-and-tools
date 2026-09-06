const SUPABASE_URL = "https://avfullbvedfgehkytmli.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rj99aTokMaCgo7tFaUaypg_ZZKp074x";
let accessToken = sessionStorage.getItem("atulAdminToken") || "";

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.method === "POST" ? "return=representation" : undefined,
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status})`);
  return response.status === 204 ? null : response.json();
}

window.atulCloud = {
  isAdmin() {
    return Boolean(accessToken);
  },
  async signIn(email, password) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error("Admin login failed");
    const session = await response.json();
    accessToken = session.access_token;
    sessionStorage.setItem("atulAdminToken", accessToken);
  },
  signOut() {
    accessToken = "";
    sessionStorage.removeItem("atulAdminToken");
  },
  async listProducts() {
    return supabaseRequest("products?select=*&active=eq.true&order=id.asc");
  },
  async insertProduct(product) {
    const [saved] = await supabaseRequest("products", {
      method: "POST",
      body: JSON.stringify({
        name: product.name,
        category: product.category,
        price: product.price,
        old_price: product.old,
        quantity: product.quantity,
        description: product.description || "",
        specification: product.specification || "",
        emoji: product.emoji,
        color: product.color || "green",
        image: product.image || null,
        active: true
      })
    });
    return { ...product, id: saved.id };
  },
  async updateProduct(product) {
    await supabaseRequest(`products?id=eq.${encodeURIComponent(product.id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: product.name,
        category: product.category,
        price: product.price,
        old_price: product.old,
        quantity: product.quantity,
        description: product.description || "",
        specification: product.specification || "",
        emoji: product.emoji,
        image: product.image || null
      })
    });
  },
  async deleteProduct(id) {
    await supabaseRequest(`products?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ active: false })
    });
  },
  async listOrders() {
    return supabaseRequest("orders?select=*&order=created_at.desc");
  },
  async updateOrderStatus(orderNumber, status) {
    await supabaseRequest(`orders?order_number=eq.${encodeURIComponent(orderNumber)}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  },
  async insertOrder(order) {
    const saved = await supabaseRequest("rpc/create_cod_order", {
      method: "POST",
      body: JSON.stringify({
        order_number: order.id,
        customer_name: order.customer.name,
        customer_phone: order.customer.phone,
        customer_address: typeof order.customer.address === "string"
          ? order.customer.address
          : Object.values(order.customer.address).filter(Boolean).join(", "),
        items: order.items,
        total: order.total,
        status: order.status
      })
    });
    return saved;
  }
};
