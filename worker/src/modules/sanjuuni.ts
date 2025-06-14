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

export function luaToJSON(input: string): any {
  return parse(input)
}