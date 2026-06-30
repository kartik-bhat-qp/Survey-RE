import * as am5 from '@amcharts/amcharts5';
import am5themesAnimated from '@amcharts/amcharts5/themes/Animated';
import { AMCHART_LICENSE, BI_CHART_COLORS } from '@/components/charts/amcharts/constants';

export interface AmChartTypography {
  fontFamily: string;
  fontSize: number;
  fontWeight: '400' | '500' | '600';
  fontStyle: 'normal' | 'italic';
}

export function addAmChartLicense(): void {
  am5.addLicense(AMCHART_LICENSE);
}

export function applyBiTheme(root: am5.Root, typography?: AmChartTypography): void {
  const theme = am5.Theme.new(root);
  theme.rule('Label').setAll({
    fill: am5.color(0x545e6b),
    fontFamily: typography?.fontFamily,
    fontSize: typography?.fontSize ?? 12,
    fontStyle: typography?.fontStyle,
    fontWeight: typography?.fontWeight,
  });
  theme.rule('ColorSet').set(
    'colors',
    BI_CHART_COLORS.map((color) => am5.color(color))
  );
  root.setThemes([am5themesAnimated.new(root), theme]);
  window.setTimeout(() => root._logo?.dispose(), 0);
}
