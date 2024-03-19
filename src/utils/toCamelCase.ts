/**
 * Converts an object or an array of objects to camel case.
 * @param obj - The object or array of objects to convert.
 * @returns The converted object or array of objects in camel case.
 */
export function toCamelCase(obj: any) {
    let result = obj;
    if (!result) {
        return result;
    } else if (typeof obj === 'object') {
        if (obj instanceof Array) {
            result = obj.map(toCamelCase);
        } else {
            result = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const newKey = key.replace(/(_\w)/g, k => k[1].toUpperCase());
                    result[newKey] = toCamelCase(obj[key]);
                }
            }
        }
    }
    return result;
}