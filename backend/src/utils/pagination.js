// Reproduces the shape of Spring Data's Page<T> JSON serialization, since the
// frontend reads `res.data.content` / `res.data.totalPages` directly.
function toPage(content, totalElements, page, size) {
  const totalPages = size > 0 ? Math.ceil(totalElements / size) : 0;
  return {
    content,
    totalElements,
    totalPages,
    size,
    number: page,
    numberOfElements: content.length,
    first: page === 0,
    last: page >= totalPages - 1,
    empty: content.length === 0,
  };
}

module.exports = { toPage };
