import { Link, NavLink, Route, Routes } from "react-router-dom";
import { useCart } from "./cart";
import { StorePage } from "./pages/StorePage";
import { CartPage } from "./pages/CartPage";
import { AdminPage } from "./pages/AdminPage";

export function App() {
  const { count } = useCart();
  return (
    <>
      <header className="topbar">
        <Link to="/" className="logo">Mini Store</Link>
        <nav>
          <NavLink to="/" end>Shop</NavLink>
          <NavLink to="/cart">Cart{count > 0 && <span className="badge">{count}</span>}</NavLink>
          <NavLink to="/admin">Seller</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<StorePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
