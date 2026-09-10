/** Location subscribers can mount the next dialog before unmounting the previous one. */
const locks = new WeakMap<Document, { count: number; overflow: string; padding: string }>();
export function lockModalScroll(document: Document) {
  const body = document.body;
  let lock = locks.get(document);
  if (!lock) {
    lock = { count: 0, overflow: body.style.overflow, padding: body.style.paddingRight };
    locks.set(document, lock);
    const view = document.defaultView!;
    const gutter = view.innerWidth - document.documentElement.clientWidth;
    if (gutter > 0) body.style.paddingRight = `${parseFloat(view.getComputedStyle(body).paddingRight || "0") + gutter}px`;
    body.style.overflow = "hidden";
  }
  lock.count++;
  return () => {
    if (--lock.count === 0) {
      body.style.overflow = lock.overflow;
      body.style.paddingRight = lock.padding;
      locks.delete(document);
    }
  };
}
