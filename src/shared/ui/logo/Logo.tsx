import clsx from 'clsx';
import tiuLogo from './assets/tiu-logo.svg';
import styles from './Logo.module.scss';

interface LogoProps {
  /** Подпись продукта справа от знака университета */
  product?: 'media' | 'portal';
  title?: string;
  className?: string;
}

/** Оригинальный логотип ТИУ и название продукта: «МЕДИА · Тюменский индустриальный». */
export function Logo({ product = 'media', title, className }: LogoProps) {
  return (
    <span className={clsx(styles.logo, styles[product], className)}>
      <img
        src={tiuLogo}
        alt="Тюменский индустриальный университет"
        className={styles.mark}
      />
      {product === 'media' ? (
        <>
          <span className={styles.divider} aria-hidden />
          <span className={styles.product}>
            <span className={styles.name}>МЕДИА</span>
            <span className={styles.owner}>Тюменский индустриальный</span>
          </span>
        </>
      ) : (
        <span className={styles.portalTitle}>{title}</span>
      )}
    </span>
  );
}
