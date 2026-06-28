const { composePlugins, withNx } = require('@nx/webpack');

// Optional NestJS peer dependencies are referenced dynamically by the
// framework (including subpaths like '@nestjs/microservices/microservices-module'
// and 'class-transformer/storage') but not all are installed — this app uses
// Fastify + Zod, not Express / class-validator. Mark the packages (and any
// subpath) external so webpack leaves them as runtime require() calls instead
// of failing to bundle them. The production image ships node_modules, so any
// that ARE installed resolve at runtime; the rest are only require'd on code
// paths this app never executes.
const externalPackages = [
  '@nestjs/microservices',
  '@nestjs/websockets',
  '@nestjs/platform-express',
  'class-transformer',
  'class-validator',
  '@fastify/static',
  '@fastify/view',
];

function isExternal(request) {
  if (typeof request !== 'string') return false;
  return externalPackages.some(
    (pkg) => request === pkg || request.startsWith(pkg + '/'),
  );
}

module.exports = composePlugins(withNx(), (config) => {
  return {
    ...config,
    target: 'node',
    externals: [
      ({ request }, callback) => {
        if (isExternal(request)) {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      },
      ...(Array.isArray(config.externals)
        ? config.externals
        : config.externals
          ? [config.externals]
          : []),
    ],
  };
});
