import { promises as fs } from 'fs';

import { Jimp, ResizeStrategy } from 'jimp';
import sanjuuni from 'sanjuuni';

const PALETTE_PATTERN = /^(?:(?:#?[0-9A-F]{6}|X)\,){15}(?:#?[0-9A-F]{6}|X)$/

const defaultPalette = [
  { r: 0xf0, g: 0xf0, b: 0xf0 },
  { r: 0x33, g: 0xb2, b: 0xf2 },
  { r: 0xd8, g: 0x7f, b: 0xe5 },
  { r: 0xf2, g: 0xb2, b: 0x99 },
  { r: 0x6c, g: 0xde, b: 0xde },
  { r: 0x19, g: 0xcc, b: 0x7f },
  { r: 0xcc, g: 0xb2, b: 0xf2 },
  { r: 0x4c, g: 0x4c, b: 0x4c },
  { r: 0x99, g: 0x99, b: 0x99 },
  { r: 0xb2, g: 0x99, b: 0x4c },
  { r: 0xe5, g: 0x66, b: 0xb2 },
  { r: 0xcc, g: 0x66, b: 0x33 },
  { r: 0x4c, g: 0x66, b: 0x7f },
  { r: 0x4e, g: 0xa6, b: 0x57 },
  { r: 0x4c, g: 0x4c, b: 0xcc },
  { r: 0x11, g: 0x11, b: 0x11 }
];

export const handler = async (event, context) => {
    const rawPath = event.rawPath || '';

    const [match, optionsString, url] = rawPath.match(/^(\/.+)?\/(https?:\/\/.+)$/);

    console.log(match, optionsString, url);

    if (match) {
        let options = {
            width: null,
            height: null,
            dithering: 'none',
            cc_palette: false,
            format: 'bimg',
            palette: null
        };

        if (optionsString) {
            for (const option of optionsString.replaceAll('/', '').split(':')) {

                // dimensions
                if (/^\d+(x\d+)?$/.test(option)) {
                    const dimensions = option.split('x');
                    
                    options.width = parseInt(dimensions[0]);
                    options.height = parseInt(dimensions.length === 1 ? dimensions[0] : dimensions[1]);
                }
                
                // dithering
                else if (option[0] === 'D') {
                    const dithering = option.slice(1);

                    if (!['ordered', 'threshold', 'lab-color', 'octree', 'kmeans', 'none'].includes(dithering)) {
                        return { statusCode: 400, body: `Invalid dithering option: ${dithering}` };
                    }

                    options.dithering = dithering;
                }

                // cc_palette
                else if (option === 'p') {
                    options.cc_palette = true;
                }

                // format
                else if (option[0] === 'F') {
                    const fmt = option.slice(1);

                    if (!['bimg', 'nfp', 'lua'].includes(fmt)) {
                        return { statusCode: 400, body: `Invalid format option: ${fmt}` };
                    }

                    options.format = fmt;
                }

                // palette
                else if (option[0] === 'P') {
                    const palette = option.slice(1);

                    if (!PALETTE_PATTERN.test(palette)) {
                        return { statusCode: 400, body: 'Invalid palette format' };
                    }

                    options.palette = palette;
                }
            }
        }

        const imgurl = `${url}${event.rawQueryString ? '?' + event.rawQueryString : ''}`;

        const jimpimg = await Jimp.read(imgurl);
        // const jimpimg = await Jimp.read('images/color_bars_16.png');

        if (options.width) {
            jimpimg.resize({ w: options.width, h: options.height });
        }

        const width = jimpimg.bitmap.width;
        const height = jimpimg.bitmap.height;

        let labImg = sanjuuni.makeRGBImage(jimpimg.bitmap.data, width, height, 'rgba');
        let chosenPalette = null;
        let indexedImg = null;

        // TODO lab palette opt-out, or offer option to replace pure white (#FFFFFF)
        
        if (options.cc_palette) {
            chosenPalette = defaultPalette;
        } else {
            labImg = sanjuuni.makeLabImage(labImg);

            if (options.dithering === 'octree') {
                chosenPalette = sanjuuni.reducePalette_octree(labImg, 16);
            } else if (options.dithering === 'kmeans') {
                chosenPalette = sanjuuni.reducePalette_kMeans(labImg, 16);
            } else {
                chosenPalette = sanjuuni.reducePalette_medianCut(labImg, 16);
            }
        }

        if (options.dithering === 'threshold') {
            indexedImg = sanjuuni.thresholdImage(labImg, chosenPalette);
        } else if (options.dithering === 'ordered') {
            indexedImg = sanjuuni.ditherImage_ordered(labImg, chosenPalette);
        } else {
            indexedImg = sanjuuni.ditherImage_floydSteinberg(labImg, chosenPalette);
        }

        if (!options.cc_palette) {
            chosenPalette = sanjuuni.convertLabPalette(chosenPalette);
        }

        let body, headers = {};

        if (options.format === 'nfp') {
            body = sanjuuni.makeNFP(indexedImg, chosenPalette, false, true);

            headers = { 'Content-Type': 'image/vnd.cc.nfp' };
        } else if (options.format === 'lua') {
            // TODO add support for passing deployment domain as argument to Docker build
            body = '-- Processed via imgon-cc\n-- https://imgon.cyberbit.dev\n' +
                sanjuuni.makeLuaFile(indexedImg, chosenPalette, false, true);

            headers = { 'Content-Type': 'text/x-lua' };
        } else if (options.format === 'bimg') {
            const frame = sanjuuni.makeTable(indexedImg, chosenPalette, false, true);

            body = `{
                ${frame},
                creator = 'sanjuuni',
                version = '1.0.0',
                secondsPerFrame = 0.04,
                animation = false,
                date = '${new Date().toISOString()}',
                title = 'imgon-cc'
            }`;

            headers = { 'Content-Type': 'text/x-lua' };
        }

        return {
            statusCode: 200,
            headers,
            body,
        };
    } else {
        // return { statusCode: 400, body: 'Invalid path format' };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'hello world',
        }),
    };
};