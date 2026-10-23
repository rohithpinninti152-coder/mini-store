import { useState, type FormEvent } from "react";
import { api } from "../api";
import type { Product, ProductInput } from "../types";

type Props = {
  initial?: Product;
  aiEnabled: boolean;
  onSave: (p: ProductInput) => void;
  onCancel: () => void;
  onError: (err: unknown) => void;
};

export function ProductForm({ initial, aiEnabled, onSave, onCancel, onError }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? (initial.price_pence / 100).toFixed(2) : "");
  const [stock, setStock] = useState(String(initial?.stock ?? 0));
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [writing, setWriting] = useState(false);

  async function writeWithAi() {
    setWriting(true);
    try {
      const { description: text } = await api.aiDescribe(name, description);
      setDescription(text);
    } catch (err) {
      onError(err);
    } finally {
      setWriting(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({
      name,
      description,
      price_pence: Math.round(Number(price) * 100),
      stock: Number(stock),
      image_url: imageUrl,
    });
  }

  return (
    <form className="product-form" onSubmit={submit}>
      <label>
        Name
        <input required value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        Description
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      {aiEnabled && (
        <button type="button" className="ghost" disabled={!name || writing} onClick={writeWithAi}>
          {writing ? "Writing…" : "✨ Write with AI"}
        </button>
      )}
      <div className="row">
        <label>
          Price (£)
          <input required type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label>
          Stock
          <input required type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} />
        </label>
      </div>
      <label>
        Image URL
        <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      </label>
      <div className="row">
        <button>{initial ? "Save changes" : "Create product"}</button>
        <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
