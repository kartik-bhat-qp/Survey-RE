'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import type { DesignTypographyOptions } from './DashboardDesignSettingsTab';
import styles from './DashboardPowerPointExportModal.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModal })),
  { ssr: false }
);
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalHeader })),
  { ssr: false }
);
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalContent })),
  { ssr: false }
);
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalFooter })),
  { ssr: false }
);
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

type ExportStep = 'widgets' | 'options';

type DashboardWidget = {
  id: string;
  name: string;
  type: string;
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
};

type WidgetSlideAssignments = Record<string, number>;

type SlideGroup = {
  slideNumber: number;
  widgets: DashboardWidget[];
};

type PreviewSlideKind = 'intro' | 'content' | 'outro';

type PreviewSlideGroup = {
  previewSlideNumber: number;
  kind: PreviewSlideKind;
  contentSlideNumber?: number;
  widgets: DashboardWidget[];
};

type PptImage = {
  src: string;
  width: number;
  height: number;
};

type PptMedia = PptImage & {
  bytes: Uint8Array;
  fileName: string;
};

type SlideSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

interface DashboardPowerPointExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardName: string;
  designTypography: DesignTypographyOptions;
}

const WIDGET_DATA_SOURCE = 'Guest dining preferences';
const PPT_SLIDE_WIDTH_EMU = 9144000;
const PPT_SLIDE_HEIGHT_EMU = 5143500;
const PPT_WATERMARK_SRC = '/questionpro-logo-nw.svg';
const PPT_WATERMARK_VIEWBOX_WIDTH = 166.365;
const PPT_WATERMARK_VIEWBOX_HEIGHT = 32;
const PPT_WATERMARK_ASPECT = PPT_WATERMARK_VIEWBOX_HEIGHT / PPT_WATERMARK_VIEWBOX_WIDTH;

const WIDGETS: DashboardWidget[] = [
  {
    id: 'map',
    name: `${WIDGET_DATA_SOURCE}: Response distribution on map`,
    type: 'Map',
    imageSrc: '/ppt-widget-map.png',
    imageWidth: 1826,
    imageHeight: 1268,
  },
  {
    id: 'response-info',
    name: `${WIDGET_DATA_SOURCE}: Response overview`,
    type: 'Response Info',
    imageSrc: '/ppt-widget-response-info.png',
    imageWidth: 1288,
    imageHeight: 604,
  },
  {
    id: 'pie',
    name: `${WIDGET_DATA_SOURCE}: Cuisine preference distribution`,
    type: 'Pie',
    imageSrc: '/ppt-widget-pie.png',
    imageWidth: 1554,
    imageHeight: 1044,
  },
  {
    id: 'bar',
    name: `${WIDGET_DATA_SOURCE}: Dining atmosphere distribution`,
    type: 'Bar',
    imageSrc: '/ppt-widget-bar-v2.png',
    imageWidth: 1286,
    imageHeight: 826,
  },
];

const SortIcon = () => (
  <span className="wm-swap-vert ml-1 text-[13px] text-[#8d98aa]" aria-hidden="true" />
);

function createDefaultWidgetSlideAssignments(widgetIds: string[], widgetsPerSlide: number) {
  return widgetIds.reduce<WidgetSlideAssignments>((assignments, widgetId, index) => {
    assignments[widgetId] = Math.floor(index / widgetsPerSlide) + 1;
    return assignments;
  }, {});
}

function getPptWidgetImage(widget: DashboardWidget): PptImage {
  if (widget.id === 'map') {
    return { src: '/ppt-preview-map-widget.png', width: 1316, height: 750 };
  }

  if (widget.id === 'pie') {
    return { src: '/ppt-preview-pie-widget.png', width: 1312, height: 648 };
  }

  return {
    src: widget.imageSrc,
    width: widget.imageWidth,
    height: widget.imageHeight,
  };
}

function getImageExtension(src: string) {
  const cleanSrc = src.split('?')[0] ?? src;
  return cleanSrc.toLowerCase().endsWith('.jpg') ||
    cleanSrc.toLowerCase().endsWith('.jpeg')
    ? 'jpg'
    : 'png';
}

async function loadPptMedia(widgets: DashboardWidget[]) {
  const uniqueImages = new Map<string, PptImage>();

  widgets.forEach((widget) => {
    const image = getPptWidgetImage(widget);
    uniqueImages.set(image.src, image);
  });

  const mediaBySrc = new Map<string, PptMedia>();
  let imageIndex = 1;

  await Promise.all(
    Array.from(uniqueImages.values()).map(async (image) => {
      const response = await fetch(image.src);

      if (!response.ok) {
        throw new Error(`Unable to load ${image.src}`);
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      const extension = getImageExtension(image.src);

      mediaBySrc.set(image.src, {
        ...image,
        bytes,
        fileName: `image${imageIndex}.${extension}`,
      });
      imageIndex += 1;
    })
  );

  return mediaBySrc;
}

async function loadWatermarkMedia(): Promise<PptMedia> {
  const response = await fetch(PPT_WATERMARK_SRC);

  if (!response.ok) {
    throw new Error(`Unable to load ${PPT_WATERMARK_SRC}`);
  }

  const svgText = await response.text();
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = document.createElement('img');
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Unable to render watermark'));
      img.src = objectUrl;
    });

    const width = 833;
    const height = Math.round(width * PPT_WATERMARK_ASPECT);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to render watermark');
    }

    context.drawImage(image, 0, 0, width, height);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Unable to encode watermark'));
      }, 'image/png');
    });

    const bytes = new Uint8Array(await pngBlob.arrayBuffer());

    return {
      src: PPT_WATERMARK_SRC,
      width: PPT_WATERMARK_VIEWBOX_WIDTH,
      height: PPT_WATERMARK_VIEWBOX_HEIGHT,
      bytes,
      fileName: 'questionpro-watermark.png',
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function makeCrc32Table() {
  return Array.from({ length: 256 }, (_, index) => {
    let crc = index;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    return crc >>> 0;
  });
}

const CRC32_TABLE = makeCrc32Table();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(output: number[], value: number) {
  output.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(output: number[], value: number) {
  output.push(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff
  );
}

function appendBytes(output: number[], bytes: Uint8Array) {
  bytes.forEach((byte) => output.push(byte));
}

function createZip(entries: { path: string; data: Uint8Array }[]) {
  const encoder = new TextEncoder();
  const output: number[] = [];
  const centralDirectory: number[] = [];

  entries.forEach((entry) => {
    const pathBytes = encoder.encode(entry.path);
    const checksum = crc32(entry.data);
    const localHeaderOffset = output.length;

    writeUint32(output, 0x04034b50);
    writeUint16(output, 20);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint32(output, checksum);
    writeUint32(output, entry.data.length);
    writeUint32(output, entry.data.length);
    writeUint16(output, pathBytes.length);
    writeUint16(output, 0);
    appendBytes(output, pathBytes);
    appendBytes(output, entry.data);

    writeUint32(centralDirectory, 0x02014b50);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint32(centralDirectory, checksum);
    writeUint32(centralDirectory, entry.data.length);
    writeUint32(centralDirectory, entry.data.length);
    writeUint16(centralDirectory, pathBytes.length);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint32(centralDirectory, 0);
    writeUint32(centralDirectory, localHeaderOffset);
    centralDirectory.push(...pathBytes);
  });

  const centralDirectoryOffset = output.length;
  output.push(...centralDirectory);

  writeUint32(output, 0x06054b50);
  writeUint16(output, 0);
  writeUint16(output, 0);
  writeUint16(output, entries.length);
  writeUint16(output, entries.length);
  writeUint32(output, centralDirectory.length);
  writeUint32(output, centralDirectoryOffset);
  writeUint16(output, 0);

  return new Uint8Array(output);
}

function xmlEntry(path: string, xml: string) {
  return { path, data: new TextEncoder().encode(xml) };
}

function getPptImagePlacement(
  image: PptImage,
  bounds: { x: number; y: number; cx: number; cy: number }
) {
  const imageRatio = image.width / image.height;
  const boundsRatio = bounds.cx / bounds.cy;

  if (imageRatio > boundsRatio) {
    const cx = bounds.cx;
    const cy = Math.round(cx / imageRatio);
    return { x: bounds.x, y: bounds.y + Math.round((bounds.cy - cy) / 2), cx, cy };
  }

  const cy = bounds.cy;
  const cx = Math.round(cy * imageRatio);
  return { x: bounds.x + Math.round((bounds.cx - cx) / 2), y: bounds.y, cx, cy };
}

function getPptWidgetBounds(widgetCount: number, index: number) {
  const margin = 420000;
  const gap = 240000;
  const contentWidth = PPT_SLIDE_WIDTH_EMU - margin * 2;
  const contentHeight = PPT_SLIDE_HEIGHT_EMU - margin * 2;

  if (widgetCount <= 1) {
    return { x: margin, y: margin, cx: contentWidth, cy: contentHeight };
  }

  if (widgetCount === 2) {
    return {
      x: margin,
      y: margin + index * Math.round((contentHeight + gap) / 2),
      cx: contentWidth,
      cy: Math.round((contentHeight - gap) / 2),
    };
  }

  const column = index % 2;
  const row = Math.floor(index / 2);
  return {
    x: margin + column * Math.round((contentWidth + gap) / 2),
    y: margin + row * Math.round((contentHeight + gap) / 2),
    cx: Math.round((contentWidth - gap) / 2),
    cy: Math.round((contentHeight - gap) / 2),
  };
}

function getWatermarkPlacement() {
  const cx = 800000;
  const cy = Math.round(cx * PPT_WATERMARK_ASPECT);
  const marginX = 120000;
  const marginY = 80000;

  return {
    x: PPT_SLIDE_WIDTH_EMU - cx - marginX,
    y: PPT_SLIDE_HEIGHT_EMU - cy - marginY,
    cx,
    cy,
  };
}

function getWatermarkRelId(widgetCount: number) {
  return `rId${widgetCount + 1}`;
}

function createWatermarkImageXml(shapeId: number, relId: string) {
  const placement = getWatermarkPlacement();

  return `<p:pic><p:nvPicPr><p:cNvPr id="${shapeId}" name="QuestionPro watermark"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${placement.x}" y="${placement.y}"/><a:ext cx="${placement.cx}" cy="${placement.cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}

function createTextSlideXml(slideText: string, fontFamily: string) {
  const watermark = createWatermarkImageXml(3, getWatermarkRelId(0));

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:sp><p:nvSpPr><p:cNvPr id="2" name="Bookend title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="540000" y="1900000"/><a:ext cx="8064000" cy="1300000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>
        <p:txBody><a:bodyPr anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="en-US" sz="4400" b="1" i="1"><a:solidFill><a:srgbClr val="1F2A44"/></a:solidFill><a:latin typeface="${escapeXml(fontFamily)}"/></a:rPr><a:t>${escapeXml(slideText)}</a:t></a:r></a:p></p:txBody>
      </p:sp>${watermark}
    </p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

function createImageSlideXml(slide: PreviewSlideGroup, mediaBySrc: Map<string, PptMedia>) {
  const pictures = slide.widgets
    .map((widget, index) => {
      const image = getPptWidgetImage(widget);
      const media = mediaBySrc.get(image.src);
      if (!media) return '';

      const bounds = getPptWidgetBounds(slide.widgets.length, index);
      const placement = getPptImagePlacement(media, bounds);
      const relId = `rId${index + 1}`;
      const shapeId = index + 2;

      return `<p:pic><p:nvPicPr><p:cNvPr id="${shapeId}" name="${escapeXml(widget.name)}"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${placement.x}" y="${placement.y}"/><a:ext cx="${placement.cx}" cy="${placement.cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
    })
    .join('');
  const watermark = createWatermarkImageXml(
    slide.widgets.length + 2,
    getWatermarkRelId(slide.widgets.length)
  );

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${pictures}${watermark}</p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

function createSlideRelationships(
  slide: PreviewSlideGroup,
  mediaBySrc: Map<string, PptMedia>,
  watermarkMedia: PptMedia
) {
  const relationships = slide.widgets
    .map((widget, index) => {
      const image = getPptWidgetImage(widget);
      const media = mediaBySrc.get(image.src);
      return media
        ? `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${media.fileName}"/>`
        : '';
    })
    .join('');
  const watermarkRelId = getWatermarkRelId(slide.widgets.length);
  const slideLayoutRelId = `rId${slide.widgets.length + 2}`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${relationships}
  <Relationship Id="${watermarkRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${watermarkMedia.fileName}"/>
  <Relationship Id="${slideLayoutRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`;
}

function createSlideMasterXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr sz="4400"/></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:otherStyle></p:txStyles>
</p:sldMaster>`;
}

function createSlideLayoutXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`;
}

function createThemeXml(fontFamily: string) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="QuestionPro">
  <a:themeElements><a:clrScheme name="QuestionPro"><a:dk1><a:srgbClr val="1F2A44"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="253449"/></a:dk2><a:lt2><a:srgbClr val="F3F6FA"/></a:lt2><a:accent1><a:srgbClr val="1E88E5"/></a:accent1><a:accent2><a:srgbClr val="4F63A2"/></a:accent2><a:accent3><a:srgbClr val="43A3B5"/></a:accent3><a:accent4><a:srgbClr val="43B69F"/></a:accent4><a:accent5><a:srgbClr val="9BD598"/></a:accent5><a:accent6><a:srgbClr val="E6963D"/></a:accent6><a:hlink><a:srgbClr val="1E63D7"/></a:hlink><a:folHlink><a:srgbClr val="6B5DD3"/></a:folHlink></a:clrScheme><a:fontScheme name="QuestionPro"><a:majorFont><a:latin typeface="${escapeXml(fontFamily)}"/></a:majorFont><a:minorFont><a:latin typeface="${escapeXml(fontFamily)}"/></a:minorFont></a:fontScheme><a:fmtScheme name="QuestionPro"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements>
</a:theme>`;
}

async function createPowerPointBlob(
  slides: PreviewSlideGroup[],
  fontFamily: string,
  dashboardName: string
) {
  const selectedWidgets = slides.flatMap((slide) => slide.widgets);
  const mediaBySrc = await loadPptMedia(selectedWidgets);
  const watermarkMedia = await loadWatermarkMedia();
  const contentTypes = slides
    .map(
      (_, index) =>
        `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    )
    .join('');
  const presentationRelationships = slides
    .map(
      (_, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`
    )
    .join('');
  const slideIds = slides
    .map((_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 1}"/>`)
    .join('');
  const slideMasterRelationshipId = `rId${slides.length + 1}`;
  const created = new Date().toISOString();
  const entries: { path: string; data: Uint8Array }[] = [
    xmlEntry(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${contentTypes}</Types>`
    ),
    xmlEntry(
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`
    ),
    xmlEntry(
      'docProps/core.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${escapeXml(dashboardName)}</dc:title><dc:creator>QuestionPro Dashboard Prototype</dc:creator><cp:lastModifiedBy>QuestionPro Dashboard Prototype</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${created}</dcterms:modified></cp:coreProperties>`
    ),
    xmlEntry(
      'docProps/app.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>QuestionPro Dashboard Prototype</Application><Slides>${slides.length}</Slides></Properties>`
    ),
    xmlEntry(
      'ppt/presentation.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="${slideMasterRelationshipId}"/></p:sldMasterIdLst><p:sldIdLst>${slideIds}</p:sldIdLst><p:sldSz cx="${PPT_SLIDE_WIDTH_EMU}" cy="${PPT_SLIDE_HEIGHT_EMU}" type="wide"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`
    ),
    xmlEntry(
      'ppt/_rels/presentation.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${presentationRelationships}<Relationship Id="${slideMasterRelationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/></Relationships>`
    ),
    xmlEntry('ppt/slideMasters/slideMaster1.xml', createSlideMasterXml()),
    xmlEntry(
      'ppt/slideMasters/_rels/slideMaster1.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`
    ),
    xmlEntry('ppt/slideLayouts/slideLayout1.xml', createSlideLayoutXml()),
    xmlEntry(
      'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`
    ),
    xmlEntry('ppt/theme/theme1.xml', createThemeXml(fontFamily)),
  ];

  slides.forEach((slide, index) => {
    const slideNumber = index + 1;
    const slideXml =
      slide.kind === 'content'
        ? createImageSlideXml(slide, mediaBySrc)
        : createTextSlideXml(slide.kind === 'intro' ? dashboardName : 'Thank you', fontFamily);

    entries.push(xmlEntry(`ppt/slides/slide${slideNumber}.xml`, slideXml));
    entries.push(
      xmlEntry(
        `ppt/slides/_rels/slide${slideNumber}.xml.rels`,
        createSlideRelationships(slide, mediaBySrc, watermarkMedia)
      )
    );
  });

  mediaBySrc.forEach((media) => {
    entries.push({ path: `ppt/media/${media.fileName}`, data: media.bytes });
  });
  entries.push({ path: `ppt/media/${watermarkMedia.fileName}`, data: watermarkMedia.bytes });

  return new Blob([createZip(entries)], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
}

function getSafeFilename(value: string) {
  const safeName = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${safeName || 'dashboard'}-questionpro-ppt.pptx`;
}

export function DashboardPowerPointExportModal({
  open,
  onOpenChange,
  dashboardName,
  designTypography,
}: DashboardPowerPointExportModalProps) {
  const { showToast } = useWuShowToast();
  const [currentStep, setCurrentStep] = useState<ExportStep>('widgets');
  const [widgetSearch, setWidgetSearch] = useState('');
  const [selectedWidgetIds, setSelectedWidgetIds] = useState<string[]>(
    WIDGETS.map((widget) => widget.id)
  );
  const [widgetSlideAssignments, setWidgetSlideAssignments] =
    useState<WidgetSlideAssignments>(() =>
      createDefaultWidgetSlideAssignments(WIDGETS.map((widget) => widget.id), 1)
    );
  const [includeIntroSlide, setIncludeIntroSlide] = useState(false);
  const [includeOutroSlide, setIncludeOutroSlide] = useState(false);
  const [isPowerPointExporting, setIsPowerPointExporting] = useState(false);

  const selectedWidgets = useMemo(
    () =>
      selectedWidgetIds
        .map((widgetId) => WIDGETS.find((widget) => widget.id === widgetId))
        .filter((widget): widget is DashboardWidget => Boolean(widget)),
    [selectedWidgetIds]
  );

  const filteredWidgets = useMemo(() => {
    const normalizedSearch = widgetSearch.trim().toLowerCase();
    if (!normalizedSearch) return WIDGETS;

    return WIDGETS.filter((widget) =>
      `${widget.name} ${widget.type} ${WIDGET_DATA_SOURCE}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [widgetSearch]);

  const slideGroups = useMemo<SlideGroup[]>(() => {
    const baseSlideCount = selectedWidgets.length;
    const highestAssignedSlide = selectedWidgets.reduce((highestSlide, widget, index) => {
      const fallbackSlide = index + 1;
      return Math.max(highestSlide, widgetSlideAssignments[widget.id] ?? fallbackSlide);
    }, 0);
    const totalSlideCount = Math.max(baseSlideCount, highestAssignedSlide);
    const groups = Array.from({ length: totalSlideCount }, (_, index) => ({
      slideNumber: index + 1,
      widgets: [] as DashboardWidget[],
    }));

    selectedWidgets.forEach((widget, index) => {
      const fallbackSlide = index + 1;
      const assignedSlide = Math.min(
        totalSlideCount,
        Math.max(1, widgetSlideAssignments[widget.id] ?? fallbackSlide)
      );
      groups[assignedSlide - 1]?.widgets.push(widget);
    });

    return groups;
  }, [selectedWidgets, widgetSlideAssignments]);

  const previewSlideGroups = useMemo<PreviewSlideGroup[]>(() => {
    let previewSlideNumber = 1;
    const groups: PreviewSlideGroup[] = [];

    if (includeIntroSlide) {
      groups.push({ previewSlideNumber, kind: 'intro', widgets: [] });
      previewSlideNumber += 1;
    }

    slideGroups.forEach((slide) => {
      groups.push({
        previewSlideNumber,
        kind: 'content',
        contentSlideNumber: slide.slideNumber,
        widgets: slide.widgets,
      });
      previewSlideNumber += 1;
    });

    if (includeOutroSlide) {
      groups.push({ previewSlideNumber, kind: 'outro', widgets: [] });
    }

    return groups;
  }, [includeIntroSlide, includeOutroSlide, slideGroups]);

  function resetExportFlow() {
    setCurrentStep('widgets');
    setWidgetSearch('');
    setSelectedWidgetIds(WIDGETS.map((widget) => widget.id));
    setWidgetSlideAssignments(
      createDefaultWidgetSlideAssignments(
        WIDGETS.map((widget) => widget.id),
        1
      )
    );
    setIncludeIntroSlide(false);
    setIncludeOutroSlide(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) resetExportFlow();
  }

  function getWidgetSlideNumber(widgetId: string) {
    const widgetIndex = selectedWidgetIds.indexOf(widgetId);
    const fallbackSlide = widgetIndex === -1 ? 1 : widgetIndex + 1;

    return Math.min(
      Math.max(1, slideGroups.length),
      Math.max(1, widgetSlideAssignments[widgetId] ?? fallbackSlide)
    );
  }

  function getNextAvailableSlideNumber() {
    const availableSlide = slideGroups.find((slide) => slide.widgets.length === 0);
    return availableSlide?.slideNumber ?? Math.max(1, slideGroups.length + 1);
  }

  function getSlideSelectOptions(widgetId: string): SlideSelectOption[] {
    const currentSlideNumber = getWidgetSlideNumber(widgetId);

    return slideGroups.map((slide) => {
      const widgetCountWithoutCurrent = slide.widgets.filter(
        (widget) => widget.id !== widgetId
      ).length;
      const isCurrentSlide = slide.slideNumber === currentSlideNumber;
      const hasSpace = widgetCountWithoutCurrent === 0;

      return {
        value: String(slide.slideNumber),
        label: `Slide ${slide.slideNumber}`,
        disabled: !isCurrentSlide && !hasSpace,
      };
    });
  }

  function toggleWidget(widgetId: string) {
    if (selectedWidgetIds.includes(widgetId)) {
      setSelectedWidgetIds((currentSelection) =>
        currentSelection.filter((id) => id !== widgetId)
      );
      setWidgetSlideAssignments((currentAssignments) => {
        const remainingAssignments = { ...currentAssignments };
        delete remainingAssignments[widgetId];
        return remainingAssignments;
      });
      return;
    }

    setSelectedWidgetIds((currentSelection) => [...currentSelection, widgetId]);
    setWidgetSlideAssignments((currentAssignments) => ({
      ...currentAssignments,
      [widgetId]: getNextAvailableSlideNumber(),
    }));
  }

  function changeWidgetSlide(
    widgetId: string,
    option: SlideSelectOption | SlideSelectOption[]
  ) {
    if (Array.isArray(option)) return;

    const parsedValue = Number.parseInt(option.value, 10);
    if (!selectedWidgetIds.includes(widgetId) || option.disabled || Number.isNaN(parsedValue)) {
      return;
    }

    const targetSlideNumber = Math.min(Math.max(1, slideGroups.length), Math.max(1, parsedValue));
    const currentSlideNumber = getWidgetSlideNumber(widgetId);
    const targetSlide = slideGroups[targetSlideNumber - 1];
    const targetWidgetCount =
      targetSlide?.widgets.filter((widget) => widget.id !== widgetId).length ?? 0;

    if (targetSlideNumber !== currentSlideNumber && targetWidgetCount >= 1) {
      showToast({
        message: `Slide ${targetSlideNumber} already has a widget.`,
        variant: 'error',
        duration: 3000,
        position: 'top',
      });
      return;
    }

    setWidgetSlideAssignments((currentAssignments) => ({
      ...currentAssignments,
      [widgetId]: targetSlideNumber,
    }));
  }

  async function handleExportPowerPoint() {
    setIsPowerPointExporting(true);

    try {
      const pptBlob = await createPowerPointBlob(
        previewSlideGroups,
        designTypography.fontFamily.label,
        dashboardName
      );
      downloadBlob(pptBlob, getSafeFilename(dashboardName));
      onOpenChange(false);
      resetExportFlow();
    } catch {
      showToast({
        message: 'PowerPoint export could not be generated. Please try again.',
        variant: 'error',
        duration: 3000,
        position: 'top',
      });
    } finally {
      setIsPowerPointExporting(false);
    }
  }

  const widgetColumns: IWuTableColumnDef<DashboardWidget>[] = [
    {
      accessorKey: 'selected',
      header: '',
      size: 56,
      cellAlign: 'center',
      cell: ({ row }) => (
        <WuCheckbox
          checked={selectedWidgetIds.includes(row.original.id)}
          onChange={() => toggleWidget(row.original.id)}
          aria-label={`Select ${row.original.name}`}
        />
      ),
    },
    {
      accessorKey: 'name',
      header: () => (
        <span className="inline-flex items-center font-semibold">
          Widget
          <SortIcon />
        </span>
      ),
      filterable: true,
      size: 204,
      cell: ({ row }) => (
        <WuTooltip content={row.original.name} position="top" showArrow>
          <span className="block max-w-[188px] truncate font-medium text-[#253449]">
            {row.original.name}
          </span>
        </WuTooltip>
      ),
    },
    {
      accessorKey: 'source',
      header: () => (
        <span className="inline-flex items-center font-semibold">
          Source
          <SortIcon />
        </span>
      ),
      filterable: true,
      size: 148,
      cell: () => (
        <span title={WIDGET_DATA_SOURCE} className="block max-w-[132px] truncate text-[#566173]">
          {WIDGET_DATA_SOURCE}
        </span>
      ),
    },
    {
      accessorKey: 'type',
      header: () => (
        <span className="inline-flex items-center font-semibold">
          Type
          <SortIcon />
        </span>
      ),
      filterable: true,
      size: 72,
      cell: ({ row }) => row.original.type,
    },
    {
      accessorKey: 'slide',
      header: () => (
        <span className="inline-flex items-center font-semibold">
          Slide
          <SortIcon />
        </span>
      ),
      size: 96,
      cell: ({ row }) => {
        const isSelected = selectedWidgetIds.includes(row.original.id);

        if (!isSelected) return <span className="text-[#9aa5b4]">-</span>;

        const currentSlideNumber = getWidgetSlideNumber(row.original.id);
        const selectedSlideOption = getSlideSelectOptions(row.original.id).find(
          (option) => option.value === String(currentSlideNumber)
        );

        return (
          <WuSelect
            data={getSlideSelectOptions(row.original.id)}
            accessorKey={{ value: 'value', label: 'label' }}
            value={selectedSlideOption ?? null}
            onSelect={(option) =>
              changeWidgetSlide(row.original.id, option as SlideSelectOption | SlideSelectOption[])
            }
            variant="outlined"
            aria-label={`Slide for ${row.original.name}`}
            CustomTrigger={
              <span className="flex w-[74px] items-center justify-between gap-1 text-[12px] font-medium text-[#253449]">
                <span className="truncate">Slide {currentSlideNumber}</span>
                <span
                  className="wm-keyboard-arrow-down shrink-0 text-[16px] text-[#687385]"
                  aria-hidden="true"
                />
              </span>
            }
            className="h-8 w-[82px] !rounded-none !border-0 !bg-transparent !p-0 text-[12px] text-[#1f2a44] !shadow-none [&_.wm-arrow-drop-down]:hidden [&_button]:!border-0 [&_button]:!bg-transparent [&_button]:!p-0 [&_button]:!shadow-none"
            maxHeight={180}
            maxContentWidth="120px"
          />
        );
      },
    },
  ];

  return (
    <WuModal
      open={open}
      onOpenChange={handleOpenChange}
      maxWidth="900px"
      maxHeight="calc(100vh - 48px)"
      className={styles.modal}
    >
      <WuModalHeader className="h-[64px] bg-[#eef6ff] px-6">
        <span className="text-[24px] font-medium leading-none text-[#17358f]">
          PowerPoint export
        </span>
      </WuModalHeader>

      <WuModalContent className="h-[calc(100vh-210px)] max-h-[560px] overflow-hidden px-6 py-6">
        <div className="mx-auto flex h-full w-full max-w-[800px] flex-col">
          <div className="mb-6 flex items-start justify-between gap-8">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1e63d7]">
                Step {currentStep === 'widgets' ? 1 : 2} of 2
              </p>
              <h3 className="mt-1 text-[18px] font-semibold text-[#1f2a44]">
                {currentStep === 'widgets' ? 'Select widgets' : 'Export options'}
              </h3>
              <p className="mt-1 text-[13px] text-[#687385]">
                {currentStep === 'widgets'
                  ? 'Choose the dashboard widgets to include in the presentation.'
                  : 'Choose optional bookend slides, then export your presentation.'}
              </p>
            </div>
            <div className="flex w-28 shrink-0 gap-2 pt-2" aria-label="Export progress">
              <span className="h-1.5 flex-1 rounded-full bg-[#1e88e5]" />
              <span
                className={`h-1.5 flex-1 rounded-full ${
                  currentStep === 'options' ? 'bg-[#1e88e5]' : 'bg-[#dbe3f0]'
                }`}
              />
            </div>
          </div>

          {currentStep === 'widgets' ? (
            <section className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] font-medium text-[#566173]">
                  Dashboard widgets
                </span>
                <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-[12px] font-medium text-[#1e63d7]">
                  {selectedWidgets.length}/{WIDGETS.length} selected
                </span>
              </div>

              <WuInput
                variant="outlined"
                placeholder="Search widgets"
                aria-label="Search widgets"
                Icon={<span className="wm-search text-[14px]" aria-hidden="true" />}
                iconPosition="left"
                value={widgetSearch}
                onChange={(event) => setWidgetSearch(event.target.value)}
                className="mt-4 h-10 w-full rounded-lg text-[13px]"
              />

              <div className="mt-4 min-h-0 flex-1 overflow-hidden overflow-y-auto rounded-sm border border-[#e1e5ec] [&_.wu-table-container>div]:overflow-x-hidden [&_table]:w-full [&_table]:table-fixed [&_table]:text-[12px]">
                <WuTable
                  data={filteredWidgets as unknown[]}
                  columns={widgetColumns as unknown as IWuTableColumnDef<unknown>[]}
                  variant="bordered"
                  size="compact"
                  sort={{ enabled: true }}
                  tableLayout="fixed"
                  NoDataContent="No widgets match your search."
                />
              </div>
            </section>
          ) : (
            <section className="mx-auto w-full max-w-[640px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-5 rounded-lg border border-[#dbe3f0] bg-white p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#eef6ff] text-[#1e63d7]">
                      <span className="wm-slideshow text-[19px]" aria-hidden="true" />
                    </span>
                    <div>
                      <h4 className="text-[14px] font-semibold text-[#1f2a44]">
                        Intro slide
                      </h4>
                      <p className="mt-1 text-[12px] leading-5 text-[#687385]">
                        Add a title slide for {dashboardName}.
                      </p>
                    </div>
                  </div>
                  <WuToggle
                    checked={includeIntroSlide}
                    onChange={setIncludeIntroSlide}
                    aria-label="Include intro slide"
                  />
                </div>

                <div className="flex items-center justify-between gap-5 rounded-lg border border-[#dbe3f0] bg-white p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#eef6ff] text-[#1e63d7]">
                      <span className="wm-flag text-[19px]" aria-hidden="true" />
                    </span>
                    <div>
                      <h4 className="text-[14px] font-semibold text-[#1f2a44]">
                        Outro slide
                      </h4>
                      <p className="mt-1 text-[12px] leading-5 text-[#687385]">
                        Add a closing thank-you slide.
                      </p>
                    </div>
                  </div>
                  <WuToggle
                    checked={includeOutroSlide}
                    onChange={setIncludeOutroSlide}
                    aria-label="Include outro slide"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-lg bg-[#f5f9ff] px-4 py-3 text-[13px] text-[#536277]">
                <span className="wm-info text-[16px] text-[#1e63d7]" aria-hidden="true" />
                <span>
                  {selectedWidgets.length} widget{selectedWidgets.length === 1 ? '' : 's'} ·{' '}
                  {previewSlideGroups.length} slide
                  {previewSlideGroups.length === 1 ? '' : 's'} in the export
                </span>
              </div>
            </section>
          )}
        </div>
      </WuModalContent>

      <WuModalFooter className="flex h-16 items-center justify-between border-t border-[#d3dcff] px-6">
        {currentStep === 'options' ? (
          <WuButton
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setCurrentStep('widgets')}
          >
            Back
          </WuButton>
        ) : (
          <span />
        )}

        {currentStep === 'widgets' ? (
          <WuButton
            type="button"
            size="md"
            onClick={() => setCurrentStep('options')}
            disabled={selectedWidgetIds.length === 0}
            className="min-w-[160px] rounded-[4px] bg-[#1e88e5] px-4 text-[14px] font-normal text-white hover:bg-[#1976d2]"
          >
            Next
          </WuButton>
        ) : (
          <WuButton
            type="button"
            size="md"
            onClick={handleExportPowerPoint}
            disabled={isPowerPointExporting || selectedWidgetIds.length === 0}
            className="min-w-[160px] rounded-[4px] bg-[#1e88e5] px-4 text-[14px] font-normal text-white hover:bg-[#1976d2]"
          >
            {isPowerPointExporting ? 'Exporting...' : 'Export'}
          </WuButton>
        )}
      </WuModalFooter>
    </WuModal>
  );
}
