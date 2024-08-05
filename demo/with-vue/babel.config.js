module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          esmodules: true,
        },
      },
    ],
  ],
  include: ["src", "node_modules/@worldcoin/idkit-core"],
};
