import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Footer({ locale }: { locale: string }) {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">Cabox</span>
          <p className="footer-tagline">Moda curada con amor · Costa Rica</p>
        </div>

        <div className="footer-links-group">
          <h4>Tienda</h4>
          <Link href={`/${locale}/products`}>Todos los productos</Link>
          <Link href={`/${locale}/products?cat=mujeres`}>Mujeres</Link>
          <Link href={`/${locale}/products?cat=hombres`}>Hombres</Link>
          <Link href={`/${locale}/products?cat=accesorios`}>Accesorios</Link>
        </div>

        <div className="footer-links-group">
          <h4>Ayuda</h4>
          <Link href={`/${locale}/pages/envios`}>Envíos y devoluciones</Link>
          <Link href={`/${locale}/pages/contacto`}>Contacto</Link>
          <Link href={`/${locale}/orders`}>Estado de pedido</Link>
        </div>

        <div className="footer-links-group">
          <h4>Legal</h4>
          <Link href={`/${locale}/pages/privacidad`}>Privacidad</Link>
          <Link href={`/${locale}/pages/terminos`}>Términos</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>{t('copyright', { year })}</p>
      </div>
    </footer>
  );
}
