import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useCart } from "../cart";
import { formatPrice } from "../types";

export function CartPage() {
  const { items, setQuantity, totalPence, clear } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);

  async function checkout(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const order = await api.checkout({
        customer_name: name,
        customer_email: email,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      });
      setOrderId(order.id);
      clear();
      setStatus("done");
    } catch (err) {
      setError((err as Error).message);
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="panel">
        <h1>Thanks, order #{orderId} is placed.</h1>
        <Link to="/">Keep shopping</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="panel">
        <h1>Your cart is empty</h1>
        <Link to="/">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="two-col">
      <section className="panel">
        <h1>Cart</h1>
        <table>
          <tbody>
            {items.map(({ product, quantity }) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(product.id, Number(e.target.value))}
                    aria-label={`Quantity of ${product.name}`}
                  />
                </td>
                <td className="right">{formatPrice(product.price_pence * quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="total">Total: {formatPrice(totalPence)}</p>
      </section>

      <form className="panel" onSubmit={checkout}>
        <h2>Checkout</h2>
        <label>
          Name
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Email
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button disabled={status === "sending"}>{status === "sending" ? "Placing order…" : "Place order"}</button>
        <p className="muted small">Demo store: no payment is taken.</p>
      </form>
    </div>
  );
}
