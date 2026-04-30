const getPagination = (query) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
  const safeLimit = Number.isNaN(limit) ? 20 : Math.min(Math.max(limit, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  return { page: safePage, limit: safeLimit, skip };
};

module.exports = {
  getPagination,
};
