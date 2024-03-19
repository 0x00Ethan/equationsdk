export function catchFn<T, U>(func: () => T, defaultValue: U): T | U {
	try {
		const result = func();
		return result;
	} catch (error) {
		return defaultValue;
	}
}
