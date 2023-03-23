
import ColorConverter from 'cie-rgb-color-converter';
import { GroupAction, LightsState } from './deconz.model';
import colorspace from 'color-space';
import { HomieRGBColor, HomieXYBriColor } from 'node-homie5/model';


export function round2(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100
}

export function adjustRGB(rgb: HomieRGBColor): HomieRGBColor {
    const factor = 255 / (Math.max(rgb.r, rgb.g, rgb.b));
    return {
        r: Math.ceil(rgb.r * factor),
        g: Math.ceil(rgb.g * factor),
        b: Math.ceil(rgb.b * factor),
    }
}

export function xyBriToRgb(xy: HomieXYBriColor): HomieRGBColor {
    const rgb = colorspace.xyy.rgb([xy.x, xy.y, Math.ceil(xy.bri / 255 * 100)]);
    return adjustRGB({ r: Math.round(rgb[0]), g: Math.round(rgb[1]), b: Math.round(rgb[2]) });
}

export function getRGBFromLightState(state: LightsState | GroupAction): HomieRGBColor {
    if (state?.xy === undefined || state.bri === undefined) { return null; }
    return xyBriToRgb({ x: round2(state.xy[0]), y: round2(state.xy[1]), bri: state.bri });
}

export function rgbToXY(rgb: HomieRGBColor): [number, number] {
    const xy = ColorConverter.rgbToXy(rgb.r, rgb.g, rgb.b);
    return [xy.x, xy.y]
}

export function rgbToXYBri(rgb: HomieRGBColor): [number, number, number] {
    const xyy = colorspace.rgb.xyy([rgb.r, rgb.g, rgb.b]);
    return [round2(xyy[0]), round2(xyy[1]), Math.round(xyy[2] * 255 / 100)]

}

