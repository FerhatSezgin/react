const Header = () => {
  return (
    <div className="headerContanier">
      <img
        className="logo"
        src="https://ajansara.com/wp-content/uploads/Wolswagen-yeni-logo-1024x1024.png"
        alt="logo"
      />
      <ul className="list">
        <li>ANASAYFA</li>
        <li>İLETİŞİM</li>
        <li>BİLGİ</li>
        <li>
          <a className="login" href="/login" target="_blank">
            GİRİŞ YAP
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Header;
