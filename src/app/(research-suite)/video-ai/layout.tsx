import styles from './VideoAiLayout.module.css';

export default function VideoAiDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.scrollArea}>{children}</div>;
}
