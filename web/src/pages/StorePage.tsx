import { useEffect, useState } from "react";
import { api } from "../api";
import { useCart } from "../cart";
import { formatPrice, type Product } from "../types";

export function StorePage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState("");
  const { add, items } = useCart();

  useEffect(() => {
    api.listProducts().then(setProducts).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">Couldn't load products: {error}</p>;
  if (!products) return <p>Loading…</p>;
  if (products.length === 0) return <p>No products yet. Add some from the Seller page.</p>;

  return (
    <section className="grid">
      {products.map((p) => {
        const inCart = items.find((i) => i.product.id === p.id)?.quantity ?? 0;
        const soldOut = p.stock === 0 || inCart >= p.stock;
        return (
          <article key={p.id} className="card">
            {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" />}
            <div className="card-body">
              <h2>{p.name}</h2>
              <p className="muted">{p.description}</p>
              <div className="row">
                <strong>{formatPrice(p.price_pence)}</strong>
                <button disabled={soldOut} onClick={() => add(p)}>
                  {p.stock === 0 ? "Sold out" : inCart ? `In cart (${inCart})` : "Add to cart"}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
