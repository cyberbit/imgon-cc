export function blit(x: number, y: number, canvas: CanvasRenderingContext2D, data: number, bg: string, fg: string) {
    // each number in data represents a pixel in the sixel format
    // LSB is top left, MSB is bottom right. there are 32 sixel characters in total
    // a 1 in the binary representation means the subpixel is foreground color, a 0 means it is background color

    const fgColor = fg || 'black';
    const bgColor = bg || 'white';
    const bits = data.toString(2).padStart(6, '0').split('').reverse().map(Number);

    const ox = x; // each sixel character represents 2 pixels in width
    const oy = y;

    bits.forEach((bit, index) => {
        const sx = ox + index % 2;
        const sy = oy + index / 2 | 0;

        // console.log(`Drawing pixel at (${sx}, ${sy}) with bit value ${bit}`);

        canvas.fillStyle = bit ? fgColor : bgColor;
        canvas.fillRect(sx, sy, 1, 1);
    });
}