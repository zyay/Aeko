declare module "*.avatar.json" {
  const value: {
    expressions: Record<string, unknown>;
    animations: Record<string, unknown>;
  };
  export default value;
}
