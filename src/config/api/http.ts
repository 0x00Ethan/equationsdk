import axios from "axios"
import qs from "qs"
import { CONFIG } from "../index";
import { toCamelCase } from "../../utils"
/**
 * HTTP service instance for making API requests.
 */
const service = axios.create({
    baseURL: CONFIG.ApiURL,
    timeout: 100000,
});

service.interceptors.request.use(function (config) {
    return config;
}, function (error) {
    return Promise.reject(error);
});

service.interceptors.response.use(
    (res) => {
        return res
    },
    (error) => {
        return Promise.reject(error)
    }
)

/**
 * Sends a GET request to the specified URL with optional query parameters.
 * @param {string} url - The URL to send the GET request to.
 * @param {object} obj - Optional query parameters as an object.
 * @returns {Promise<any>} - A promise that resolves with the response data or rejects with an error.
 */
export const get = function (url: string, obj?: object) {
    return new Promise((resolve, reject) => {
        service.get(url, obj)
            .then(res => {
                resolve(toCamelCase(res))
            }).catch(err => {
                reject(err)
            })
    })
}

/**
 * Sends a POST request to the specified URL with the given parameters.
 * @param {string} url - The URL to send the request to.
 * @param {object} params - The parameters to include in the request.
 * @returns {Promise<any>} - A promise that resolves with the response data or rejects with an error.
 */
export const post = function (url, params) {
    return new Promise((resolve, reject) => {
        service.post(url, { ...params })
            .then(res => {
                resolve(toCamelCase(res))
            })
            .catch(err => {
                reject(err)
            })
    })
}

/**
 * Sends a POST request to the specified URL with the given parameters in form data format.
 * @param {string} url - The URL to send the request to.
 * @param {object} params - The parameters to include in the request.
 * @returns {Promise<any>} - A promise that resolves with the response data or rejects with an error.
 */
export const postFromData = function (url, params) {
    return new Promise((resolve, reject) => {
        service.post(url, qs.stringify({ ...params }))
            .then(res => {
                resolve(toCamelCase(res))
            })
            .catch(err => {
                reject(err)
            })
    })
}



