import CartIcon from './CartIcon';

export function Header() {
  return (
    <header className="site-header">
      <span className="site-header__title">Shop</span>
      <CartIcon />
    </header>
  );
}

export default Header;
