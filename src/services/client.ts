/* eslint-disable @typescript-eslint/no-explicit-any */
import { initClient } from "@ts-rest/core";
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import axios, { isAxiosError, AxiosError, AxiosHeaders } from "axios";

import type { AppRouter } from "@ts-rest/core";
import type { Method, AxiosResponse, AxiosRequestConfig } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export const flattenAxiosConfigHeaders = (
  config: AxiosRequestConfig
): Record<string, string> => {
  const headers = config.headers;
  if (!headers) {
    return {};
  }
  if (headers instanceof AxiosHeaders) {
    return headers.toJSON() as any;
  }
  const lowerMethod = config.method!.toLowerCase?.() || "get";
  const commonHeaders = headers["common"] || {};
  const methodHeaders = headers[lowerMethod] || {};
  return {
    ...commonHeaders,
    ...methodHeaders,
    ...Object.fromEntries(
      Object.entries(headers).filter(
        ([key]) =>
          !["common", "get", "post", "put", "patch", "delete", "head"].includes(
            key
          )
      )
    ),
  };
};

const apiClient = <T extends AppRouter>(contract: T, token?: string) =>
  initClient(contract, {
    baseUrl,
    baseHeaders: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    api: async ({ path, method, headers, body }) => {
      try {
        const response = await axios.request({
          method: method as Method,
          url: path,
          headers,
          data: body,
        });
        return {
          status: response.status,
          body: response.data,
          headers: new Headers(flattenAxiosConfigHeaders(response.config)),
        };
      } catch (e: Error | AxiosError | any) {
        if (isAxiosError(e)) {
          const response = e.response as AxiosResponse;
          return {
            status: response.status,
            body: response.data,
            headers: new Headers(flattenAxiosConfigHeaders(response.config)),
          };
        }
        throw e;
      }
    },
  });

export default apiClient;
