/** Metro resolves .ttf imports to an asset handle; TypeScript needs telling. */
declare module "*.ttf" {
  const asset: number;
  export default asset;
}
