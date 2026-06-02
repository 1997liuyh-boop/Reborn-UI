export default defineEventHandler((event) => {
  throw createError({
    statusCode: 404,
    statusMessage: `API Route Not Found: ${event.path}`,
  });
});
