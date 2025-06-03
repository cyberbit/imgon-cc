# imgon-cc

Imgon is a deployment of [sanjuuni](https://github.com/MCJack123/sanjuuni) for the general public, offering conversion of online images to ComputerCraft formats before download, via URL prepending. It uses bindings from [node-sanjuuni](https://github.com/MCJack123/node-sanjuuni) and some API inspiration from [sanjuuni-server](https://github.com/SkyTheCodeMaster/sanjuuni-server) (though the interface has been overhauled, and it is not a dependency).

The `lambda` folder defines a Docker container that runs node-sanjuuni in an AWS Lambda compatibility layer.

The `worker` folder defines a Cloudflare Worker that proxies requests to the AWS Lambda function.

## Usage

```
https://imgon.cyberbit.dev/{options?}/{url}
```

Simply prepend your image url with `https://imgon.cyberbit.dev/` and your preferred options and you get a CC-compatible image back. URL subject to change. Continue reading for additional options.

## Options (separated by `:`)

### Dimensions: `{width} | {width}x{height}`

Height is optional. When height is not specified, result is Width square. Recommend 640x480 or smaller for best performance.

### Dithering: `D(ordered | threshold | octree | kmeans)`

CC palette can only use `ordered` and `threshold`

### Format: `F(bimg | nfp | lua)`

BIMG is default, and is in sanjuuni format (single-frame BIMG file). `lua` can be downloaded and run with `wget run {imgon URL}` to display a BIMG in the active window.

### Use default CC palette: `p`

### Use custom palette: NYI

## Example
To convert and download `https://example.com/picture.png`:
```bash
wget https://imgon.cyberbit.dev/128x128/https://example.com/picture.png picture.lua
```
`128x128` is your desired width and height. To convert it with k-means dithering enabled, use `128x128:Dkmeans`.

To immediately display in the active window:

```bash
wget run https://imgon.cyberbit.dev/128x128:Dkmeans:Flua/https://example.com/picture.png
```

## Issues
Performance can vary. The first convert in a while (globally) can take several seconds while it boots the software. If images are too large, they will timeout the service. Keep image outputs to 640x480 and smaller to have decent stability. Large input images will also take longer to download and resize, regardless of the output options.

## WHERES THE CODE AHHHH CLOSED SOURCE = EVIL
You are literally looking at the source. This is a public repository. _Please_ drink some water.