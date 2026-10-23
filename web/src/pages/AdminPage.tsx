import { useCallback, useEffect, useState, type FormEvent } from "react";
import { adminToken, api, ApiError } from "../api";
import { ProductForm } from "../components/ProductForm";
import { formatPrice, type Order, type OrderStatus, type Product, type ProductInput } from "../types";

export function AdminPage() {
  const [token, setToken] = useState(adminToken.get());
  if (!token) return <Login onLogin={setToken} />;
  return <Dashboard onLogout={() => { adminToken.clear(); setToken(""); }} />;
}

function Login({ onLogin }: { onLogin: (t: string) => void }) {
  const [value, setValue] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    adminToken.set(value);
    onLogin(value);
  }
  return (
    <form className="panel narrow" onSubmit={submit}>
      <h1>Seller login</h1>
      <label>
        Admin token
        <input type="password" required value={value} onChange={(e) => setValue(e.target.value)} />
      </label>
      <button>Log in</button>
    </form>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [error, setError] = useState("");

  const handle = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) return onLogout();
      setError((err as Error).message);
    },
    [onLogout]
  );

  const refresh = useCallback(async () => {
    try {
      const [p, o] = await Promise.all([api.listProducts(), api.listOrders()]);
      setProducts(p);
      setOrders(o);
      setError("");
    } catch (err) {
      handle(err);
    }
  }, [handle]);

  useEffect(() => {
    refresh();
    api.aiStatus().then((s) => setAiEnabled(s.enabled)).catch(() => setAiEnabled(false));
  }, [refresh]);

  async function save(input: ProductInput) {
    try {
      if (editing === "new") await api.createProduct(input);
      else if (editing) await api.updateProduct(editing.id, input);
      setEditing(null);
      refresh();
    } catch (err) {
      handle(err);
    }
  }

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await api.deleteProduct(p.id);
      refresh();
    } catch (err) {
      handle(err);
    }
  }

  async function setStatus(o: Order, status: OrderStatus) {
    try {
      await api.setOrderStatus(o.id, status);
      refresh();
    } catch (err) {
      handle(err);
    }
  }

  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total_pence, 0);

  return (
    <div className="stack">
      <div className="row">
        <h1>Seller dashboard</h1>
        <button className="ghost" onClick={onLogout}>Log out</button>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="stats">
        <div><span className="muted">Products</span><strong>{products.length}</strong></div>
        <div><span className="muted">Orders</span><strong>{orders.length}</strong></div>
        <div><span className="muted">Revenue</span><strong>{formatPrice(revenue)}</strong></div>
      </div>

      <section className="panel">
        <div className="row">
          <h2>Products</h2>
          <button onClick={() => setEditing("new")}>Add product</button>
        </div>
        {editing && (
          <ProductForm
            initial={editing === "new" ? undefined : editing}
            aiEnabled={aiEnabled}
            onSave={save}
            onCancel={() => setEditing(null)}
            onError={handle}
          />
        )}
        <table>
          <thead><tr><th>Name</th><th className="right">Price</th><th className="right">Stock</th><th /></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td className="right">{formatPrice(p.price_pence)}</td>
                <td className="right">{p.stock}</td>
                <td className="right">
                  <button className="ghost" onClick={() => setEditing(p)}>Edit</button>
                  <button className="ghost danger" onClick={() => remove(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Orders</h2>
        {orders.length === 0 ? (
          <p className="muted">No orders yet.</p>
        ) : (
          <table>
            <thead><tr><th>#</th><th>Customer</th><th>Items</th><th className="right">Total</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.customer_name}<div className="muted small">{o.customer_email}</div></td>
                  <td className="small">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</td>
                  <td className="right">{formatPrice(o.total_pence)}</td>
                  <td>
                    <select value={o.status} onChange={(e) => setStatus(o, e.target.value as OrderStatus)}>
                      <option value="pending">Pending</option>
                      <option value="shipped">Shipped</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
