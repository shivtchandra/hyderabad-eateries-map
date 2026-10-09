// Stand-in for "next/cache" inside the Worker. Responses are cached by the
// router (edge cache + shared Firestore cache), so unstable_cache just calls
// through; revalidateTag marks those shared cache entries stale.
export const pendingTags = new Set();
export const unstable_cache = (fn) => fn;
export const revalidateTag = (tag) => { pendingTags.add(tag); };
export const revalidatePath = () => {};
export const unstable_noStore = () => {};
