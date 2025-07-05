import { format, parse } from 'lua-json'

export enum DitheringOption {
  Ordered = 'ordered',
  Threshold = 'threshold',
  LabColor = 'lab-color',
  Octree = 'octree',
  KMeans = 'kmeans',
  None = 'none'
}

export enum FormatOption {
  Bimg = 'bimg',
  Nfp = 'nfp',
  Lua = 'lua'
}

export const defaultPalette: PaletteColor[] = [
	{ r: 0xf0, g: 0xf0, b: 0xf0, style: 'rgb(240,240,240)' },
	{ r: 0x33, g: 0xb2, b: 0xf2, style: 'rgb(51,178,242)' },
	{ r: 0xd8, g: 0x7f, b: 0xe5, style: 'rgb(216,127,229)' },
	{ r: 0xf2, g: 0xb2, b: 0x99, style: 'rgb(242,178,153)' },
	{ r: 0x6c, g: 0xde, b: 0xde, style: 'rgb(108,222,222)' },
	{ r: 0x19, g: 0xcc, b: 0x7f, style: 'rgb(25,204,127)' },
	{ r: 0xcc, g: 0xb2, b: 0xf2, style: 'rgb(204,178,242)' },
	{ r: 0x4c, g: 0x4c, b: 0x4c, style: 'rgb(76,76,76)' },
	{ r: 0x99, g: 0x99, b: 0x99, style: 'rgb(153,153,153)' },
	{ r: 0xb2, g: 0x99, b: 0x4c, style: 'rgb(178,153,76)' },
	{ r: 0xe5, g: 0x66, b: 0xb2, style: 'rgb(229,102,178)' },
	{ r: 0xcc, g: 0x66, b: 0x33, style: 'rgb(204,102,51)' },
	{ r: 0x4c, g: 0x66, b: 0x7f, style: 'rgb(76,102,127)' },
	{ r: 0x4e, g: 0xa6, b: 0x57, style: 'rgb(78,166,87)' },
	{ r: 0x4c, g: 0x4c, b: 0xcc, style: 'rgb(76,76,204)' },
	{ r: 0x11, g: 0x11, b: 0x11, style: 'rgb(17,17,17)' }
];

export function luaToJSON(input: string): any {
  return parse(input)
}

/**
 * CraftOS-PC Raw Mode Packet Parser for Web Browser
 * Parses rawmode packets and returns structured JSON data
 */

interface RawmodeParseResult {
	// isValid: boolean;
	// error: string | null;
	// magic: string | null;
	// format: 'standard' | 'large' | null;
	// payloadSize: number;
	// payload: string | null;
	// decodedPayload: {
	// 	data: string;
	// 	size: number;
	// } | null;
	packetType: number | null;
	// windowId: number | null;
	terminalData: TerminalData | null;
	// crc32: string | null;
	// lineEnding: 'CRLF' | 'LF' | string | null;
	// rawData: {
	// 	hex: string;
	// 	size: number;
	// };
}

interface TerminalData {
	graphicsMode: number;
	// cursorBlinking: number;
	width: number;
	height: number;
	// cursorX: number;
	// cursorY: number;
	// grayscale: boolean;
	// reserved: number[];
	textData: TextData | null;
	colorData: ColorData | null;
	pixelData: PixelData | null;
	palette: PaletteData | null;
}

interface TextData {
	raw: string;
	encoded: string;
	rows: TerminalRow[];
	fullText: string;
	canvasData: number[];
}

interface TerminalRow {
	index: number;
	raw: string;
	encoded: string;
	length: number;
}

interface ColorData {
	raw: string;
	bytes: number;
	canvasData: number[];
	// preview: ColorPreview[];
}

// interface ColorPreview {
// 	index: number;
// 	value: number;
// 	hex: string;
// 	background: number;
// 	foreground: number;
// }

interface PixelData {
	raw: string;
	bytes: number;
	expected: number;
}

interface PaletteData {
	mode: number;
	colors: PaletteColor[];
	isComplete: boolean;
	expectedBytes: number;
	actualBytes: number;
}

interface PaletteColor {
	index?: number;
	r: number;
	g: number;
	b: number;
	hex?: string;
	style?: string;
}

interface RLEResult {
	text: string;
	nextOffset: number;
}

export function parseRawmodePacket(packetData: ArrayBuffer): RawmodeParseResult {
	const result: RawmodeParseResult = {
		// isValid: false,
		// error: null,
		// magic: null,
		// format: null,
		// payloadSize: 0,
		// payload: null,
		// decodedPayload: null,
		packetType: null,
		// windowId: null,
		terminalData: null,
		// crc32: null,
		// lineEnding: null,
		// rawData: {
		// 	hex: arrayBufferToHex(packetData),
		// 	size: packetData.byteLength
		// }
	};

	try {
		const view = new DataView(packetData);
		let offset = 0;

		// Read magic number (4 bytes)
		const magicBytes = new Uint8Array(packetData, offset, 4);
		const magic = String.fromCharCode(...magicBytes);
		// result.magic = magic;
		offset += 4;

		if (magic !== '!CPC' && magic !== '!CPD') {
			throw new Error('Invalid magic number: ' + magic);
			// result.error = 'Invalid magic number: ' + magic;
			// return result;
		}

		// result.format = magic === '!CPC' ? 'standard' : 'large';
		const isLargeFormat = magic === '!CPD';

		// Read size field (4 or 12 bytes)
		const sizeBytes = isLargeFormat ? 12 : 4;
		const sizeHexBytes = new Uint8Array(packetData, offset, sizeBytes);
		const sizeHex = String.fromCharCode(...sizeHexBytes);
		const payloadSize = parseHexString(sizeHex);
		// result.payloadSize = payloadSize;
		offset += sizeBytes;

		// Read Base64 payload
		if (payloadSize > 0) {
			const payloadBytes = new Uint8Array(packetData, offset, payloadSize);
			const payload = String.fromCharCode(...payloadBytes);
			// result.payload = payload;
			offset += payloadSize;

			// Decode Base64 payload
			// try {
				const decodedPayload = atob(payload);
				// result.decodedPayload = {
				// 	data: decodedPayload,
				// 	size: decodedPayload.length
				// };

				// Parse packet header
				if (decodedPayload.length >= 2) {
					result.packetType = decodedPayload.charCodeAt(0);
					// result.windowId = decodedPayload.charCodeAt(1);

					// Parse Type 0 (Terminal contents) packets
					if (result.packetType === 0 && decodedPayload.length >= 16) {
						result.terminalData = parseTerminalData(decodedPayload);
					}
				}
			// } catch (e: unknown) {
			// 	result.error = 'Failed to decode Base64 payload: ' + (e instanceof Error ? e.message : String(e));
			// }
		}

		// Read CRC32 checksum (8 bytes)
		if (offset + 8 <= packetData.byteLength) {
			// const crc32Bytes = new Uint8Array(packetData, offset, 8);
			// result.crc32 = String.fromCharCode(...crc32Bytes);
			offset += 8;
		}

		// Read line ending
		if (offset < packetData.byteLength) {
			const firstByte = view.getUint8(offset);
			if (firstByte === 13 && offset + 1 < packetData.byteLength) { // CRLF
				// result.lineEnding = 'CRLF';
			} else if (firstByte === 10) { // LF
				// result.lineEnding = 'LF';
			} else {
				// result.lineEnding = 'Unknown (' + firstByte + ')';
			}
		}

		// result.isValid = true;
	} catch (e: unknown) {
		throw new Error('Parsing error: ' + (e instanceof Error ? e.message : String(e)));
	}

	return result;
}

function parseTerminalData(decodedPayload: string): TerminalData {
	const terminalData: TerminalData = {
		graphicsMode: decodedPayload.charCodeAt(2),
		// cursorBlinking: decodedPayload.charCodeAt(3),
		width: (decodedPayload.charCodeAt(4) | (decodedPayload.charCodeAt(5) << 8)),
		height: (decodedPayload.charCodeAt(6) | (decodedPayload.charCodeAt(7) << 8)),
		// cursorX: (decodedPayload.charCodeAt(8) | (decodedPayload.charCodeAt(9) << 8)),
		// cursorY: (decodedPayload.charCodeAt(10) | (decodedPayload.charCodeAt(11) << 8)),
		// grayscale: decodedPayload.charCodeAt(12) === 1,
		// reserved: [decodedPayload.charCodeAt(13), decodedPayload.charCodeAt(14), decodedPayload.charCodeAt(15)],
		textData: null,
		colorData: null,
		pixelData: null,
		palette: null
	};

	const { graphicsMode, width, height } = terminalData;

	if (graphicsMode === 0 && decodedPayload.length > 16) {
		// Text mode
		const textResult = decodeRLE(decodedPayload, 16, width * height);
		if (textResult.text.length > 0) {
			terminalData.textData = {
				raw: textResult.text,
				encoded: encodeTerminalText(textResult.text),
				rows: [],
				fullText: encodeTerminalText(textResult.text),
				canvasData: convertTextDataToCanvas(encodeTerminalText(textResult.text))
			};

			// Split into rows
			for (let row = 0; row < height; row++) {
				const start = row * width;
				const end = start + width;
				const rowText = textResult.text.substring(start, end);
				terminalData.textData.rows.push({
					index: row,
					raw: rowText,
					encoded: encodeTerminalText(rowText),
					length: rowText.length
				});
			}
		}

		// Parse color data
		if (textResult.nextOffset < decodedPayload.length) {
			const colorResult = decodeRLE(decodedPayload, textResult.nextOffset, width * height);
			if (colorResult.text.length > 0) {
				terminalData.colorData = {
					raw: colorResult.text,
					bytes: colorResult.text.length,
					canvasData: convertColorDataToCanvas(colorResult.text),
					// preview: getColorPreview(colorResult.text)
				};

				// Parse palette data
				if (colorResult.nextOffset < decodedPayload.length) {
					terminalData.palette = parsePaletteData(decodedPayload, colorResult.nextOffset, graphicsMode);
				}
			}
		}
	} else if ((graphicsMode === 1 || graphicsMode === 2) && decodedPayload.length > 16) {
		// Graphics mode
		const expectedPixelLength = width * height * 54;
		const pixelResult = decodeRLE(decodedPayload, 16, expectedPixelLength);
		
		terminalData.pixelData = {
			raw: pixelResult.text,
			bytes: pixelResult.text.length,
			expected: expectedPixelLength
		};

		// Parse palette data
		if (pixelResult.nextOffset < decodedPayload.length) {
			terminalData.palette = parsePaletteData(decodedPayload, pixelResult.nextOffset, graphicsMode);
		}
	}

	return terminalData;
}

function decodeRLE(data: string, startOffset: number, expectedLength: number): RLEResult {
	let decoded = '';
	let offset = startOffset;
	let decodedCount = 0;
	
	while (offset < data.length - 1 && decodedCount < expectedLength) {
		const char = data.charAt(offset);
		const count = data.charCodeAt(offset + 1);
		
		// Add the character 'count' times
		for (let i = 0; i < count && decodedCount < expectedLength; i++) {
			decoded += char;
			decodedCount++;
		}
		
		offset += 2;
		
		// Break if we've decoded enough
		if (decodedCount >= expectedLength) {
			break;
		}
	}
	
	return {
		text: decoded,
		nextOffset: offset
	};
}

function encodeTerminalText(text: string): string {
	// Encoding table: 0-9, a-z for characters 0x80-0x9F (32 values)
	const encodingTable = '0123456789abcdefghijklmnopqrstuvwxyz';
	let result = '';
	
	for (let i = 0; i < text.length; i++) {
		const charCode = text.charCodeAt(i);
		
		if (charCode === 32) {
			// Space (0x20) -> encode as 0x80 -> '0'
			result += '0';
		} else if (charCode >= 0x80 && charCode <= 0x9F) {
			// Range 0x80-0x9F -> map to encoding table
			const index = charCode - 0x80;
			result += encodingTable[index];
		} else if (charCode >= 32 && charCode <= 126) {
			// Printable ASCII characters (except space) -> keep as-is
			result += text.charAt(i);
		} else {
			// Other non-printable characters -> show as '.'
			result += '.';
		}
	}
	
	return result;
}

function convertTextDataToCanvas(encodedText: string): number[] {
	const result: number[] = [];
	
	for (let i = 0; i < encodedText.length; i++) {
		const char = encodedText.charAt(i);
		let value = 0;
		
		if (char >= '0' && char <= '9') {
			// '0'-'9' maps to 0-9
			value = char.charCodeAt(0) - '0'.charCodeAt(0);
		} else if (char >= 'a' && char <= 'z') {
			// 'a'-'z' maps to 10-35, but we only need up to 32
			value = char.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
			if (value > 32) value = 32; // Cap at 32
		} else {
			// Any other characters (including printable ASCII) map to their position
			// in a 0-32 range, using character code modulo 33
			value = char.charCodeAt(0) % 33;
		}
		
		result.push(value);
	}
	
	return result;
}

function convertColorDataToCanvas(colorText: string): number[] {
	const result: number[] = [];
	
	for (let i = 0; i < colorText.length; i++) {
		const colorByte = colorText.charCodeAt(i);
		
		// Extract background (high nibble) and foreground (low nibble)
		const background = (colorByte >> 4) & 0xF;  // 0-15
		const foreground = colorByte & 0xF;         // 0-15
		
		// Add as pairs: [background, foreground]
		result.push(background, foreground);
	}
	
	return result;
}

function parsePaletteData(data: string, offset: number, graphicsMode: number): PaletteData {
	const palette: PaletteData = {
		mode: graphicsMode,
		colors: [],
		isComplete: false,
		expectedBytes: 0,
		actualBytes: 0
	};

	if (graphicsMode === 0 || graphicsMode === 1) {
		// 16-color palette: 48 bytes
		palette.expectedBytes = 48;
		palette.actualBytes = Math.min(48, data.length - offset);
		palette.isComplete = palette.actualBytes === 48;

		for (let i = 0; i < 16 && offset + (i * 3) + 2 < data.length; i++) {
			const colorOffset = offset + (i * 3);
			const r = data.charCodeAt(colorOffset);
			const g = data.charCodeAt(colorOffset + 1);
			const b = data.charCodeAt(colorOffset + 2);
			
			palette.colors.push({
				index: i,
				r: r,
				g: g,
				b: b,
				hex: '#' + 
					(r < 16 ? '0' : '') + r.toString(16) +
					(g < 16 ? '0' : '') + g.toString(16) +
					(b < 16 ? '0' : '') + b.toString(16),
				style: `rgb(${r}, ${g}, ${b})`
			});
		}
	} else if (graphicsMode === 2) {
		// 256-color palette: 768 bytes
		palette.expectedBytes = 768;
		palette.actualBytes = Math.min(768, data.length - offset);
		palette.isComplete = palette.actualBytes === 768;

		// Parse all 256 colors (or as many as available)
		for (let i = 0; i < 256 && offset + (i * 3) + 2 < data.length; i++) {
			const colorOffset = offset + (i * 3);
			const r = data.charCodeAt(colorOffset);
			const g = data.charCodeAt(colorOffset + 1);
			const b = data.charCodeAt(colorOffset + 2);
			
			palette.colors.push({
				index: i,
				r: r,
				g: g,
				b: b,
				hex: '#' + 
					(r < 16 ? '0' : '') + r.toString(16) +
					(g < 16 ? '0' : '') + g.toString(16) +
					(b < 16 ? '0' : '') + b.toString(16),
				style: `rgb(${r}, ${g}, ${b})`
			});
		}
	}

	return palette;
}

// function getColorPreview(colorText: string): ColorPreview[] {
// 	const preview: ColorPreview[] = [];
// 	const maxPreview = Math.min(colorText.length, 16);
	
// 	for (let i = 0; i < maxPreview; i++) {
// 		const colorByte = colorText.charCodeAt(i);
// 		const hex = colorByte.toString(16);
// 		preview.push({
// 			index: i,
// 			value: colorByte,
// 			hex: (hex.length === 1 ? '0' + hex : hex),
// 			background: (colorByte >> 4) & 0xF,
// 			foreground: colorByte & 0xF
// 		});
// 	}
	
// 	return preview;
// }

function parseHexString(hexString: string): number {
	let result = 0;
	for (let i = 0; i < hexString.length; i++) {
		const char = hexString[i].toLowerCase();
		let value = 0;
		if (char >= '0' && char <= '9') {
			value = char.charCodeAt(0) - '0'.charCodeAt(0);
		} else if (char >= 'a' && char <= 'f') {
			value = char.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
		}
		result = result * 16 + value;
	}
	return result;
}

// function arrayBufferToHex(buffer: ArrayBuffer): string {
// 	const bytes = new Uint8Array(buffer);
// 	let hex = '';
// 	for (let i = 0; i < bytes.length; i++) {
// 		const byte = bytes[i].toString(16);
// 		hex += (byte.length === 1 ? '0' + byte : byte) + ' ';
// 	}
// 	return hex.trim();
// }

export function getPacketTypeDescription(type: number): string {
	const descriptions: Record<number, string> = {
		0: 'Terminal contents',
		1: 'Key event data',
		2: 'Mouse event data',
		3: 'Generic event data',
		4: 'Terminal change',
		5: 'Show message',
		6: 'Version support flags',
		7: 'File request (filesystem extension)',
		8: 'File response (filesystem extension)',
		9: 'File data (filesystem extension)',
		10: 'Speaker sound information'
	};
	return descriptions[type] || 'Unknown packet type';
}


