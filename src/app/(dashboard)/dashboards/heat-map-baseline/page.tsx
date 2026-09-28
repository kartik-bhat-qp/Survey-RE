import { redirect } from 'next/navigation';
/** Preserve old preview bookmarks; the heat map now lives on every dashboard. */
export default function HeatMapBaselinePage() { redirect('/dashboards/1'); }
