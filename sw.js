(() => {
  // node_modules/workbox-core/_version.js
  try {
    self["workbox:core:6.5.2"] && _();
  } catch (e) {
  }

  // node_modules/workbox-core/models/messages/messages.js
  var messages = {
    "invalid-value": ({ paramName, validValueDescription, value }) => {
      if (!paramName || !validValueDescription) {
        throw new Error(`Unexpected input to 'invalid-value' error.`);
      }
      return `The '${paramName}' parameter was given a value with an unexpected value. ${validValueDescription} Received a value of ${JSON.stringify(value)}.`;
    },
    "not-an-array": ({ moduleName, className, funcName, paramName }) => {
      if (!moduleName || !className || !funcName || !paramName) {
        throw new Error(`Unexpected input to 'not-an-array' error.`);
      }
      return `The parameter '${paramName}' passed into '${moduleName}.${className}.${funcName}()' must be an array.`;
    },
    "incorrect-type": ({ expectedType, paramName, moduleName, className, funcName }) => {
      if (!expectedType || !paramName || !moduleName || !funcName) {
        throw new Error(`Unexpected input to 'incorrect-type' error.`);
      }
      const classNameStr = className ? `${className}.` : "";
      return `The parameter '${paramName}' passed into '${moduleName}.${classNameStr}${funcName}()' must be of type ${expectedType}.`;
    },
    "incorrect-class": ({ expectedClassName, paramName, moduleName, className, funcName, isReturnValueProblem }) => {
      if (!expectedClassName || !moduleName || !funcName) {
        throw new Error(`Unexpected input to 'incorrect-class' error.`);
      }
      const classNameStr = className ? `${className}.` : "";
      if (isReturnValueProblem) {
        return `The return value from '${moduleName}.${classNameStr}${funcName}()' must be an instance of class ${expectedClassName}.`;
      }
      return `The parameter '${paramName}' passed into '${moduleName}.${classNameStr}${funcName}()' must be an instance of class ${expectedClassName}.`;
    },
    "missing-a-method": ({ expectedMethod, paramName, moduleName, className, funcName }) => {
      if (!expectedMethod || !paramName || !moduleName || !className || !funcName) {
        throw new Error(`Unexpected input to 'missing-a-method' error.`);
      }
      return `${moduleName}.${className}.${funcName}() expected the '${paramName}' parameter to expose a '${expectedMethod}' method.`;
    },
    "add-to-cache-list-unexpected-type": ({ entry }) => {
      return `An unexpected entry was passed to 'workbox-precaching.PrecacheController.addToCacheList()' The entry '${JSON.stringify(entry)}' isn't supported. You must supply an array of strings with one or more characters, objects with a url property or Request objects.`;
    },
    "add-to-cache-list-conflicting-entries": ({ firstEntry, secondEntry }) => {
      if (!firstEntry || !secondEntry) {
        throw new Error(`Unexpected input to 'add-to-cache-list-duplicate-entries' error.`);
      }
      return `Two of the entries passed to 'workbox-precaching.PrecacheController.addToCacheList()' had the URL ${firstEntry} but different revision details. Workbox is unable to cache and version the asset correctly. Please remove one of the entries.`;
    },
    "plugin-error-request-will-fetch": ({ thrownErrorMessage }) => {
      if (!thrownErrorMessage) {
        throw new Error(`Unexpected input to 'plugin-error-request-will-fetch', error.`);
      }
      return `An error was thrown by a plugins 'requestWillFetch()' method. The thrown error message was: '${thrownErrorMessage}'.`;
    },
    "invalid-cache-name": ({ cacheNameId, value }) => {
      if (!cacheNameId) {
        throw new Error(`Expected a 'cacheNameId' for error 'invalid-cache-name'`);
      }
      return `You must provide a name containing at least one character for setCacheDetails({${cacheNameId}: '...'}). Received a value of '${JSON.stringify(value)}'`;
    },
    "unregister-route-but-not-found-with-method": ({ method }) => {
      if (!method) {
        throw new Error(`Unexpected input to 'unregister-route-but-not-found-with-method' error.`);
      }
      return `The route you're trying to unregister was not  previously registered for the method type '${method}'.`;
    },
    "unregister-route-route-not-registered": () => {
      return `The route you're trying to unregister was not previously registered.`;
    },
    "queue-replay-failed": ({ name }) => {
      return `Replaying the background sync queue '${name}' failed.`;
    },
    "duplicate-queue-name": ({ name }) => {
      return `The Queue name '${name}' is already being used. All instances of backgroundSync.Queue must be given unique names.`;
    },
    "expired-test-without-max-age": ({ methodName, paramName }) => {
      return `The '${methodName}()' method can only be used when the '${paramName}' is used in the constructor.`;
    },
    "unsupported-route-type": ({ moduleName, className, funcName, paramName }) => {
      return `The supplied '${paramName}' parameter was an unsupported type. Please check the docs for ${moduleName}.${className}.${funcName} for valid input types.`;
    },
    "not-array-of-class": ({ value, expectedClass, moduleName, className, funcName, paramName }) => {
      return `The supplied '${paramName}' parameter must be an array of '${expectedClass}' objects. Received '${JSON.stringify(value)},'. Please check the call to ${moduleName}.${className}.${funcName}() to fix the issue.`;
    },
    "max-entries-or-age-required": ({ moduleName, className, funcName }) => {
      return `You must define either config.maxEntries or config.maxAgeSecondsin ${moduleName}.${className}.${funcName}`;
    },
    "statuses-or-headers-required": ({ moduleName, className, funcName }) => {
      return `You must define either config.statuses or config.headersin ${moduleName}.${className}.${funcName}`;
    },
    "invalid-string": ({ moduleName, funcName, paramName }) => {
      if (!paramName || !moduleName || !funcName) {
        throw new Error(`Unexpected input to 'invalid-string' error.`);
      }
      return `When using strings, the '${paramName}' parameter must start with 'http' (for cross-origin matches) or '/' (for same-origin matches). Please see the docs for ${moduleName}.${funcName}() for more info.`;
    },
    "channel-name-required": () => {
      return `You must provide a channelName to construct a BroadcastCacheUpdate instance.`;
    },
    "invalid-responses-are-same-args": () => {
      return `The arguments passed into responsesAreSame() appear to be invalid. Please ensure valid Responses are used.`;
    },
    "expire-custom-caches-only": () => {
      return `You must provide a 'cacheName' property when using the expiration plugin with a runtime caching strategy.`;
    },
    "unit-must-be-bytes": ({ normalizedRangeHeader }) => {
      if (!normalizedRangeHeader) {
        throw new Error(`Unexpected input to 'unit-must-be-bytes' error.`);
      }
      return `The 'unit' portion of the Range header must be set to 'bytes'. The Range header provided was "${normalizedRangeHeader}"`;
    },
    "single-range-only": ({ normalizedRangeHeader }) => {
      if (!normalizedRangeHeader) {
        throw new Error(`Unexpected input to 'single-range-only' error.`);
      }
      return `Multiple ranges are not supported. Please use a  single start value, and optional end value. The Range header provided was "${normalizedRangeHeader}"`;
    },
    "invalid-range-values": ({ normalizedRangeHeader }) => {
      if (!normalizedRangeHeader) {
        throw new Error(`Unexpected input to 'invalid-range-values' error.`);
      }
      return `The Range header is missing both start and end values. At least one of those values is needed. The Range header provided was "${normalizedRangeHeader}"`;
    },
    "no-range-header": () => {
      return `No Range header was found in the Request provided.`;
    },
    "range-not-satisfiable": ({ size, start, end }) => {
      return `The start (${start}) and end (${end}) values in the Range are not satisfiable by the cached response, which is ${size} bytes.`;
    },
    "attempt-to-cache-non-get-request": ({ url, method }) => {
      return `Unable to cache '${url}' because it is a '${method}' request and only 'GET' requests can be cached.`;
    },
    "cache-put-with-no-response": ({ url }) => {
      return `There was an attempt to cache '${url}' but the response was not defined.`;
    },
    "no-response": ({ url, error }) => {
      let message = `The strategy could not generate a response for '${url}'.`;
      if (error) {
        message += ` The underlying error is ${error}.`;
      }
      return message;
    },
    "bad-precaching-response": ({ url, status }) => {
      return `The precaching request for '${url}' failed` + (status ? ` with an HTTP status of ${status}.` : `.`);
    },
    "non-precached-url": ({ url }) => {
      return `createHandlerBoundToURL('${url}') was called, but that URL is not precached. Please pass in a URL that is precached instead.`;
    },
    "add-to-cache-list-conflicting-integrities": ({ url }) => {
      return `Two of the entries passed to 'workbox-precaching.PrecacheController.addToCacheList()' had the URL ${url} with different integrity values. Please remove one of them.`;
    },
    "missing-precache-entry": ({ cacheName, url }) => {
      return `Unable to find a precached response in ${cacheName} for ${url}.`;
    },
    "cross-origin-copy-response": ({ origin }) => {
      return `workbox-core.copyResponse() can only be used with same-origin responses. It was passed a response with origin ${origin}.`;
    },
    "opaque-streams-source": ({ type }) => {
      const message = `One of the workbox-streams sources resulted in an '${type}' response.`;
      if (type === "opaqueredirect") {
        return `${message} Please do not use a navigation request that results in a redirect as a source.`;
      }
      return `${message} Please ensure your sources are CORS-enabled.`;
    }
  };

  // node_modules/workbox-core/models/messages/messageGenerator.js
  var generatorFunction = (code, details = {}) => {
    const message = messages[code];
    if (!message) {
      throw new Error(`Unable to find message for code '${code}'.`);
    }
    return message(details);
  };
  var messageGenerator = false ? fallback : generatorFunction;

  // node_modules/workbox-core/_private/WorkboxError.js
  var WorkboxError = class extends Error {
    constructor(errorCode, details) {
      const message = messageGenerator(errorCode, details);
      super(message);
      this.name = errorCode;
      this.details = details;
    }
  };

  // node_modules/workbox-core/_private/assert.js
  var isArray = (value, details) => {
    if (!Array.isArray(value)) {
      throw new WorkboxError("not-an-array", details);
    }
  };
  var hasMethod = (object, expectedMethod, details) => {
    const type = typeof object[expectedMethod];
    if (type !== "function") {
      details["expectedMethod"] = expectedMethod;
      throw new WorkboxError("missing-a-method", details);
    }
  };
  var isType = (object, expectedType, details) => {
    if (typeof object !== expectedType) {
      details["expectedType"] = expectedType;
      throw new WorkboxError("incorrect-type", details);
    }
  };
  var isInstance = (object, expectedClass, details) => {
    if (!(object instanceof expectedClass)) {
      details["expectedClassName"] = expectedClass.name;
      throw new WorkboxError("incorrect-class", details);
    }
  };
  var isOneOf = (value, validValues, details) => {
    if (!validValues.includes(value)) {
      details["validValueDescription"] = `Valid values are ${JSON.stringify(validValues)}.`;
      throw new WorkboxError("invalid-value", details);
    }
  };
  var isArrayOfClass = (value, expectedClass, details) => {
    const error = new WorkboxError("not-array-of-class", details);
    if (!Array.isArray(value)) {
      throw error;
    }
    for (const item of value) {
      if (!(item instanceof expectedClass)) {
        throw error;
      }
    }
  };
  var finalAssertExports = false ? null : {
    hasMethod,
    isArray,
    isInstance,
    isOneOf,
    isType,
    isArrayOfClass
  };

  // node_modules/workbox-core/_private/cacheNames.js
  var _cacheNameDetails = {
    googleAnalytics: "googleAnalytics",
    precache: "precache-v2",
    prefix: "workbox",
    runtime: "runtime",
    suffix: typeof registration !== "undefined" ? registration.scope : ""
  };
  var _createCacheName = (cacheName) => {
    return [_cacheNameDetails.prefix, cacheName, _cacheNameDetails.suffix].filter((value) => value && value.length > 0).join("-");
  };
  var eachCacheNameDetail = (fn) => {
    for (const key of Object.keys(_cacheNameDetails)) {
      fn(key);
    }
  };
  var cacheNames = {
    updateDetails: (details) => {
      eachCacheNameDetail((key) => {
        if (typeof details[key] === "string") {
          _cacheNameDetails[key] = details[key];
        }
      });
    },
    getGoogleAnalyticsName: (userCacheName) => {
      return userCacheName || _createCacheName(_cacheNameDetails.googleAnalytics);
    },
    getPrecacheName: (userCacheName) => {
      return userCacheName || _createCacheName(_cacheNameDetails.precache);
    },
    getPrefix: () => {
      return _cacheNameDetails.prefix;
    },
    getRuntimeName: (userCacheName) => {
      return userCacheName || _createCacheName(_cacheNameDetails.runtime);
    },
    getSuffix: () => {
      return _cacheNameDetails.suffix;
    }
  };

  // node_modules/workbox-core/_private/logger.js
  var logger = false ? null : (() => {
    if (!("__WB_DISABLE_DEV_LOGS" in self)) {
      self.__WB_DISABLE_DEV_LOGS = false;
    }
    let inGroup = false;
    const methodToColorMap = {
      debug: `#7f8c8d`,
      log: `#2ecc71`,
      warn: `#f39c12`,
      error: `#c0392b`,
      groupCollapsed: `#3498db`,
      groupEnd: null
    };
    const print = function(method, args) {
      if (self.__WB_DISABLE_DEV_LOGS) {
        return;
      }
      if (method === "groupCollapsed") {
        if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
          console[method](...args);
          return;
        }
      }
      const styles = [
        `background: ${methodToColorMap[method]}`,
        `border-radius: 0.5em`,
        `color: white`,
        `font-weight: bold`,
        `padding: 2px 0.5em`
      ];
      const logPrefix = inGroup ? [] : ["%cworkbox", styles.join(";")];
      console[method](...logPrefix, ...args);
      if (method === "groupCollapsed") {
        inGroup = true;
      }
      if (method === "groupEnd") {
        inGroup = false;
      }
    };
    const api = {};
    const loggerMethods = Object.keys(methodToColorMap);
    for (const key of loggerMethods) {
      const method = key;
      api[method] = (...args) => {
        print(method, args);
      };
    }
    return api;
  })();

  // node_modules/workbox-core/_private/waitUntil.js
  function waitUntil(event, asyncFn) {
    const returnPromise = asyncFn();
    event.waitUntil(returnPromise);
    return returnPromise;
  }

  // node_modules/workbox-precaching/_version.js
  try {
    self["workbox:precaching:6.5.2"] && _();
  } catch (e) {
  }

  // node_modules/workbox-precaching/utils/createCacheKey.js
  var REVISION_SEARCH_PARAM = "__WB_REVISION__";
  function createCacheKey(entry) {
    if (!entry) {
      throw new WorkboxError("add-to-cache-list-unexpected-type", { entry });
    }
    if (typeof entry === "string") {
      const urlObject = new URL(entry, location.href);
      return {
        cacheKey: urlObject.href,
        url: urlObject.href
      };
    }
    const { revision, url } = entry;
    if (!url) {
      throw new WorkboxError("add-to-cache-list-unexpected-type", { entry });
    }
    if (!revision) {
      const urlObject = new URL(url, location.href);
      return {
        cacheKey: urlObject.href,
        url: urlObject.href
      };
    }
    const cacheKeyURL = new URL(url, location.href);
    const originalURL = new URL(url, location.href);
    cacheKeyURL.searchParams.set(REVISION_SEARCH_PARAM, revision);
    return {
      cacheKey: cacheKeyURL.href,
      url: originalURL.href
    };
  }

  // node_modules/workbox-precaching/utils/PrecacheInstallReportPlugin.js
  var PrecacheInstallReportPlugin = class {
    constructor() {
      this.updatedURLs = [];
      this.notUpdatedURLs = [];
      this.handlerWillStart = async ({ request, state }) => {
        if (state) {
          state.originalRequest = request;
        }
      };
      this.cachedResponseWillBeUsed = async ({ event, state, cachedResponse }) => {
        if (event.type === "install") {
          if (state && state.originalRequest && state.originalRequest instanceof Request) {
            const url = state.originalRequest.url;
            if (cachedResponse) {
              this.notUpdatedURLs.push(url);
            } else {
              this.updatedURLs.push(url);
            }
          }
        }
        return cachedResponse;
      };
    }
  };

  // node_modules/workbox-precaching/utils/PrecacheCacheKeyPlugin.js
  var PrecacheCacheKeyPlugin = class {
    constructor({ precacheController: precacheController2 }) {
      this.cacheKeyWillBeUsed = async ({ request, params }) => {
        const cacheKey = (params === null || params === void 0 ? void 0 : params.cacheKey) || this._precacheController.getCacheKeyForURL(request.url);
        return cacheKey ? new Request(cacheKey, { headers: request.headers }) : request;
      };
      this._precacheController = precacheController2;
    }
  };

  // node_modules/workbox-precaching/utils/printCleanupDetails.js
  var logGroup = (groupTitle, deletedURLs) => {
    logger.groupCollapsed(groupTitle);
    for (const url of deletedURLs) {
      logger.log(url);
    }
    logger.groupEnd();
  };
  function printCleanupDetails(deletedURLs) {
    const deletionCount = deletedURLs.length;
    if (deletionCount > 0) {
      logger.groupCollapsed(`During precaching cleanup, ${deletionCount} cached request${deletionCount === 1 ? " was" : "s were"} deleted.`);
      logGroup("Deleted Cache Requests", deletedURLs);
      logger.groupEnd();
    }
  }

  // node_modules/workbox-precaching/utils/printInstallDetails.js
  function _nestedGroup(groupTitle, urls) {
    if (urls.length === 0) {
      return;
    }
    logger.groupCollapsed(groupTitle);
    for (const url of urls) {
      logger.log(url);
    }
    logger.groupEnd();
  }
  function printInstallDetails(urlsToPrecache, urlsAlreadyPrecached) {
    const precachedCount = urlsToPrecache.length;
    const alreadyPrecachedCount = urlsAlreadyPrecached.length;
    if (precachedCount || alreadyPrecachedCount) {
      let message = `Precaching ${precachedCount} file${precachedCount === 1 ? "" : "s"}.`;
      if (alreadyPrecachedCount > 0) {
        message += ` ${alreadyPrecachedCount} file${alreadyPrecachedCount === 1 ? " is" : "s are"} already cached.`;
      }
      logger.groupCollapsed(message);
      _nestedGroup(`View newly precached URLs.`, urlsToPrecache);
      _nestedGroup(`View previously precached URLs.`, urlsAlreadyPrecached);
      logger.groupEnd();
    }
  }

  // node_modules/workbox-core/_private/canConstructResponseFromBodyStream.js
  var supportStatus;
  function canConstructResponseFromBodyStream() {
    if (supportStatus === void 0) {
      const testResponse = new Response("");
      if ("body" in testResponse) {
        try {
          new Response(testResponse.body);
          supportStatus = true;
        } catch (error) {
          supportStatus = false;
        }
      }
      supportStatus = false;
    }
    return supportStatus;
  }

  // node_modules/workbox-core/copyResponse.js
  async function copyResponse(response, modifier) {
    let origin = null;
    if (response.url) {
      const responseURL = new URL(response.url);
      origin = responseURL.origin;
    }
    if (origin !== self.location.origin) {
      throw new WorkboxError("cross-origin-copy-response", { origin });
    }
    const clonedResponse = response.clone();
    const responseInit = {
      headers: new Headers(clonedResponse.headers),
      status: clonedResponse.status,
      statusText: clonedResponse.statusText
    };
    const modifiedResponseInit = modifier ? modifier(responseInit) : responseInit;
    const body = canConstructResponseFromBodyStream() ? clonedResponse.body : await clonedResponse.blob();
    return new Response(body, modifiedResponseInit);
  }

  // node_modules/workbox-core/_private/getFriendlyURL.js
  var getFriendlyURL = (url) => {
    const urlObj = new URL(String(url), location.href);
    return urlObj.href.replace(new RegExp(`^${location.origin}`), "");
  };

  // node_modules/workbox-core/_private/cacheMatchIgnoreParams.js
  function stripParams(fullURL, ignoreParams) {
    const strippedURL = new URL(fullURL);
    for (const param of ignoreParams) {
      strippedURL.searchParams.delete(param);
    }
    return strippedURL.href;
  }
  async function cacheMatchIgnoreParams(cache, request, ignoreParams, matchOptions) {
    const strippedRequestURL = stripParams(request.url, ignoreParams);
    if (request.url === strippedRequestURL) {
      return cache.match(request, matchOptions);
    }
    const keysOptions = Object.assign(Object.assign({}, matchOptions), { ignoreSearch: true });
    const cacheKeys = await cache.keys(request, keysOptions);
    for (const cacheKey of cacheKeys) {
      const strippedCacheKeyURL = stripParams(cacheKey.url, ignoreParams);
      if (strippedRequestURL === strippedCacheKeyURL) {
        return cache.match(cacheKey, matchOptions);
      }
    }
    return;
  }

  // node_modules/workbox-core/_private/Deferred.js
  var Deferred = class {
    constructor() {
      this.promise = new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    }
  };

  // node_modules/workbox-core/models/quotaErrorCallbacks.js
  var quotaErrorCallbacks = /* @__PURE__ */ new Set();

  // node_modules/workbox-core/_private/executeQuotaErrorCallbacks.js
  async function executeQuotaErrorCallbacks() {
    if (true) {
      logger.log(`About to run ${quotaErrorCallbacks.size} callbacks to clean up caches.`);
    }
    for (const callback of quotaErrorCallbacks) {
      await callback();
      if (true) {
        logger.log(callback, "is complete.");
      }
    }
    if (true) {
      logger.log("Finished running callbacks.");
    }
  }

  // node_modules/workbox-core/_private/timeout.js
  function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // node_modules/workbox-strategies/_version.js
  try {
    self["workbox:strategies:6.5.2"] && _();
  } catch (e) {
  }

  // node_modules/workbox-strategies/StrategyHandler.js
  function toRequest(input) {
    return typeof input === "string" ? new Request(input) : input;
  }
  var StrategyHandler = class {
    constructor(strategy, options) {
      this._cacheKeys = {};
      if (true) {
        finalAssertExports.isInstance(options.event, ExtendableEvent, {
          moduleName: "workbox-strategies",
          className: "StrategyHandler",
          funcName: "constructor",
          paramName: "options.event"
        });
      }
      Object.assign(this, options);
      this.event = options.event;
      this._strategy = strategy;
      this._handlerDeferred = new Deferred();
      this._extendLifetimePromises = [];
      this._plugins = [...strategy.plugins];
      this._pluginStateMap = /* @__PURE__ */ new Map();
      for (const plugin of this._plugins) {
        this._pluginStateMap.set(plugin, {});
      }
      this.event.waitUntil(this._handlerDeferred.promise);
    }
    async fetch(input) {
      const { event } = this;
      let request = toRequest(input);
      if (request.mode === "navigate" && event instanceof FetchEvent && event.preloadResponse) {
        const possiblePreloadResponse = await event.preloadResponse;
        if (possiblePreloadResponse) {
          if (true) {
            logger.log(`Using a preloaded navigation response for '${getFriendlyURL(request.url)}'`);
          }
          return possiblePreloadResponse;
        }
      }
      const originalRequest = this.hasCallback("fetchDidFail") ? request.clone() : null;
      try {
        for (const cb of this.iterateCallbacks("requestWillFetch")) {
          request = await cb({ request: request.clone(), event });
        }
      } catch (err) {
        if (err instanceof Error) {
          throw new WorkboxError("plugin-error-request-will-fetch", {
            thrownErrorMessage: err.message
          });
        }
      }
      const pluginFilteredRequest = request.clone();
      try {
        let fetchResponse;
        fetchResponse = await fetch(request, request.mode === "navigate" ? void 0 : this._strategy.fetchOptions);
        if (true) {
          logger.debug(`Network request for '${getFriendlyURL(request.url)}' returned a response with status '${fetchResponse.status}'.`);
        }
        for (const callback of this.iterateCallbacks("fetchDidSucceed")) {
          fetchResponse = await callback({
            event,
            request: pluginFilteredRequest,
            response: fetchResponse
          });
        }
        return fetchResponse;
      } catch (error) {
        if (true) {
          logger.log(`Network request for '${getFriendlyURL(request.url)}' threw an error.`, error);
        }
        if (originalRequest) {
          await this.runCallbacks("fetchDidFail", {
            error,
            event,
            originalRequest: originalRequest.clone(),
            request: pluginFilteredRequest.clone()
          });
        }
        throw error;
      }
    }
    async fetchAndCachePut(input) {
      const response = await this.fetch(input);
      const responseClone = response.clone();
      void this.waitUntil(this.cachePut(input, responseClone));
      return response;
    }
    async cacheMatch(key) {
      const request = toRequest(key);
      let cachedResponse;
      const { cacheName, matchOptions } = this._strategy;
      const effectiveRequest = await this.getCacheKey(request, "read");
      const multiMatchOptions = Object.assign(Object.assign({}, matchOptions), { cacheName });
      cachedResponse = await caches.match(effectiveRequest, multiMatchOptions);
      if (true) {
        if (cachedResponse) {
          logger.debug(`Found a cached response in '${cacheName}'.`);
        } else {
          logger.debug(`No cached response found in '${cacheName}'.`);
        }
      }
      for (const callback of this.iterateCallbacks("cachedResponseWillBeUsed")) {
        cachedResponse = await callback({
          cacheName,
          matchOptions,
          cachedResponse,
          request: effectiveRequest,
          event: this.event
        }) || void 0;
      }
      return cachedResponse;
    }
    async cachePut(key, response) {
      const request = toRequest(key);
      await timeout(0);
      const effectiveRequest = await this.getCacheKey(request, "write");
      if (true) {
        if (effectiveRequest.method && effectiveRequest.method !== "GET") {
          throw new WorkboxError("attempt-to-cache-non-get-request", {
            url: getFriendlyURL(effectiveRequest.url),
            method: effectiveRequest.method
          });
        }
        const vary = response.headers.get("Vary");
        if (vary) {
          logger.debug(`The response for ${getFriendlyURL(effectiveRequest.url)} has a 'Vary: ${vary}' header. Consider setting the {ignoreVary: true} option on your strategy to ensure cache matching and deletion works as expected.`);
        }
      }
      if (!response) {
        if (true) {
          logger.error(`Cannot cache non-existent response for '${getFriendlyURL(effectiveRequest.url)}'.`);
        }
        throw new WorkboxError("cache-put-with-no-response", {
          url: getFriendlyURL(effectiveRequest.url)
        });
      }
      const responseToCache = await this._ensureResponseSafeToCache(response);
      if (!responseToCache) {
        if (true) {
          logger.debug(`Response '${getFriendlyURL(effectiveRequest.url)}' will not be cached.`, responseToCache);
        }
        return false;
      }
      const { cacheName, matchOptions } = this._strategy;
      const cache = await self.caches.open(cacheName);
      const hasCacheUpdateCallback = this.hasCallback("cacheDidUpdate");
      const oldResponse = hasCacheUpdateCallback ? await cacheMatchIgnoreParams(cache, effectiveRequest.clone(), ["__WB_REVISION__"], matchOptions) : null;
      if (true) {
        logger.debug(`Updating the '${cacheName}' cache with a new Response for ${getFriendlyURL(effectiveRequest.url)}.`);
      }
      try {
        await cache.put(effectiveRequest, hasCacheUpdateCallback ? responseToCache.clone() : responseToCache);
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === "QuotaExceededError") {
            await executeQuotaErrorCallbacks();
          }
          throw error;
        }
      }
      for (const callback of this.iterateCallbacks("cacheDidUpdate")) {
        await callback({
          cacheName,
          oldResponse,
          newResponse: responseToCache.clone(),
          request: effectiveRequest,
          event: this.event
        });
      }
      return true;
    }
    async getCacheKey(request, mode) {
      const key = `${request.url} | ${mode}`;
      if (!this._cacheKeys[key]) {
        let effectiveRequest = request;
        for (const callback of this.iterateCallbacks("cacheKeyWillBeUsed")) {
          effectiveRequest = toRequest(await callback({
            mode,
            request: effectiveRequest,
            event: this.event,
            params: this.params
          }));
        }
        this._cacheKeys[key] = effectiveRequest;
      }
      return this._cacheKeys[key];
    }
    hasCallback(name) {
      for (const plugin of this._strategy.plugins) {
        if (name in plugin) {
          return true;
        }
      }
      return false;
    }
    async runCallbacks(name, param) {
      for (const callback of this.iterateCallbacks(name)) {
        await callback(param);
      }
    }
    *iterateCallbacks(name) {
      for (const plugin of this._strategy.plugins) {
        if (typeof plugin[name] === "function") {
          const state = this._pluginStateMap.get(plugin);
          const statefulCallback = (param) => {
            const statefulParam = Object.assign(Object.assign({}, param), { state });
            return plugin[name](statefulParam);
          };
          yield statefulCallback;
        }
      }
    }
    waitUntil(promise) {
      this._extendLifetimePromises.push(promise);
      return promise;
    }
    async doneWaiting() {
      let promise;
      while (promise = this._extendLifetimePromises.shift()) {
        await promise;
      }
    }
    destroy() {
      this._handlerDeferred.resolve(null);
    }
    async _ensureResponseSafeToCache(response) {
      let responseToCache = response;
      let pluginsUsed = false;
      for (const callback of this.iterateCallbacks("cacheWillUpdate")) {
        responseToCache = await callback({
          request: this.request,
          response: responseToCache,
          event: this.event
        }) || void 0;
        pluginsUsed = true;
        if (!responseToCache) {
          break;
        }
      }
      if (!pluginsUsed) {
        if (responseToCache && responseToCache.status !== 200) {
          responseToCache = void 0;
        }
        if (true) {
          if (responseToCache) {
            if (responseToCache.status !== 200) {
              if (responseToCache.status === 0) {
                logger.warn(`The response for '${this.request.url}' is an opaque response. The caching strategy that you're using will not cache opaque responses by default.`);
              } else {
                logger.debug(`The response for '${this.request.url}' returned a status code of '${response.status}' and won't be cached as a result.`);
              }
            }
          }
        }
      }
      return responseToCache;
    }
  };

  // node_modules/workbox-strategies/Strategy.js
  var Strategy = class {
    constructor(options = {}) {
      this.cacheName = cacheNames.getRuntimeName(options.cacheName);
      this.plugins = options.plugins || [];
      this.fetchOptions = options.fetchOptions;
      this.matchOptions = options.matchOptions;
    }
    handle(options) {
      const [responseDone] = this.handleAll(options);
      return responseDone;
    }
    handleAll(options) {
      if (options instanceof FetchEvent) {
        options = {
          event: options,
          request: options.request
        };
      }
      const event = options.event;
      const request = typeof options.request === "string" ? new Request(options.request) : options.request;
      const params = "params" in options ? options.params : void 0;
      const handler = new StrategyHandler(this, { event, request, params });
      const responseDone = this._getResponse(handler, request, event);
      const handlerDone = this._awaitComplete(responseDone, handler, request, event);
      return [responseDone, handlerDone];
    }
    async _getResponse(handler, request, event) {
      await handler.runCallbacks("handlerWillStart", { event, request });
      let response = void 0;
      try {
        response = await this._handle(request, handler);
        if (!response || response.type === "error") {
          throw new WorkboxError("no-response", { url: request.url });
        }
      } catch (error) {
        if (error instanceof Error) {
          for (const callback of handler.iterateCallbacks("handlerDidError")) {
            response = await callback({ error, event, request });
            if (response) {
              break;
            }
          }
        }
        if (!response) {
          throw error;
        } else if (true) {
          logger.log(`While responding to '${getFriendlyURL(request.url)}', an ${error instanceof Error ? error.toString() : ""} error occurred. Using a fallback response provided by a handlerDidError plugin.`);
        }
      }
      for (const callback of handler.iterateCallbacks("handlerWillRespond")) {
        response = await callback({ event, request, response });
      }
      return response;
    }
    async _awaitComplete(responseDone, handler, request, event) {
      let response;
      let error;
      try {
        response = await responseDone;
      } catch (error2) {
      }
      try {
        await handler.runCallbacks("handlerDidRespond", {
          event,
          request,
          response
        });
        await handler.doneWaiting();
      } catch (waitUntilError) {
        if (waitUntilError instanceof Error) {
          error = waitUntilError;
        }
      }
      await handler.runCallbacks("handlerDidComplete", {
        event,
        request,
        response,
        error
      });
      handler.destroy();
      if (error) {
        throw error;
      }
    }
  };

  // node_modules/workbox-precaching/PrecacheStrategy.js
  var PrecacheStrategy = class extends Strategy {
    constructor(options = {}) {
      options.cacheName = cacheNames.getPrecacheName(options.cacheName);
      super(options);
      this._fallbackToNetwork = options.fallbackToNetwork === false ? false : true;
      this.plugins.push(PrecacheStrategy.copyRedirectedCacheableResponsesPlugin);
    }
    async _handle(request, handler) {
      const response = await handler.cacheMatch(request);
      if (response) {
        return response;
      }
      if (handler.event && handler.event.type === "install") {
        return await this._handleInstall(request, handler);
      }
      return await this._handleFetch(request, handler);
    }
    async _handleFetch(request, handler) {
      let response;
      const params = handler.params || {};
      if (this._fallbackToNetwork) {
        if (true) {
          logger.warn(`The precached response for ${getFriendlyURL(request.url)} in ${this.cacheName} was not found. Falling back to the network.`);
        }
        const integrityInManifest = params.integrity;
        const integrityInRequest = request.integrity;
        const noIntegrityConflict = !integrityInRequest || integrityInRequest === integrityInManifest;
        response = await handler.fetch(new Request(request, {
          integrity: integrityInRequest || integrityInManifest
        }));
        if (integrityInManifest && noIntegrityConflict) {
          this._useDefaultCacheabilityPluginIfNeeded();
          const wasCached = await handler.cachePut(request, response.clone());
          if (true) {
            if (wasCached) {
              logger.log(`A response for ${getFriendlyURL(request.url)} was used to "repair" the precache.`);
            }
          }
        }
      } else {
        throw new WorkboxError("missing-precache-entry", {
          cacheName: this.cacheName,
          url: request.url
        });
      }
      if (true) {
        const cacheKey = params.cacheKey || await handler.getCacheKey(request, "read");
        logger.groupCollapsed(`Precaching is responding to: ` + getFriendlyURL(request.url));
        logger.log(`Serving the precached url: ${getFriendlyURL(cacheKey instanceof Request ? cacheKey.url : cacheKey)}`);
        logger.groupCollapsed(`View request details here.`);
        logger.log(request);
        logger.groupEnd();
        logger.groupCollapsed(`View response details here.`);
        logger.log(response);
        logger.groupEnd();
        logger.groupEnd();
      }
      return response;
    }
    async _handleInstall(request, handler) {
      this._useDefaultCacheabilityPluginIfNeeded();
      const response = await handler.fetch(request);
      const wasCached = await handler.cachePut(request, response.clone());
      if (!wasCached) {
        throw new WorkboxError("bad-precaching-response", {
          url: request.url,
          status: response.status
        });
      }
      return response;
    }
    _useDefaultCacheabilityPluginIfNeeded() {
      let defaultPluginIndex = null;
      let cacheWillUpdatePluginCount = 0;
      for (const [index, plugin] of this.plugins.entries()) {
        if (plugin === PrecacheStrategy.copyRedirectedCacheableResponsesPlugin) {
          continue;
        }
        if (plugin === PrecacheStrategy.defaultPrecacheCacheabilityPlugin) {
          defaultPluginIndex = index;
        }
        if (plugin.cacheWillUpdate) {
          cacheWillUpdatePluginCount++;
        }
      }
      if (cacheWillUpdatePluginCount === 0) {
        this.plugins.push(PrecacheStrategy.defaultPrecacheCacheabilityPlugin);
      } else if (cacheWillUpdatePluginCount > 1 && defaultPluginIndex !== null) {
        this.plugins.splice(defaultPluginIndex, 1);
      }
    }
  };
  PrecacheStrategy.defaultPrecacheCacheabilityPlugin = {
    async cacheWillUpdate({ response }) {
      if (!response || response.status >= 400) {
        return null;
      }
      return response;
    }
  };
  PrecacheStrategy.copyRedirectedCacheableResponsesPlugin = {
    async cacheWillUpdate({ response }) {
      return response.redirected ? await copyResponse(response) : response;
    }
  };

  // node_modules/workbox-precaching/PrecacheController.js
  var PrecacheController = class {
    constructor({ cacheName, plugins = [], fallbackToNetwork = true } = {}) {
      this._urlsToCacheKeys = /* @__PURE__ */ new Map();
      this._urlsToCacheModes = /* @__PURE__ */ new Map();
      this._cacheKeysToIntegrities = /* @__PURE__ */ new Map();
      this._strategy = new PrecacheStrategy({
        cacheName: cacheNames.getPrecacheName(cacheName),
        plugins: [
          ...plugins,
          new PrecacheCacheKeyPlugin({ precacheController: this })
        ],
        fallbackToNetwork
      });
      this.install = this.install.bind(this);
      this.activate = this.activate.bind(this);
    }
    get strategy() {
      return this._strategy;
    }
    precache(entries) {
      this.addToCacheList(entries);
      if (!this._installAndActiveListenersAdded) {
        self.addEventListener("install", this.install);
        self.addEventListener("activate", this.activate);
        this._installAndActiveListenersAdded = true;
      }
    }
    addToCacheList(entries) {
      if (true) {
        finalAssertExports.isArray(entries, {
          moduleName: "workbox-precaching",
          className: "PrecacheController",
          funcName: "addToCacheList",
          paramName: "entries"
        });
      }
      const urlsToWarnAbout = [];
      for (const entry of entries) {
        if (typeof entry === "string") {
          urlsToWarnAbout.push(entry);
        } else if (entry && entry.revision === void 0) {
          urlsToWarnAbout.push(entry.url);
        }
        const { cacheKey, url } = createCacheKey(entry);
        const cacheMode = typeof entry !== "string" && entry.revision ? "reload" : "default";
        if (this._urlsToCacheKeys.has(url) && this._urlsToCacheKeys.get(url) !== cacheKey) {
          throw new WorkboxError("add-to-cache-list-conflicting-entries", {
            firstEntry: this._urlsToCacheKeys.get(url),
            secondEntry: cacheKey
          });
        }
        if (typeof entry !== "string" && entry.integrity) {
          if (this._cacheKeysToIntegrities.has(cacheKey) && this._cacheKeysToIntegrities.get(cacheKey) !== entry.integrity) {
            throw new WorkboxError("add-to-cache-list-conflicting-integrities", {
              url
            });
          }
          this._cacheKeysToIntegrities.set(cacheKey, entry.integrity);
        }
        this._urlsToCacheKeys.set(url, cacheKey);
        this._urlsToCacheModes.set(url, cacheMode);
        if (urlsToWarnAbout.length > 0) {
          const warningMessage = `Workbox is precaching URLs without revision info: ${urlsToWarnAbout.join(", ")}
This is generally NOT safe. Learn more at https://bit.ly/wb-precache`;
          if (false) {
            console.warn(warningMessage);
          } else {
            logger.warn(warningMessage);
          }
        }
      }
    }
    install(event) {
      return waitUntil(event, async () => {
        const installReportPlugin = new PrecacheInstallReportPlugin();
        this.strategy.plugins.push(installReportPlugin);
        for (const [url, cacheKey] of this._urlsToCacheKeys) {
          const integrity = this._cacheKeysToIntegrities.get(cacheKey);
          const cacheMode = this._urlsToCacheModes.get(url);
          const request = new Request(url, {
            integrity,
            cache: cacheMode,
            credentials: "same-origin"
          });
          await Promise.all(this.strategy.handleAll({
            params: { cacheKey },
            request,
            event
          }));
        }
        const { updatedURLs, notUpdatedURLs } = installReportPlugin;
        if (true) {
          printInstallDetails(updatedURLs, notUpdatedURLs);
        }
        return { updatedURLs, notUpdatedURLs };
      });
    }
    activate(event) {
      return waitUntil(event, async () => {
        const cache = await self.caches.open(this.strategy.cacheName);
        const currentlyCachedRequests = await cache.keys();
        const expectedCacheKeys = new Set(this._urlsToCacheKeys.values());
        const deletedURLs = [];
        for (const request of currentlyCachedRequests) {
          if (!expectedCacheKeys.has(request.url)) {
            await cache.delete(request);
            deletedURLs.push(request.url);
          }
        }
        if (true) {
          printCleanupDetails(deletedURLs);
        }
        return { deletedURLs };
      });
    }
    getURLsToCacheKeys() {
      return this._urlsToCacheKeys;
    }
    getCachedURLs() {
      return [...this._urlsToCacheKeys.keys()];
    }
    getCacheKeyForURL(url) {
      const urlObject = new URL(url, location.href);
      return this._urlsToCacheKeys.get(urlObject.href);
    }
    getIntegrityForCacheKey(cacheKey) {
      return this._cacheKeysToIntegrities.get(cacheKey);
    }
    async matchPrecache(request) {
      const url = request instanceof Request ? request.url : request;
      const cacheKey = this.getCacheKeyForURL(url);
      if (cacheKey) {
        const cache = await self.caches.open(this.strategy.cacheName);
        return cache.match(cacheKey);
      }
      return void 0;
    }
    createHandlerBoundToURL(url) {
      const cacheKey = this.getCacheKeyForURL(url);
      if (!cacheKey) {
        throw new WorkboxError("non-precached-url", { url });
      }
      return (options) => {
        options.request = new Request(url);
        options.params = Object.assign({ cacheKey }, options.params);
        return this.strategy.handle(options);
      };
    }
  };

  // node_modules/workbox-precaching/utils/getOrCreatePrecacheController.js
  var precacheController;
  var getOrCreatePrecacheController = () => {
    if (!precacheController) {
      precacheController = new PrecacheController();
    }
    return precacheController;
  };

  // node_modules/workbox-routing/_version.js
  try {
    self["workbox:routing:6.5.2"] && _();
  } catch (e) {
  }

  // node_modules/workbox-routing/utils/constants.js
  var defaultMethod = "GET";
  var validMethods = [
    "DELETE",
    "GET",
    "HEAD",
    "PATCH",
    "POST",
    "PUT"
  ];

  // node_modules/workbox-routing/utils/normalizeHandler.js
  var normalizeHandler = (handler) => {
    if (handler && typeof handler === "object") {
      if (true) {
        finalAssertExports.hasMethod(handler, "handle", {
          moduleName: "workbox-routing",
          className: "Route",
          funcName: "constructor",
          paramName: "handler"
        });
      }
      return handler;
    } else {
      if (true) {
        finalAssertExports.isType(handler, "function", {
          moduleName: "workbox-routing",
          className: "Route",
          funcName: "constructor",
          paramName: "handler"
        });
      }
      return { handle: handler };
    }
  };

  // node_modules/workbox-routing/Route.js
  var Route = class {
    constructor(match, handler, method = defaultMethod) {
      if (true) {
        finalAssertExports.isType(match, "function", {
          moduleName: "workbox-routing",
          className: "Route",
          funcName: "constructor",
          paramName: "match"
        });
        if (method) {
          finalAssertExports.isOneOf(method, validMethods, { paramName: "method" });
        }
      }
      this.handler = normalizeHandler(handler);
      this.match = match;
      this.method = method;
    }
    setCatchHandler(handler) {
      this.catchHandler = normalizeHandler(handler);
    }
  };

  // node_modules/workbox-routing/RegExpRoute.js
  var RegExpRoute = class extends Route {
    constructor(regExp, handler, method) {
      if (true) {
        finalAssertExports.isInstance(regExp, RegExp, {
          moduleName: "workbox-routing",
          className: "RegExpRoute",
          funcName: "constructor",
          paramName: "pattern"
        });
      }
      const match = ({ url }) => {
        const result = regExp.exec(url.href);
        if (!result) {
          return;
        }
        if (url.origin !== location.origin && result.index !== 0) {
          if (true) {
            logger.debug(`The regular expression '${regExp.toString()}' only partially matched against the cross-origin URL '${url.toString()}'. RegExpRoute's will only handle cross-origin requests if they match the entire URL.`);
          }
          return;
        }
        return result.slice(1);
      };
      super(match, handler, method);
    }
  };

  // node_modules/workbox-routing/Router.js
  var Router = class {
    constructor() {
      this._routes = /* @__PURE__ */ new Map();
      this._defaultHandlerMap = /* @__PURE__ */ new Map();
    }
    get routes() {
      return this._routes;
    }
    addFetchListener() {
      self.addEventListener("fetch", (event) => {
        const { request } = event;
        const responsePromise = this.handleRequest({ request, event });
        if (responsePromise) {
          event.respondWith(responsePromise);
        }
      });
    }
    addCacheListener() {
      self.addEventListener("message", (event) => {
        if (event.data && event.data.type === "CACHE_URLS") {
          const { payload } = event.data;
          if (true) {
            logger.debug(`Caching URLs from the window`, payload.urlsToCache);
          }
          const requestPromises = Promise.all(payload.urlsToCache.map((entry) => {
            if (typeof entry === "string") {
              entry = [entry];
            }
            const request = new Request(...entry);
            return this.handleRequest({ request, event });
          }));
          event.waitUntil(requestPromises);
          if (event.ports && event.ports[0]) {
            void requestPromises.then(() => event.ports[0].postMessage(true));
          }
        }
      });
    }
    handleRequest({ request, event }) {
      if (true) {
        finalAssertExports.isInstance(request, Request, {
          moduleName: "workbox-routing",
          className: "Router",
          funcName: "handleRequest",
          paramName: "options.request"
        });
      }
      const url = new URL(request.url, location.href);
      if (!url.protocol.startsWith("http")) {
        if (true) {
          logger.debug(`Workbox Router only supports URLs that start with 'http'.`);
        }
        return;
      }
      const sameOrigin = url.origin === location.origin;
      const { params, route } = this.findMatchingRoute({
        event,
        request,
        sameOrigin,
        url
      });
      let handler = route && route.handler;
      const debugMessages = [];
      if (true) {
        if (handler) {
          debugMessages.push([`Found a route to handle this request:`, route]);
          if (params) {
            debugMessages.push([
              `Passing the following params to the route's handler:`,
              params
            ]);
          }
        }
      }
      const method = request.method;
      if (!handler && this._defaultHandlerMap.has(method)) {
        if (true) {
          debugMessages.push(`Failed to find a matching route. Falling back to the default handler for ${method}.`);
        }
        handler = this._defaultHandlerMap.get(method);
      }
      if (!handler) {
        if (true) {
          logger.debug(`No route found for: ${getFriendlyURL(url)}`);
        }
        return;
      }
      if (true) {
        logger.groupCollapsed(`Router is responding to: ${getFriendlyURL(url)}`);
        debugMessages.forEach((msg) => {
          if (Array.isArray(msg)) {
            logger.log(...msg);
          } else {
            logger.log(msg);
          }
        });
        logger.groupEnd();
      }
      let responsePromise;
      try {
        responsePromise = handler.handle({ url, request, event, params });
      } catch (err) {
        responsePromise = Promise.reject(err);
      }
      const catchHandler = route && route.catchHandler;
      if (responsePromise instanceof Promise && (this._catchHandler || catchHandler)) {
        responsePromise = responsePromise.catch(async (err) => {
          if (catchHandler) {
            if (true) {
              logger.groupCollapsed(`Error thrown when responding to:  ${getFriendlyURL(url)}. Falling back to route's Catch Handler.`);
              logger.error(`Error thrown by:`, route);
              logger.error(err);
              logger.groupEnd();
            }
            try {
              return await catchHandler.handle({ url, request, event, params });
            } catch (catchErr) {
              if (catchErr instanceof Error) {
                err = catchErr;
              }
            }
          }
          if (this._catchHandler) {
            if (true) {
              logger.groupCollapsed(`Error thrown when responding to:  ${getFriendlyURL(url)}. Falling back to global Catch Handler.`);
              logger.error(`Error thrown by:`, route);
              logger.error(err);
              logger.groupEnd();
            }
            return this._catchHandler.handle({ url, request, event });
          }
          throw err;
        });
      }
      return responsePromise;
    }
    findMatchingRoute({ url, sameOrigin, request, event }) {
      const routes = this._routes.get(request.method) || [];
      for (const route of routes) {
        let params;
        const matchResult = route.match({ url, sameOrigin, request, event });
        if (matchResult) {
          if (true) {
            if (matchResult instanceof Promise) {
              logger.warn(`While routing ${getFriendlyURL(url)}, an async matchCallback function was used. Please convert the following route to use a synchronous matchCallback function:`, route);
            }
          }
          params = matchResult;
          if (Array.isArray(params) && params.length === 0) {
            params = void 0;
          } else if (matchResult.constructor === Object && Object.keys(matchResult).length === 0) {
            params = void 0;
          } else if (typeof matchResult === "boolean") {
            params = void 0;
          }
          return { route, params };
        }
      }
      return {};
    }
    setDefaultHandler(handler, method = defaultMethod) {
      this._defaultHandlerMap.set(method, normalizeHandler(handler));
    }
    setCatchHandler(handler) {
      this._catchHandler = normalizeHandler(handler);
    }
    registerRoute(route) {
      if (true) {
        finalAssertExports.isType(route, "object", {
          moduleName: "workbox-routing",
          className: "Router",
          funcName: "registerRoute",
          paramName: "route"
        });
        finalAssertExports.hasMethod(route, "match", {
          moduleName: "workbox-routing",
          className: "Router",
          funcName: "registerRoute",
          paramName: "route"
        });
        finalAssertExports.isType(route.handler, "object", {
          moduleName: "workbox-routing",
          className: "Router",
          funcName: "registerRoute",
          paramName: "route"
        });
        finalAssertExports.hasMethod(route.handler, "handle", {
          moduleName: "workbox-routing",
          className: "Router",
          funcName: "registerRoute",
          paramName: "route.handler"
        });
        finalAssertExports.isType(route.method, "string", {
          moduleName: "workbox-routing",
          className: "Router",
          funcName: "registerRoute",
          paramName: "route.method"
        });
      }
      if (!this._routes.has(route.method)) {
        this._routes.set(route.method, []);
      }
      this._routes.get(route.method).push(route);
    }
    unregisterRoute(route) {
      if (!this._routes.has(route.method)) {
        throw new WorkboxError("unregister-route-but-not-found-with-method", {
          method: route.method
        });
      }
      const routeIndex = this._routes.get(route.method).indexOf(route);
      if (routeIndex > -1) {
        this._routes.get(route.method).splice(routeIndex, 1);
      } else {
        throw new WorkboxError("unregister-route-route-not-registered");
      }
    }
  };

  // node_modules/workbox-routing/utils/getOrCreateDefaultRouter.js
  var defaultRouter;
  var getOrCreateDefaultRouter = () => {
    if (!defaultRouter) {
      defaultRouter = new Router();
      defaultRouter.addFetchListener();
      defaultRouter.addCacheListener();
    }
    return defaultRouter;
  };

  // node_modules/workbox-routing/registerRoute.js
  function registerRoute(capture, handler, method) {
    let route;
    if (typeof capture === "string") {
      const captureUrl = new URL(capture, location.href);
      if (true) {
        if (!(capture.startsWith("/") || capture.startsWith("http"))) {
          throw new WorkboxError("invalid-string", {
            moduleName: "workbox-routing",
            funcName: "registerRoute",
            paramName: "capture"
          });
        }
        const valueToCheck = capture.startsWith("http") ? captureUrl.pathname : capture;
        const wildcards = "[*:?+]";
        if (new RegExp(`${wildcards}`).exec(valueToCheck)) {
          logger.debug(`The '$capture' parameter contains an Express-style wildcard character (${wildcards}). Strings are now always interpreted as exact matches; use a RegExp for partial or wildcard matches.`);
        }
      }
      const matchCallback = ({ url }) => {
        if (true) {
          if (url.pathname === captureUrl.pathname && url.origin !== captureUrl.origin) {
            logger.debug(`${capture} only partially matches the cross-origin URL ${url.toString()}. This route will only handle cross-origin requests if they match the entire URL.`);
          }
        }
        return url.href === captureUrl.href;
      };
      route = new Route(matchCallback, handler, method);
    } else if (capture instanceof RegExp) {
      route = new RegExpRoute(capture, handler, method);
    } else if (typeof capture === "function") {
      route = new Route(capture, handler, method);
    } else if (capture instanceof Route) {
      route = capture;
    } else {
      throw new WorkboxError("unsupported-route-type", {
        moduleName: "workbox-routing",
        funcName: "registerRoute",
        paramName: "capture"
      });
    }
    const defaultRouter2 = getOrCreateDefaultRouter();
    defaultRouter2.registerRoute(route);
    return route;
  }

  // node_modules/workbox-precaching/utils/removeIgnoredSearchParams.js
  function removeIgnoredSearchParams(urlObject, ignoreURLParametersMatching = []) {
    for (const paramName of [...urlObject.searchParams.keys()]) {
      if (ignoreURLParametersMatching.some((regExp) => regExp.test(paramName))) {
        urlObject.searchParams.delete(paramName);
      }
    }
    return urlObject;
  }

  // node_modules/workbox-precaching/utils/generateURLVariations.js
  function* generateURLVariations(url, { ignoreURLParametersMatching = [/^utm_/, /^fbclid$/], directoryIndex = "index.html", cleanURLs = true, urlManipulation } = {}) {
    const urlObject = new URL(url, location.href);
    urlObject.hash = "";
    yield urlObject.href;
    const urlWithoutIgnoredParams = removeIgnoredSearchParams(urlObject, ignoreURLParametersMatching);
    yield urlWithoutIgnoredParams.href;
    if (directoryIndex && urlWithoutIgnoredParams.pathname.endsWith("/")) {
      const directoryURL = new URL(urlWithoutIgnoredParams.href);
      directoryURL.pathname += directoryIndex;
      yield directoryURL.href;
    }
    if (cleanURLs) {
      const cleanURL = new URL(urlWithoutIgnoredParams.href);
      cleanURL.pathname += ".html";
      yield cleanURL.href;
    }
    if (urlManipulation) {
      const additionalURLs = urlManipulation({ url: urlObject });
      for (const urlToAttempt of additionalURLs) {
        yield urlToAttempt.href;
      }
    }
  }

  // node_modules/workbox-precaching/PrecacheRoute.js
  var PrecacheRoute = class extends Route {
    constructor(precacheController2, options) {
      const match = ({ request }) => {
        const urlsToCacheKeys = precacheController2.getURLsToCacheKeys();
        for (const possibleURL of generateURLVariations(request.url, options)) {
          const cacheKey = urlsToCacheKeys.get(possibleURL);
          if (cacheKey) {
            const integrity = precacheController2.getIntegrityForCacheKey(cacheKey);
            return { cacheKey, integrity };
          }
        }
        if (true) {
          logger.debug(`Precaching did not find a match for ` + getFriendlyURL(request.url));
        }
        return;
      };
      super(match, precacheController2.strategy);
    }
  };

  // node_modules/workbox-precaching/addRoute.js
  function addRoute(options) {
    const precacheController2 = getOrCreatePrecacheController();
    const precacheRoute = new PrecacheRoute(precacheController2, options);
    registerRoute(precacheRoute);
  }

  // node_modules/workbox-precaching/precache.js
  function precache(entries) {
    const precacheController2 = getOrCreatePrecacheController();
    precacheController2.precache(entries);
  }

  // node_modules/workbox-precaching/precacheAndRoute.js
  function precacheAndRoute(entries, options) {
    precache(entries);
    addRoute(options);
  }

  // node_modules/workbox-strategies/utils/messages.js
  var messages2 = {
    strategyStart: (strategyName, request) => `Using ${strategyName} to respond to '${getFriendlyURL(request.url)}'`,
    printFinalResponse: (response) => {
      if (response) {
        logger.groupCollapsed(`View the final response here.`);
        logger.log(response || "[No response returned]");
        logger.groupEnd();
      }
    }
  };

  // node_modules/workbox-strategies/CacheFirst.js
  var CacheFirst = class extends Strategy {
    async _handle(request, handler) {
      const logs = [];
      if (true) {
        finalAssertExports.isInstance(request, Request, {
          moduleName: "workbox-strategies",
          className: this.constructor.name,
          funcName: "makeRequest",
          paramName: "request"
        });
      }
      let response = await handler.cacheMatch(request);
      let error = void 0;
      if (!response) {
        if (true) {
          logs.push(`No response found in the '${this.cacheName}' cache. Will respond with a network request.`);
        }
        try {
          response = await handler.fetchAndCachePut(request);
        } catch (err) {
          if (err instanceof Error) {
            error = err;
          }
        }
        if (true) {
          if (response) {
            logs.push(`Got response from network.`);
          } else {
            logs.push(`Unable to get a response from the network.`);
          }
        }
      } else {
        if (true) {
          logs.push(`Found a cached response in the '${this.cacheName}' cache.`);
        }
      }
      if (true) {
        logger.groupCollapsed(messages2.strategyStart(this.constructor.name, request));
        for (const log of logs) {
          logger.log(log);
        }
        messages2.printFinalResponse(response);
        logger.groupEnd();
      }
      if (!response) {
        throw new WorkboxError("no-response", { url: request.url, error });
      }
      return response;
    }
  };

  // node_modules/workbox-strategies/plugins/cacheOkAndOpaquePlugin.js
  var cacheOkAndOpaquePlugin = {
    cacheWillUpdate: async ({ response }) => {
      if (response.status === 200 || response.status === 0) {
        return response;
      }
      return null;
    }
  };

  // node_modules/workbox-strategies/NetworkFirst.js
  var NetworkFirst = class extends Strategy {
    constructor(options = {}) {
      super(options);
      if (!this.plugins.some((p) => "cacheWillUpdate" in p)) {
        this.plugins.unshift(cacheOkAndOpaquePlugin);
      }
      this._networkTimeoutSeconds = options.networkTimeoutSeconds || 0;
      if (true) {
        if (this._networkTimeoutSeconds) {
          finalAssertExports.isType(this._networkTimeoutSeconds, "number", {
            moduleName: "workbox-strategies",
            className: this.constructor.name,
            funcName: "constructor",
            paramName: "networkTimeoutSeconds"
          });
        }
      }
    }
    async _handle(request, handler) {
      const logs = [];
      if (true) {
        finalAssertExports.isInstance(request, Request, {
          moduleName: "workbox-strategies",
          className: this.constructor.name,
          funcName: "handle",
          paramName: "makeRequest"
        });
      }
      const promises = [];
      let timeoutId;
      if (this._networkTimeoutSeconds) {
        const { id, promise } = this._getTimeoutPromise({ request, logs, handler });
        timeoutId = id;
        promises.push(promise);
      }
      const networkPromise = this._getNetworkPromise({
        timeoutId,
        request,
        logs,
        handler
      });
      promises.push(networkPromise);
      const response = await handler.waitUntil((async () => {
        return await handler.waitUntil(Promise.race(promises)) || await networkPromise;
      })());
      if (true) {
        logger.groupCollapsed(messages2.strategyStart(this.constructor.name, request));
        for (const log of logs) {
          logger.log(log);
        }
        messages2.printFinalResponse(response);
        logger.groupEnd();
      }
      if (!response) {
        throw new WorkboxError("no-response", { url: request.url });
      }
      return response;
    }
    _getTimeoutPromise({ request, logs, handler }) {
      let timeoutId;
      const timeoutPromise = new Promise((resolve) => {
        const onNetworkTimeout = async () => {
          if (true) {
            logs.push(`Timing out the network response at ${this._networkTimeoutSeconds} seconds.`);
          }
          resolve(await handler.cacheMatch(request));
        };
        timeoutId = setTimeout(onNetworkTimeout, this._networkTimeoutSeconds * 1e3);
      });
      return {
        promise: timeoutPromise,
        id: timeoutId
      };
    }
    async _getNetworkPromise({ timeoutId, request, logs, handler }) {
      let error;
      let response;
      try {
        response = await handler.fetchAndCachePut(request);
      } catch (fetchError) {
        if (fetchError instanceof Error) {
          error = fetchError;
        }
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (true) {
        if (response) {
          logs.push(`Got response from network.`);
        } else {
          logs.push(`Unable to get a response from the network. Will respond with a cached response.`);
        }
      }
      if (error || !response) {
        response = await handler.cacheMatch(request);
        if (true) {
          if (response) {
            logs.push(`Found a cached response in the '${this.cacheName}' cache.`);
          } else {
            logs.push(`No response found in the '${this.cacheName}' cache.`);
          }
        }
      }
      return response;
    }
  };

  // node_modules/workbox-core/_private/dontWaitFor.js
  function dontWaitFor(promise) {
    void promise.then(() => {
    });
  }

  // node_modules/idb/build/esm/wrap-idb-value.js
  var instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
  var idbProxyableTypes;
  var cursorAdvanceMethods;
  function getIdbProxyableTypes() {
    return idbProxyableTypes || (idbProxyableTypes = [
      IDBDatabase,
      IDBObjectStore,
      IDBIndex,
      IDBCursor,
      IDBTransaction
    ]);
  }
  function getCursorAdvanceMethods() {
    return cursorAdvanceMethods || (cursorAdvanceMethods = [
      IDBCursor.prototype.advance,
      IDBCursor.prototype.continue,
      IDBCursor.prototype.continuePrimaryKey
    ]);
  }
  var cursorRequestMap = /* @__PURE__ */ new WeakMap();
  var transactionDoneMap = /* @__PURE__ */ new WeakMap();
  var transactionStoreNamesMap = /* @__PURE__ */ new WeakMap();
  var transformCache = /* @__PURE__ */ new WeakMap();
  var reverseTransformCache = /* @__PURE__ */ new WeakMap();
  function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
      const unlisten = () => {
        request.removeEventListener("success", success);
        request.removeEventListener("error", error);
      };
      const success = () => {
        resolve(wrap(request.result));
        unlisten();
      };
      const error = () => {
        reject(request.error);
        unlisten();
      };
      request.addEventListener("success", success);
      request.addEventListener("error", error);
    });
    promise.then((value) => {
      if (value instanceof IDBCursor) {
        cursorRequestMap.set(value, request);
      }
    }).catch(() => {
    });
    reverseTransformCache.set(promise, request);
    return promise;
  }
  function cacheDonePromiseForTransaction(tx) {
    if (transactionDoneMap.has(tx))
      return;
    const done = new Promise((resolve, reject) => {
      const unlisten = () => {
        tx.removeEventListener("complete", complete);
        tx.removeEventListener("error", error);
        tx.removeEventListener("abort", error);
      };
      const complete = () => {
        resolve();
        unlisten();
      };
      const error = () => {
        reject(tx.error || new DOMException("AbortError", "AbortError"));
        unlisten();
      };
      tx.addEventListener("complete", complete);
      tx.addEventListener("error", error);
      tx.addEventListener("abort", error);
    });
    transactionDoneMap.set(tx, done);
  }
  var idbProxyTraps = {
    get(target, prop, receiver) {
      if (target instanceof IDBTransaction) {
        if (prop === "done")
          return transactionDoneMap.get(target);
        if (prop === "objectStoreNames") {
          return target.objectStoreNames || transactionStoreNamesMap.get(target);
        }
        if (prop === "store") {
          return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
        }
      }
      return wrap(target[prop]);
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
    has(target, prop) {
      if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
        return true;
      }
      return prop in target;
    }
  };
  function replaceTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
  }
  function wrapFunction(func) {
    if (func === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype)) {
      return function(storeNames, ...args) {
        const tx = func.call(unwrap(this), storeNames, ...args);
        transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
        return wrap(tx);
      };
    }
    if (getCursorAdvanceMethods().includes(func)) {
      return function(...args) {
        func.apply(unwrap(this), args);
        return wrap(cursorRequestMap.get(this));
      };
    }
    return function(...args) {
      return wrap(func.apply(unwrap(this), args));
    };
  }
  function transformCachableValue(value) {
    if (typeof value === "function")
      return wrapFunction(value);
    if (value instanceof IDBTransaction)
      cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
      return new Proxy(value, idbProxyTraps);
    return value;
  }
  function wrap(value) {
    if (value instanceof IDBRequest)
      return promisifyRequest(value);
    if (transformCache.has(value))
      return transformCache.get(value);
    const newValue = transformCachableValue(value);
    if (newValue !== value) {
      transformCache.set(value, newValue);
      reverseTransformCache.set(newValue, value);
    }
    return newValue;
  }
  var unwrap = (value) => reverseTransformCache.get(value);

  // node_modules/idb/build/esm/index.js
  function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
    const request = indexedDB.open(name, version);
    const openPromise = wrap(request);
    if (upgrade) {
      request.addEventListener("upgradeneeded", (event) => {
        upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction));
      });
    }
    if (blocked)
      request.addEventListener("blocked", () => blocked());
    openPromise.then((db) => {
      if (terminated)
        db.addEventListener("close", () => terminated());
      if (blocking)
        db.addEventListener("versionchange", () => blocking());
    }).catch(() => {
    });
    return openPromise;
  }
  function deleteDB(name, { blocked } = {}) {
    const request = indexedDB.deleteDatabase(name);
    if (blocked)
      request.addEventListener("blocked", () => blocked());
    return wrap(request).then(() => void 0);
  }
  var readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
  var writeMethods = ["put", "add", "delete", "clear"];
  var cachedMethods = /* @__PURE__ */ new Map();
  function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
      return;
    }
    if (cachedMethods.get(prop))
      return cachedMethods.get(prop);
    const targetFuncName = prop.replace(/FromIndex$/, "");
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (!(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))) {
      return;
    }
    const method = async function(storeName, ...args) {
      const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
      let target2 = tx.store;
      if (useIndex)
        target2 = target2.index(args.shift());
      return (await Promise.all([
        target2[targetFuncName](...args),
        isWrite && tx.done
      ]))[0];
    };
    cachedMethods.set(prop, method);
    return method;
  }
  replaceTraps((oldTraps) => ({
    ...oldTraps,
    get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
  }));

  // node_modules/workbox-expiration/_version.js
  try {
    self["workbox:expiration:6.5.2"] && _();
  } catch (e) {
  }

  // node_modules/workbox-expiration/models/CacheTimestampsModel.js
  var DB_NAME = "workbox-expiration";
  var CACHE_OBJECT_STORE = "cache-entries";
  var normalizeURL = (unNormalizedUrl) => {
    const url = new URL(unNormalizedUrl, location.href);
    url.hash = "";
    return url.href;
  };
  var CacheTimestampsModel = class {
    constructor(cacheName) {
      this._db = null;
      this._cacheName = cacheName;
    }
    _upgradeDb(db) {
      const objStore = db.createObjectStore(CACHE_OBJECT_STORE, { keyPath: "id" });
      objStore.createIndex("cacheName", "cacheName", { unique: false });
      objStore.createIndex("timestamp", "timestamp", { unique: false });
    }
    _upgradeDbAndDeleteOldDbs(db) {
      this._upgradeDb(db);
      if (this._cacheName) {
        void deleteDB(this._cacheName);
      }
    }
    async setTimestamp(url, timestamp) {
      url = normalizeURL(url);
      const entry = {
        url,
        timestamp,
        cacheName: this._cacheName,
        id: this._getId(url)
      };
      const db = await this.getDb();
      const tx = db.transaction(CACHE_OBJECT_STORE, "readwrite", {
        durability: "relaxed"
      });
      await tx.store.put(entry);
      await tx.done;
    }
    async getTimestamp(url) {
      const db = await this.getDb();
      const entry = await db.get(CACHE_OBJECT_STORE, this._getId(url));
      return entry === null || entry === void 0 ? void 0 : entry.timestamp;
    }
    async expireEntries(minTimestamp, maxCount) {
      const db = await this.getDb();
      let cursor = await db.transaction(CACHE_OBJECT_STORE).store.index("timestamp").openCursor(null, "prev");
      const entriesToDelete = [];
      let entriesNotDeletedCount = 0;
      while (cursor) {
        const result = cursor.value;
        if (result.cacheName === this._cacheName) {
          if (minTimestamp && result.timestamp < minTimestamp || maxCount && entriesNotDeletedCount >= maxCount) {
            entriesToDelete.push(cursor.value);
          } else {
            entriesNotDeletedCount++;
          }
        }
        cursor = await cursor.continue();
      }
      const urlsDeleted = [];
      for (const entry of entriesToDelete) {
        await db.delete(CACHE_OBJECT_STORE, entry.id);
        urlsDeleted.push(entry.url);
      }
      return urlsDeleted;
    }
    _getId(url) {
      return this._cacheName + "|" + normalizeURL(url);
    }
    async getDb() {
      if (!this._db) {
        this._db = await openDB(DB_NAME, 1, {
          upgrade: this._upgradeDbAndDeleteOldDbs.bind(this)
        });
      }
      return this._db;
    }
  };

  // node_modules/workbox-expiration/CacheExpiration.js
  var CacheExpiration = class {
    constructor(cacheName, config = {}) {
      this._isRunning = false;
      this._rerunRequested = false;
      if (true) {
        finalAssertExports.isType(cacheName, "string", {
          moduleName: "workbox-expiration",
          className: "CacheExpiration",
          funcName: "constructor",
          paramName: "cacheName"
        });
        if (!(config.maxEntries || config.maxAgeSeconds)) {
          throw new WorkboxError("max-entries-or-age-required", {
            moduleName: "workbox-expiration",
            className: "CacheExpiration",
            funcName: "constructor"
          });
        }
        if (config.maxEntries) {
          finalAssertExports.isType(config.maxEntries, "number", {
            moduleName: "workbox-expiration",
            className: "CacheExpiration",
            funcName: "constructor",
            paramName: "config.maxEntries"
          });
        }
        if (config.maxAgeSeconds) {
          finalAssertExports.isType(config.maxAgeSeconds, "number", {
            moduleName: "workbox-expiration",
            className: "CacheExpiration",
            funcName: "constructor",
            paramName: "config.maxAgeSeconds"
          });
        }
      }
      this._maxEntries = config.maxEntries;
      this._maxAgeSeconds = config.maxAgeSeconds;
      this._matchOptions = config.matchOptions;
      this._cacheName = cacheName;
      this._timestampModel = new CacheTimestampsModel(cacheName);
    }
    async expireEntries() {
      if (this._isRunning) {
        this._rerunRequested = true;
        return;
      }
      this._isRunning = true;
      const minTimestamp = this._maxAgeSeconds ? Date.now() - this._maxAgeSeconds * 1e3 : 0;
      const urlsExpired = await this._timestampModel.expireEntries(minTimestamp, this._maxEntries);
      const cache = await self.caches.open(this._cacheName);
      for (const url of urlsExpired) {
        await cache.delete(url, this._matchOptions);
      }
      if (true) {
        if (urlsExpired.length > 0) {
          logger.groupCollapsed(`Expired ${urlsExpired.length} ${urlsExpired.length === 1 ? "entry" : "entries"} and removed ${urlsExpired.length === 1 ? "it" : "them"} from the '${this._cacheName}' cache.`);
          logger.log(`Expired the following ${urlsExpired.length === 1 ? "URL" : "URLs"}:`);
          urlsExpired.forEach((url) => logger.log(`    ${url}`));
          logger.groupEnd();
        } else {
          logger.debug(`Cache expiration ran and found no entries to remove.`);
        }
      }
      this._isRunning = false;
      if (this._rerunRequested) {
        this._rerunRequested = false;
        dontWaitFor(this.expireEntries());
      }
    }
    async updateTimestamp(url) {
      if (true) {
        finalAssertExports.isType(url, "string", {
          moduleName: "workbox-expiration",
          className: "CacheExpiration",
          funcName: "updateTimestamp",
          paramName: "url"
        });
      }
      await this._timestampModel.setTimestamp(url, Date.now());
    }
    async isURLExpired(url) {
      if (!this._maxAgeSeconds) {
        if (true) {
          throw new WorkboxError(`expired-test-without-max-age`, {
            methodName: "isURLExpired",
            paramName: "maxAgeSeconds"
          });
        }
        return false;
      } else {
        const timestamp = await this._timestampModel.getTimestamp(url);
        const expireOlderThan = Date.now() - this._maxAgeSeconds * 1e3;
        return timestamp !== void 0 ? timestamp < expireOlderThan : true;
      }
    }
    async delete() {
      this._rerunRequested = false;
      await this._timestampModel.expireEntries(Infinity);
    }
  };

  // node_modules/workbox-core/registerQuotaErrorCallback.js
  function registerQuotaErrorCallback(callback) {
    if (true) {
      finalAssertExports.isType(callback, "function", {
        moduleName: "workbox-core",
        funcName: "register",
        paramName: "callback"
      });
    }
    quotaErrorCallbacks.add(callback);
    if (true) {
      logger.log("Registered a callback to respond to quota errors.", callback);
    }
  }

  // node_modules/workbox-expiration/ExpirationPlugin.js
  var ExpirationPlugin = class {
    constructor(config = {}) {
      this.cachedResponseWillBeUsed = async ({ event, request, cacheName, cachedResponse }) => {
        if (!cachedResponse) {
          return null;
        }
        const isFresh = this._isResponseDateFresh(cachedResponse);
        const cacheExpiration = this._getCacheExpiration(cacheName);
        dontWaitFor(cacheExpiration.expireEntries());
        const updateTimestampDone = cacheExpiration.updateTimestamp(request.url);
        if (event) {
          try {
            event.waitUntil(updateTimestampDone);
          } catch (error) {
            if (true) {
              if ("request" in event) {
                logger.warn(`Unable to ensure service worker stays alive when updating cache entry for '${getFriendlyURL(event.request.url)}'.`);
              }
            }
          }
        }
        return isFresh ? cachedResponse : null;
      };
      this.cacheDidUpdate = async ({ cacheName, request }) => {
        if (true) {
          finalAssertExports.isType(cacheName, "string", {
            moduleName: "workbox-expiration",
            className: "Plugin",
            funcName: "cacheDidUpdate",
            paramName: "cacheName"
          });
          finalAssertExports.isInstance(request, Request, {
            moduleName: "workbox-expiration",
            className: "Plugin",
            funcName: "cacheDidUpdate",
            paramName: "request"
          });
        }
        const cacheExpiration = this._getCacheExpiration(cacheName);
        await cacheExpiration.updateTimestamp(request.url);
        await cacheExpiration.expireEntries();
      };
      if (true) {
        if (!(config.maxEntries || config.maxAgeSeconds)) {
          throw new WorkboxError("max-entries-or-age-required", {
            moduleName: "workbox-expiration",
            className: "Plugin",
            funcName: "constructor"
          });
        }
        if (config.maxEntries) {
          finalAssertExports.isType(config.maxEntries, "number", {
            moduleName: "workbox-expiration",
            className: "Plugin",
            funcName: "constructor",
            paramName: "config.maxEntries"
          });
        }
        if (config.maxAgeSeconds) {
          finalAssertExports.isType(config.maxAgeSeconds, "number", {
            moduleName: "workbox-expiration",
            className: "Plugin",
            funcName: "constructor",
            paramName: "config.maxAgeSeconds"
          });
        }
      }
      this._config = config;
      this._maxAgeSeconds = config.maxAgeSeconds;
      this._cacheExpirations = /* @__PURE__ */ new Map();
      if (config.purgeOnQuotaError) {
        registerQuotaErrorCallback(() => this.deleteCacheAndMetadata());
      }
    }
    _getCacheExpiration(cacheName) {
      if (cacheName === cacheNames.getRuntimeName()) {
        throw new WorkboxError("expire-custom-caches-only");
      }
      let cacheExpiration = this._cacheExpirations.get(cacheName);
      if (!cacheExpiration) {
        cacheExpiration = new CacheExpiration(cacheName, this._config);
        this._cacheExpirations.set(cacheName, cacheExpiration);
      }
      return cacheExpiration;
    }
    _isResponseDateFresh(cachedResponse) {
      if (!this._maxAgeSeconds) {
        return true;
      }
      const dateHeaderTimestamp = this._getDateHeaderTimestamp(cachedResponse);
      if (dateHeaderTimestamp === null) {
        return true;
      }
      const now = Date.now();
      return dateHeaderTimestamp >= now - this._maxAgeSeconds * 1e3;
    }
    _getDateHeaderTimestamp(cachedResponse) {
      if (!cachedResponse.headers.has("date")) {
        return null;
      }
      const dateHeader = cachedResponse.headers.get("date");
      const parsedDate = new Date(dateHeader);
      const headerTime = parsedDate.getTime();
      if (isNaN(headerTime)) {
        return null;
      }
      return headerTime;
    }
    async deleteCacheAndMetadata() {
      for (const [cacheName, cacheExpiration] of this._cacheExpirations) {
        await self.caches.delete(cacheName);
        await cacheExpiration.delete();
      }
      this._cacheExpirations = /* @__PURE__ */ new Map();
    }
  };

  // sw.js
  function waitUntil2(event, asyncFn) {
    const returnPromise = asyncFn();
    event.waitUntil(returnPromise);
    return returnPromise;
  }
  var offlineAlert = async (url) => {
    console.log(`fetch failure - we are offline, cannot access ${url}`);
    const clients = await self.clients.matchAll({ type: "window" });
    let payload = "generic";
    if (/\.(?:png|gif|webm|jpg|webp|jpeg|svg)$/m.test(url))
      payload = "image";
    else if (/\.json$/m.test(url))
      payload = "json";
    for (const client of clients) {
      client.postMessage({ type: "FETCH_ERROR", payload });
    }
  };
  var resetAll = async () => {
    const cacheNames2 = await caches.keys();
    for (const cacheName of cacheNames2) {
      await caches.delete(cacheName);
      const cacheExpiration = new CacheExpiration(cacheName, { maxEntries: 1 });
      await cacheExpiration.delete();
      console.log(`deleted cache "${cacheName}"`);
    }
    await self.registration.unregister();
    const clients = await self.clients.matchAll();
    clients.forEach((client) => client.navigate(client.url));
  };
  addEventListener("message", (event) => {
    switch (event.data.type) {
      case "RESET": {
        console.log("Resetting...");
        event.waitUntil(resetAll());
        break;
      }
    }
  });
  precacheAndRoute([{ "revision": "f13f83c9a147fbb85b1384d78605be91", "url": "js/abilities.js" }, { "revision": "4f0f93fae537b8feff82a5fd018b9624", "url": "js/actions.js" }, { "revision": "6206385e36b6157db5606076371a1903", "url": "js/adventure.js" }, { "revision": "8c48dcdc47107195836ac01c92f74bb4", "url": "js/adventures.js" }, { "revision": "77ac43c82d6a1c468699e50bce9e9644", "url": "js/afflictions.js" }, { "revision": "3965a0feff5a2f276e88348d7fb399b5", "url": "js/ancestries.js" }, { "revision": "e022566caf798af5e93862ff6a70ee69", "url": "js/archetypes.js" }, { "revision": "a29a13de5d34baccb22a959f1dc09b2d", "url": "js/backgrounds.js" }, { "revision": "93d9001f3c183b3f5c48270a96c1f12b", "url": "js/bestiary-encounterbuilder.js" }, { "revision": "3a3e6640c1835cd6d946234be6980d89", "url": "js/bestiary.js" }, { "revision": "5161befec5d62f082a0bcd02c35cba5d", "url": "js/blacklist.js" }, { "revision": "52916f597f477abface4e6a9207a3c0f", "url": "js/book.js" }, { "revision": "90b0d5d09eedb678e085a4916cdb2c8a", "url": "js/books.js" }, { "revision": "84a4f1e28d5c1b4df5892f9fbd4efcad", "url": "js/bookslist.js" }, { "revision": "11e1f98865249de49b64b747c723a2ba", "url": "js/bookutils.js" }, { "revision": "3978bf36f64d76d140c99444bee2b0fd", "url": "js/browsercheck.js" }, { "revision": "b14f6a94a66f967bf2cf789408d9de0b", "url": "js/classes.js" }, { "revision": "b5636f79cca64c2b22220a8a21d72121", "url": "js/companionsfamiliars.js" }, { "revision": "908ec85cf6b48415f9994d96ab93cb6c", "url": "js/conditions.js" }, { "revision": "46d5f97fd116962d4d6e23924e04a352", "url": "js/converter.js" }, { "revision": "b14f1af04915feaa67243b055045358d", "url": "js/converterutils.js" }, { "revision": "e431c77824e82bdb23037d124c663726", "url": "js/deepbg.js" }, { "revision": "440c20efaa3309fa32e3f26488d07e05", "url": "js/deities.js" }, { "revision": "5100ca2a4e704f0e7fd42902c95a70c8", "url": "js/encountergen.js" }, { "revision": "64eafb133e368dc3f54aee4097d90c35", "url": "js/feats.js" }, { "revision": "297f267403fc59a9c578443e58958f70", "url": "js/filter-abilities.js" }, { "revision": "d62ad00a5d77231cac268c5b82dbd978", "url": "js/filter-actions.js" }, { "revision": "dbc9994f604ea6f011a8ff1d1d6e5c96", "url": "js/filter-afflictions.js" }, { "revision": "d894be4b7c6c60a42b9c99716555da4f", "url": "js/filter-ancestries.js" }, { "revision": "ddde3f4ef37c4d43bc9e5e6e7d995ae5", "url": "js/filter-archetypes.js" }, { "revision": "5c91cb77091a954fe053244e66a1b0f0", "url": "js/filter-backgrounds.js" }, { "revision": "6eb177716a8c5711b8634d7e4004d16d", "url": "js/filter-bestiary.js" }, { "revision": "ab0de13c9330feea1014603d6e3479e0", "url": "js/filter-classes.js" }, { "revision": "b317510cbf91fe73d6d45df233c06d11", "url": "js/filter-companionsfamiliars.js" }, { "revision": "7b7c53204eb33b6b4a7990174cc8831c", "url": "js/filter-conditions.js" }, { "revision": "2cd9ea8e2039c53930688260d8cc11d1", "url": "js/filter-deities.js" }, { "revision": "67a93c9d474b547003ee641a27309a8d", "url": "js/filter-feats.js" }, { "revision": "3b1fdabde26b223a94dd720be474b95c", "url": "js/filter-hazards.js" }, { "revision": "90da71edc71fcc4e838e5b535aabbef4", "url": "js/filter-items.js" }, { "revision": "b4558983677ef1f3aff2b9bdf5bba696", "url": "js/filter-languages.js" }, { "revision": "6f39a2db47c8466e476f41cf3395c09d", "url": "js/filter-optionalfeatures.js" }, { "revision": "b1cede5d39026bf9cad79192c76d3278", "url": "js/filter-organizations.js" }, { "revision": "fd0c1c6f8a1ee799de9ec26a73dee6c6", "url": "js/filter-places.js" }, { "revision": "1aa23b841a58602bcef90a6088935e7c", "url": "js/filter-rituals.js" }, { "revision": "413c699b64a18b937b150adbaa622bb9", "url": "js/filter-spells.js" }, { "revision": "ce4cfafedaa2ff5fadad5d7b3d36acf9", "url": "js/filter-tables.js" }, { "revision": "e4ee1df6bb44b7e5286c41a256789be6", "url": "js/filter-traits.js" }, { "revision": "f9093950be072ce948797012d3f95edc", "url": "js/filter-variantrules.js" }, { "revision": "cd811caecd4bf8bb8a6d7d0bf3c3a6ea", "url": "js/filter-vehicles.js" }, { "revision": "0a92555e2bb6d6af3fecf034d3a0524e", "url": "js/filter.js" }, { "revision": "4ead12ba276e272165db74b61c00f489", "url": "js/genutils.js" }, { "revision": "5fc03cf73cf257c6c15b4b74749afa6f", "url": "js/gmscreen-counter.js" }, { "revision": "f8aeaae81a1c78bdc849033af48f5979", "url": "js/gmscreen-initiativetracker.js" }, { "revision": "24b45f19d7236ce7c73a3ec19860f5fc", "url": "js/gmscreen-mapper.js" }, { "revision": "01cf6d3bdd76505c37ed536fd33bec32", "url": "js/gmscreen-moneyconverter.js" }, { "revision": "c20c71f78f49e6b539e75d164b895d09", "url": "js/gmscreen-playerinitiativetracker.js" }, { "revision": "2515023f9bd903c5ccbaa8ff2d498a6b", "url": "js/gmscreen-timetracker.js" }, { "revision": "1e178575c801bb7aabd4754cadb1670f", "url": "js/gmscreen.js" }, { "revision": "894b983859c6683415e22fa2123c1625", "url": "js/hazards.js" }, { "revision": "e862c5c29458795ee32af099e06de58a", "url": "js/header.js" }, { "revision": "082383b2e17e5b492675fa355d493eab", "url": "js/initiativetrackerutils.js" }, { "revision": "e527866d2d6240fd16b1a185f1ef4111", "url": "js/inittrackerplayerview.js" }, { "revision": "e9b31b728521fa74e2ae66a20e78638a", "url": "js/items-runebuilder.js" }, { "revision": "7c5e2246ea10687300957334c24ad6d2", "url": "js/items.js" }, { "revision": "574832fa0460d2252321b95a937391f2", "url": "js/langdemo.js" }, { "revision": "c8d0bce9f5b8dbeb6b8aff1b0c6def3a", "url": "js/langdemo2.js" }, { "revision": "f7db9a0fb726de0abecc54712471e167", "url": "js/languages.js" }, { "revision": "9e619bb43ce7166498fb4e516583846b", "url": "js/list2.js" }, { "revision": "eec7fc955eb6cd5a5d0d337ce38d3f5c", "url": "js/listpage.js" }, { "revision": "a547b8c9793a51cb848ec43399d1e184", "url": "js/managebrew.js" }, { "revision": "0b0d8321a99c81b83869cff6edde1b69", "url": "js/multisource.js" }, { "revision": "1ddc29240cda11440744badcaa694416", "url": "js/optionalfeatures.js" }, { "revision": "89d9d0927eeab0075a147caa8e03142e", "url": "js/organizations.js" }, { "revision": "92a4c097344088ca76ecf2a0726b3b93", "url": "js/parser.js" }, { "revision": "fba862322896731f76afa42ea98c7a4f", "url": "js/places.js" }, { "revision": "d541d993ad43ad531577df24002b898b", "url": "js/quickreference.js" }, { "revision": "0e742dfd47f4d4cfafb20e40608528ea", "url": "js/render-map.js" }, { "revision": "1eac82672fcc8da3c32baac9b5a1062a", "url": "js/renderdemo.js" }, { "revision": "dac6a6460a5ec2667b6d081570dadde2", "url": "js/rituals.js" }, { "revision": "b477d4063d500b1acc73bc632597b3c2", "url": "js/rolang.js" }, { "revision": "b180a9e281b350d033c9ce35bc3e3040", "url": "js/search.js" }, { "revision": "07d6f76c328a7f62af037ff00fce1808", "url": "js/seo-loader.js" }, { "revision": "2e81663ddcde5207ff7adb774e59430e", "url": "js/shared.js" }, { "revision": "e0289c4104c6fd2bbba07498a3974f35", "url": "js/spells.js" }, { "revision": "74434c2a9e1123dc7a25136b9c2dff75", "url": "js/tablepage.js" }, { "revision": "6e4c12245cd0979bce7aafa461965ce3", "url": "js/tables.js" }, { "revision": "ec65541a8fa50bcb7ce42cbd0f71d706", "url": "js/textconverter.js" }, { "revision": "134752b9757463d7b2dd2058e2895a3d", "url": "js/tokenizer.js" }, { "revision": "66d7d5020db2d98a02ee906bcc973128", "url": "js/traits.js" }, { "revision": "d2d97a685dc33d4dddd6fda0eb64360a", "url": "js/utils-changelog.js" }, { "revision": "b33795807768b732bc32d33670e1e1a3", "url": "js/utils-licenses.js" }, { "revision": "7d6e5092dcc9dd27fc3219eacb73a1f2", "url": "js/utils-list.js" }, { "revision": "bb55e2ea3b062841fff360ac60d520f2", "url": "js/utils-p2p.js" }, { "revision": "71254540c77ba6f6ac22ef77763a024c", "url": "js/utils-proporder.js" }, { "revision": "1076c02ae29173cd8c22cd6d071c55b0", "url": "js/variantrules.js" }, { "revision": "f0ee92f004bc00139dc4369a1b2c4b83", "url": "js/vehicles.js" }, { "revision": "43227f0b27fb10589738325bee695096", "url": "lib/ace.js" }, { "revision": "c8f51857c2b593d5ca3e61d3e2614202", "url": "lib/bootstrap-select.min.js" }, { "revision": "76cba0afeefaac9a2c2b5fae0501563f", "url": "lib/bootstrap.min.js" }, { "revision": "0b5560b4ebf737b2f5ce8f11c2ff6e73", "url": "lib/elasticlunr.js" }, { "revision": "45b80f460bddf237db68b44c35b7c335", "url": "lib/ext-searchbox.js" }, { "revision": "00a88512d92063be91f4dc9aee908a9c", "url": "lib/jquery-ui-slider-pip.js" }, { "revision": "fa801fc74dd3fd205820398edfd90386", "url": "lib/jquery-ui.js" }, { "revision": "220afd743d9e9643852e31a135a9f3ae", "url": "lib/jquery.js" }, { "revision": "67b68a5a86082dd366091650f95919be", "url": "lib/jquery.panzoom.js" }, { "revision": "6de1bf1f7f98328eba5295e0e8a00110", "url": "lib/localforage.js" }, { "revision": "cffdefcc7477466752a3433488c43036", "url": "lib/lzma.js" }, { "revision": "ca3d5d95c83fd5209d4bb549cd76af6d", "url": "lib/peerjs.js" }, { "revision": "fbd68ec03eeefb8972de94a196847463", "url": "css/bootstrap-select.min.css" }, { "revision": "b366268ad29ab8ac0b4fa80e4443855f", "url": "css/bootstrap.css" }, { "revision": "de97b7db2b1195829599af9cfeb914c6", "url": "css/classes.css" }, { "revision": "73f50f8eb1e2839c5c7732f89e8e75ef", "url": "css/fontawesome.css" }, { "revision": "d0d08076e44cd8a6bb1219c6efa721f1", "url": "css/jquery-ui-slider-pips.css" }, { "revision": "688e4e3ea86547bb22c74b4df759920f", "url": "css/jquery-ui.css" }, { "revision": "a6fc67670251132e3eb14a807aa466de", "url": "css/list-page--grouped.css" }, { "revision": "939fd45be687b473e266348825fb5697", "url": "css/search.css" }, { "revision": "347a099cdbbc96bee297661935b15a85", "url": "css/style.css" }, { "revision": "605924a026760bd0ee1dc0b5789f646b", "url": "homebrew/index.json" }, { "revision": "e0f5554de06c8563a55c6605f42b241c", "url": "data/abilities.json" }, { "revision": "a1e374aad98f9a33b682b137aaee9985", "url": "data/actions.json" }, { "revision": "0af470f4c26d5357c1e7faffc69fd230", "url": "data/adventures.json" }, { "revision": "89c6165644275d1dea3922b7035b653e", "url": "data/afflictions.json" }, { "revision": "8ff7084306e3c9692e15bf2e8c1f03d1", "url": "data/archetypes.json" }, { "revision": "be71ef761edbbe79d5e9185ee3189e4e", "url": "data/books.json" }, { "revision": "d56657d396f2570c513cdf8486c65741", "url": "data/changelog.json" }, { "revision": "ced6e272d6684563d7c379a289ff80af", "url": "data/companionsfamiliars.json" }, { "revision": "c26c299c9444a43363765189a35560cc", "url": "data/conditions.json" }, { "revision": "a101d437e28ecc0d1c727f4a2688fc05", "url": "data/deities.json" }, { "revision": "f27716d2e7e83ed8ac7de8db09ba3f62", "url": "data/domains.json" }, { "revision": "f666890e496292dcee5c5b19c04fcedd", "url": "data/fluff-deities.json" }, { "revision": "929e4918c736497bf84b03e65c465408", "url": "data/fluff-items.json" }, { "revision": "29639f9bf97dba5679ad718f3dfb9edc", "url": "data/fluff-organizations.json" }, { "revision": "7cc271512ca1309f9e3b8a55b23caf63", "url": "data/generic.json" }, { "revision": "544a57728d13a8dad1bde3f14f679d4d", "url": "data/groups.json" }, { "revision": "ce209963096a4cfc369f6feec57eb7f0", "url": "data/hazards.json" }, { "revision": "35bccb1ccf5bb630cb3f7f1a46a58886", "url": "data/languages.json" }, { "revision": "d705b29bf10b0cff6db5ce06cdb64285", "url": "data/licenses.json" }, { "revision": "ec1e7dda429a5ff8d6a1138c1e914a73", "url": "data/optionalfeatures.json" }, { "revision": "40e3b4563fcf514ab6abff29926dfa85", "url": "data/organizations.json" }, { "revision": "e0b68f295935e6c0cec3f88c6f717b24", "url": "data/places.json" }, { "revision": "99057acb1c5019dedf495ec309f24290", "url": "data/quickrules.json" }, { "revision": "f25862f4475141f6785cfd5ae10fc137", "url": "data/renderdemo.json" }, { "revision": "eb23b1cbda890fda8f738294d1b5331d", "url": "data/rituals.json" }, { "revision": "70ebcd212b11ec31dd86b608aa8dc3c5", "url": "data/skills.json" }, { "revision": "70126cdd2beb53408e6d1b5c8b6ef288", "url": "data/tables.json" }, { "revision": "90b187987a6fe51b6f2cf8723f47f3fc", "url": "data/traits.json" }, { "revision": "4e388a02744a5f20efb1e9e86e6f1620", "url": "data/variantrules.json" }, { "revision": "13e4a2942a85d88306629d4d8a0c6c39", "url": "data/vehicles.json" }, { "revision": "83c44478d7207cd94feb7cb8eb8a2256", "url": "data/ancestries/ancestry-anadi.json" }, { "revision": "f3d4c7c03cfec3a785ae34b77fc8b1e4", "url": "data/ancestries/ancestry-android.json" }, { "revision": "ab30a3eed03aed2b11d1ba9df59d1b2e", "url": "data/ancestries/ancestry-automaton.json" }, { "revision": "ae70cc55b325754951b4675b96da58dc", "url": "data/ancestries/ancestry-azarketi.json" }, { "revision": "8041c679f85b8de2f3243aaf5668fa5c", "url": "data/ancestries/ancestry-catfolk.json" }, { "revision": "5ecbe06f589e4e5b3243c13e4bf6a3b7", "url": "data/ancestries/ancestry-conrasu.json" }, { "revision": "e6fef335dbf43e1d0168b48bbb51cbec", "url": "data/ancestries/ancestry-dwarf.json" }, { "revision": "3ea18ec6ac8511e9edea4f97b684330b", "url": "data/ancestries/ancestry-elf.json" }, { "revision": "8dd6e773d1d0b0c4b28c1b0101cd5f6c", "url": "data/ancestries/ancestry-fetchling.json" }, { "revision": "365bb6ff4f53d34966596426b8cac947", "url": "data/ancestries/ancestry-fleshwarp.json" }, { "revision": "c20b2383a6e4b968f8b035643fbfc68a", "url": "data/ancestries/ancestry-gnoll.json" }, { "revision": "a1102375d371cd87e6292f21c2207ac3", "url": "data/ancestries/ancestry-gnome.json" }, { "revision": "1216ece65a5c9b050f87e20ccaba2862", "url": "data/ancestries/ancestry-goblin.json" }, { "revision": "1535801fa219435a78c137dfe3664f3e", "url": "data/ancestries/ancestry-goloma.json" }, { "revision": "a3a0b479a128613b7e131532a28f7502", "url": "data/ancestries/ancestry-grippli.json" }, { "revision": "deffbdbb7c6244f13f54073d4136f7f0", "url": "data/ancestries/ancestry-halfling.json" }, { "revision": "42d801e1845ab0402dbd49e7f204eb9a", "url": "data/ancestries/ancestry-hobgoblin.json" }, { "revision": "9d14eac593f1956217b2a57903ca2715", "url": "data/ancestries/ancestry-human.json" }, { "revision": "51570767eb73056d73eb8c3198533fd9", "url": "data/ancestries/ancestry-kitsune.json" }, { "revision": "58899527b9faf1fd96cafbe782f2541d", "url": "data/ancestries/ancestry-kobold.json" }, { "revision": "7f1f1fb40ae979bc2aeb5582a90c4a23", "url": "data/ancestries/ancestry-leshy.json" }, { "revision": "5381c0296d935c2f71d398f2bf892a3f", "url": "data/ancestries/ancestry-lizardfolk.json" }, { "revision": "9d2bb53a82749cd7472b4ac2c640dfd8", "url": "data/ancestries/ancestry-orc.json" }, { "revision": "cccd2816606aea0e93aacd6f52d860cc", "url": "data/ancestries/ancestry-poppet.json" }, { "revision": "340c1e634d352c702fad2c6fbc4669d6", "url": "data/ancestries/ancestry-ratfolk.json" }, { "revision": "b7d345cdd7af85ff1b5d7bf6f17e8d98", "url": "data/ancestries/ancestry-shisk.json" }, { "revision": "045b6b9a1755c72699d63bb3b7349ddd", "url": "data/ancestries/ancestry-shoony.json" }, { "revision": "138978e7917a04b713b669be87929a02", "url": "data/ancestries/ancestry-sprite.json" }, { "revision": "3da9b8bfd69178a72a5e27883c2c86ba", "url": "data/ancestries/ancestry-strix.json" }, { "revision": "55cb5f22c24ca43b70033b8d93b54516", "url": "data/ancestries/ancestry-tengu.json" }, { "revision": "badaac0317b2d9650c352e756166734a", "url": "data/ancestries/index.json" }, { "revision": "7344a4f3111e978b47b35ca10a3d1952", "url": "data/ancestries/versatile-heritages.json" }, { "revision": "ff72b70accc1ce212ef2a5adfe7cca8e", "url": "data/backgrounds/backgrounds-aoa0.json" }, { "revision": "06812a354e9c10e4387049c15547e831", "url": "data/backgrounds/backgrounds-aoa4.json" }, { "revision": "94a62802fb78986d417921df65acbdb6", "url": "data/backgrounds/backgrounds-aoa6.json" }, { "revision": "6b2f16125c920c1069655819b75fd784", "url": "data/backgrounds/backgrounds-aoe0.json" }, { "revision": "8bb5e970ab1cfaf6a69a9628c6c50f4f", "url": "data/backgrounds/backgrounds-aoe4.json" }, { "revision": "e395cc433608e276e88ae37b76bb626d", "url": "data/backgrounds/backgrounds-apg.json" }, { "revision": "4dd083883b9c4c264852bdb7dc726d27", "url": "data/backgrounds/backgrounds-av0.json" }, { "revision": "b63bbbc1954d3b54ced126898e136252", "url": "data/backgrounds/backgrounds-crb.json" }, { "revision": "bc1f91a918b4a55fa8d30fd9900d9af9", "url": "data/backgrounds/backgrounds-ec0.json" }, { "revision": "2dc51d8c6b16ad62583afd74fb2499b9", "url": "data/backgrounds/backgrounds-ec3.json" }, { "revision": "c7f56749b65f48afdf76c0c72e98c721", "url": "data/backgrounds/backgrounds-frp0.json" }, { "revision": "5aa33004f68fac7ecf3ed495ebde8247", "url": "data/backgrounds/backgrounds-g&g.json" }, { "revision": "235a943c94da7977794944b283934557", "url": "data/backgrounds/backgrounds-lopsg.json" }, { "revision": "ae6adcee78a1830af73a205aa03dd3b5", "url": "data/backgrounds/backgrounds-lowg.json" }, { "revision": "b06bdf492a633e83993c99957928579b", "url": "data/backgrounds/backgrounds-som.json" }, { "revision": "cf7d959b3304fadaf1c4e1001fbc3ddb", "url": "data/backgrounds/backgrounds-sot0.json" }, { "revision": "755d51f95b5a904f522bea1eefb03a55", "url": "data/backgrounds/fluff-backgrounds.json" }, { "revision": "f546e3e2de43bbd2d4bd3783830bb6a8", "url": "data/backgrounds/index.json" }, { "revision": "b8de384cc0ecdf9f95c6b8b7f39a012f", "url": "data/bestiary/creatures-aoa1.json" }, { "revision": "a30bd014b3291de3b9828db0dce2453e", "url": "data/bestiary/creatures-aoa2.json" }, { "revision": "126432bdfede64569c165044f6f2f0af", "url": "data/bestiary/creatures-aoa3.json" }, { "revision": "8f94f54bb822c13f55b7d03385989d59", "url": "data/bestiary/creatures-aoa4.json" }, { "revision": "5f9f5e72b6f2946197ba94109feaea9e", "url": "data/bestiary/creatures-aoa5.json" }, { "revision": "0e4e336fe8a411e7ba0824ceae35639d", "url": "data/bestiary/creatures-aoa6.json" }, { "revision": "e1eb9a7abf085c5052e89bd4607cb284", "url": "data/bestiary/creatures-aoe1.json" }, { "revision": "9b2c0b6360312324f773461a30f52121", "url": "data/bestiary/creatures-aoe2.json" }, { "revision": "a4c02559061c31868d52ee81ac6a9f8e", "url": "data/bestiary/creatures-aoe3.json" }, { "revision": "6d35628ec9a443c9b56c61082f2bad77", "url": "data/bestiary/creatures-aoe4.json" }, { "revision": "ceb68a0a83028bfb2acc70e55773567a", "url": "data/bestiary/creatures-aoe5.json" }, { "revision": "8c14c1d820980f39f7268ecf359be7ed", "url": "data/bestiary/creatures-aoe6.json" }, { "revision": "df719e8122f1dfd401e5b912c0f91ccb", "url": "data/bestiary/creatures-av1.json" }, { "revision": "f67a63bf132c01c4ab626e1ae1d73c6f", "url": "data/bestiary/creatures-av2.json" }, { "revision": "6d8ba65f81a307f41b7c4d7a1ebc7bf1", "url": "data/bestiary/creatures-av3.json" }, { "revision": "39c09112c3d3a1d0484a720704f2bc29", "url": "data/bestiary/creatures-bst.json" }, { "revision": "708353dcfd219e51f469be6342ab1151", "url": "data/bestiary/creatures-bst2.json" }, { "revision": "9745aa6a2851a583e4f7cd6b67c5ce4a", "url": "data/bestiary/creatures-bst3.json" }, { "revision": "c9dfde25eaf94de94ea047c86d1b771d", "url": "data/bestiary/creatures-crb.json" }, { "revision": "f16464084d35e365bb2a5dfa1129fc1e", "url": "data/bestiary/creatures-ec1.json" }, { "revision": "f69846c036e09723cc40c210f21d050f", "url": "data/bestiary/creatures-ec2.json" }, { "revision": "bea07df6e0e60d2791afff11d540ab62", "url": "data/bestiary/creatures-ec3.json" }, { "revision": "02ffb1d580c7524f9005eefc7ca4cbed", "url": "data/bestiary/creatures-ec4.json" }, { "revision": "45296f782ca04a41c9514219724e3110", "url": "data/bestiary/creatures-ec5.json" }, { "revision": "4bc9a2fc58a88abd7c12fdf20f0d8621", "url": "data/bestiary/creatures-ec6.json" }, { "revision": "f07f00a52c83acffe77e2074938f92dd", "url": "data/bestiary/creatures-fop.json" }, { "revision": "aa3f2c4b8a6aa7dd664d103cae516581", "url": "data/bestiary/creatures-frp1.json" }, { "revision": "c9e95c0d9444b36b98bd25da95982dd4", "url": "data/bestiary/creatures-frp2.json" }, { "revision": "d3cef2d6861e45bf57e3a6f310bcd2e1", "url": "data/bestiary/creatures-frp3.json" }, { "revision": "ab1c2dbab8bb141b1c51622f4e701d8f", "url": "data/bestiary/creatures-gmg.json" }, { "revision": "167ccd79bc2f9d9c20183ddcadcfbc88", "url": "data/bestiary/creatures-lome.json" }, { "revision": "d009a7d58f1cc3749039308388943955", "url": "data/bestiary/creatures-ltiba.json" }, { "revision": "2acff5852e8e3aaff93120f74d67f10f", "url": "data/bestiary/creatures-sli.json" }, { "revision": "22d2e42e4399154a2ac24b08b4956847", "url": "data/bestiary/creatures-sot1.json" }, { "revision": "3ab25aa5c389860476b70bac12bf9af3", "url": "data/bestiary/creatures-sot2.json" }, { "revision": "d39e35755200e5a32eed8e45f825e90b", "url": "data/bestiary/creatures-tio.json" }, { "revision": "cd65dadccbaab7ed491bc01a6cdb7e57", "url": "data/bestiary/fluff-creatures-av3.json" }, { "revision": "a88153a71c8eada22208541fd7a31bce", "url": "data/bestiary/fluff-creatures-bst.json" }, { "revision": "51701481c467263c4687c9edea84bf06", "url": "data/bestiary/fluff-creatures-bst2.json" }, { "revision": "10b0708270fa835077a6ff25158ac7bc", "url": "data/bestiary/fluff-creatures-bst3.json" }, { "revision": "082ee70b9882b2d200760631d19f2766", "url": "data/bestiary/fluff-creatures-gmg.json" }, { "revision": "8ae3d4c51a562b39d29030f112899578", "url": "data/bestiary/fluff-creatures-lome.json" }, { "revision": "96650eb7301a513c566b94182131e1d2", "url": "data/bestiary/fluff-creatures-sot1.json" }, { "revision": "c3b1ed9deccc63474ae3ee11bdb24b8e", "url": "data/bestiary/fluff-index.json" }, { "revision": "b38cbfac4423c6d6335679487137e21e", "url": "data/bestiary/index.json" }, { "revision": "9ceea0287aa972bbbd52c34166f57211", "url": "data/book/book-crb.json" }, { "revision": "685d9306dbe7cd2ea7cc7ea4212a6638", "url": "data/book/book-gmg.json" }, { "revision": "fe25bf8d94914805b715ad118e7d4eec", "url": "data/book/book-lowg.json" }, { "revision": "e8a36c292ddb37a174468cba2edcb478", "url": "data/book/book-som.json" }, { "revision": "27e7e888602893c7c820868b2f7542f2", "url": "data/class/class-alchemist.json" }, { "revision": "b9a038eb4089df8235388b3939ae02de", "url": "data/class/class-barbarian.json" }, { "revision": "2a2f64458fe9e48e07f10f61cd509900", "url": "data/class/class-bard.json" }, { "revision": "ebc319423f0a71f892627193f980e7db", "url": "data/class/class-champion.json" }, { "revision": "6cba090993985a78b1937b842a61f70c", "url": "data/class/class-cleric.json" }, { "revision": "a5a35ab7f005ab001b9015767978242f", "url": "data/class/class-druid.json" }, { "revision": "6617d6bf3dcc509cfd4e03dba1d2dccf", "url": "data/class/class-fighter.json" }, { "revision": "eadd1b644a1a2157e50e9d572007ed02", "url": "data/class/class-gunslinger.json" }, { "revision": "8b84bca857951665e6614fc511b7a600", "url": "data/class/class-inventor.json" }, { "revision": "83a3933ea19808f40dcae215bae831a5", "url": "data/class/class-investigator.json" }, { "revision": "5e47a753c669b918180abee00e9a1079", "url": "data/class/class-magus.json" }, { "revision": "81c196cf017f94ebc090c48841e3a978", "url": "data/class/class-monk.json" }, { "revision": "ede3a813537c9eb03714e8d5b6b3d1cd", "url": "data/class/class-oracle.json" }, { "revision": "f1aaa7e919f18a48b5440350e4dfc221", "url": "data/class/class-ranger.json" }, { "revision": "74fc696fafb0a53e014085ac47fcff32", "url": "data/class/class-rogue.json" }, { "revision": "fc389eeac49cf8594874e0e46e362c94", "url": "data/class/class-sorcerer.json" }, { "revision": "f0fe8a9d367ff23d863e2630435a0d32", "url": "data/class/class-summoner.json" }, { "revision": "e19c5ea97cf99c00e5baf05e56c7f0bd", "url": "data/class/class-swashbuckler.json" }, { "revision": "7643f7890340d9a37e20610dc801634f", "url": "data/class/class-witch.json" }, { "revision": "227bb324f20fb22a490736ee29b70d7a", "url": "data/class/class-wizard.json" }, { "revision": "4918792f82c96f9774c2aae1eb955b17", "url": "data/class/index.json" }, { "revision": "dceea6e15cba7e89d61e12f0763cd14e", "url": "data/feats/feats-aoa3.json" }, { "revision": "e86ac2d6157664b2c468436f99b31078", "url": "data/feats/feats-aoa4.json" }, { "revision": "77ca8e424b81e63ceaca2c2d64b80487", "url": "data/feats/feats-aoa5.json" }, { "revision": "b021c9f24b46d6030865bf67b06accc2", "url": "data/feats/feats-aoa6.json" }, { "revision": "1f07167babf5053f7d2f3c4cd6a65df9", "url": "data/feats/feats-aoe1.json" }, { "revision": "09a092701d9a7e1dc3565f11454b4638", "url": "data/feats/feats-aoe2.json" }, { "revision": "e44f46cdefeab7a6a722642a85316b62", "url": "data/feats/feats-aoe3.json" }, { "revision": "05492c220dd4d2b9873cd9e576f2e65e", "url": "data/feats/feats-apg.json" }, { "revision": "0bcad8cb9d9dc979bdf9da106e3a5b33", "url": "data/feats/feats-av1.json" }, { "revision": "ecee806a20815075c50e3aaed9a52017", "url": "data/feats/feats-av2.json" }, { "revision": "1c6727823fbbee131deaec6c78a80d57", "url": "data/feats/feats-av3.json" }, { "revision": "0a3e74cde09d46354ed5495e17d6750b", "url": "data/feats/feats-crb.json" }, { "revision": "f89e1f6d241a1e5c0714506cec800ab1", "url": "data/feats/feats-ec1.json" }, { "revision": "968f62ed67ef7094d07ec029dcfebc48", "url": "data/feats/feats-ec2.json" }, { "revision": "31619982405e5007b7b879511e07b8e2", "url": "data/feats/feats-ec3.json" }, { "revision": "400583f48e05b69a0761c0e4435ccc94", "url": "data/feats/feats-ec6.json" }, { "revision": "01ef1e45771cb8f32dcdece613226182", "url": "data/feats/feats-fop.json" }, { "revision": "5cddefd00202b928a8ccbc0d09f0b98a", "url": "data/feats/feats-frp1.json" }, { "revision": "48351440f5023f50f1af467cf9fe6951", "url": "data/feats/feats-frp2.json" }, { "revision": "0897a2cf16e5b2464223d004c02a08d6", "url": "data/feats/feats-frp3.json" }, { "revision": "2d81ab8e3f25f00a688a23e6fbf64515", "url": "data/feats/feats-g&g.json" }, { "revision": "ae9f38b913cbf28f5c0e4566726914e1", "url": "data/feats/feats-gmg.json" }, { "revision": "1b674fc34ea8f6765cfaf1be4ce3df84", "url": "data/feats/feats-loag.json" }, { "revision": "c99d28fdb26b7c87d958e74b7252a0e2", "url": "data/feats/feats-locg.json" }, { "revision": "647625daa763d033631211eb4e982fa7", "url": "data/feats/feats-logm.json" }, { "revision": "603dace3ac5c41bed4c4d6f4ba999996", "url": "data/feats/feats-lol.json" }, { "revision": "2129cd50a6ed44e5e9502839067825da", "url": "data/feats/feats-lome.json" }, { "revision": "b940e881c59dc3f602370ca6186c63fe", "url": "data/feats/feats-lopsg.json" }, { "revision": "590086702f8471040772f78e87be1eab", "url": "data/feats/feats-lotgb.json" }, { "revision": "427204e0eeab09ae0e24473c5ff533f4", "url": "data/feats/feats-lowg.json" }, { "revision": "9b433045e04ba27c893f89165d768232", "url": "data/feats/feats-ltiba.json" }, { "revision": "dd47df01a6cdd320f0a1152e20e2f801", "url": "data/feats/feats-sli.json" }, { "revision": "08ef3c1f661e46686a25e3126ab2b0e6", "url": "data/feats/feats-som.json" }, { "revision": "075f827eb99aed204c6e9e9d1f35691c", "url": "data/feats/feats-sot2.json" }, { "revision": "403ed8f30187bfa8f9b6451925e7cd35", "url": "data/feats/feats-sot3.json" }, { "revision": "93e7f0ec5db866a4e3997ae1a56b4bec", "url": "data/feats/index.json" }, { "revision": "07b4a3fb8b7bf167a3500545ac1abd8d", "url": "data/generated/bookref-gmscreen-index.json" }, { "revision": "780a89880629828a5ada515d56a24ed4", "url": "data/generated/bookref-gmscreen.json" }, { "revision": "05ea0c5cc5b2d9b56c73ffad07970ba4", "url": "data/generated/bookref-quick.json" }, { "revision": "688a74016f76e2edf07802a3f0ba58f4", "url": "data/generated/gendata-nav-adventure-book-index.json" }, { "revision": "3a3295ad21d171397e8a0a4a482059ae", "url": "data/items/baseitems.json" }, { "revision": "f4a000b159b04adc564c5cb5f72aa665", "url": "data/items/fluff-index.json" }, { "revision": "e5e8785d55552966d3680fc60c19c1b4", "url": "data/items/fluff-items-crb.json" }, { "revision": "52b95432685e32a7915fc37a37c4bf78", "url": "data/items/index.json" }, { "revision": "cb7a29056f002d8b9967e9a377011f5e", "url": "data/items/items-aoa1.json" }, { "revision": "f9a13c0d143a4a90cba2e1ea74142df0", "url": "data/items/items-aoa2.json" }, { "revision": "86bc50fd734c3ba608b95be4ebfd9a23", "url": "data/items/items-aoa3.json" }, { "revision": "4e7b1ea7ecfb18a84bf16cd44145a456", "url": "data/items/items-aoa4.json" }, { "revision": "d175677903e4b874f5e28f962469a2b4", "url": "data/items/items-aoa5.json" }, { "revision": "0ca2b1c4158507b3903dd1a577848c49", "url": "data/items/items-aoa6.json" }, { "revision": "6c08739933142274f9e48f3c7a415bf7", "url": "data/items/items-aoe1.json" }, { "revision": "ae40c96c67f997f452fbfcfa7d5abba1", "url": "data/items/items-aoe2.json" }, { "revision": "7b0ee6c507d0247dd2e8ffb4956fcb17", "url": "data/items/items-aoe3.json" }, { "revision": "b1796dc0f02202ecb4777b09388a7dfc", "url": "data/items/items-aoe4.json" }, { "revision": "87b44d89977fc8a0b39c20a046f3bbba", "url": "data/items/items-aoe5.json" }, { "revision": "6a2ae7b0b0658425594b8459fe36bb12", "url": "data/items/items-aoe6.json" }, { "revision": "7870928e871235b632db2fff46e45e37", "url": "data/items/items-apg.json" }, { "revision": "5f93e3c09fd2b67f63e719cf00367ca6", "url": "data/items/items-av1.json" }, { "revision": "5b4c09a30ce5223836dd49c205e0fef5", "url": "data/items/items-av2.json" }, { "revision": "a30c9ef80a2d8eb80095e5d516afdba3", "url": "data/items/items-av3.json" }, { "revision": "eca60e0f70e7475eb82bcebe8d728db2", "url": "data/items/items-crb.json" }, { "revision": "980330d74bc58f84b4744b60e7291504", "url": "data/items/items-ec1.json" }, { "revision": "9a1dc7fd57fa01a2c0b9ec6ee6e8f839", "url": "data/items/items-ec2.json" }, { "revision": "6b875a4f6821a17f82197fbc4b9c7bfc", "url": "data/items/items-ec3.json" }, { "revision": "db59eb776aed6e94d946cd73e9da74ca", "url": "data/items/items-ec4.json" }, { "revision": "3547246ade7b62c9a62dd4c0c8cb53cb", "url": "data/items/items-ec5.json" }, { "revision": "9ac42a623b0b7088a7361d0409970f1c", "url": "data/items/items-ec6.json" }, { "revision": "3bd4c5d8ca2015a25925f7ed88eb001c", "url": "data/items/items-fop.json" }, { "revision": "ab9879bfd786bd597c46a7f04d07a5f2", "url": "data/items/items-frp1.json" }, { "revision": "4584bacb58d384f788892e00421071eb", "url": "data/items/items-frp2.json" }, { "revision": "abb9a6ca5205ad2c136859035a4a910e", "url": "data/items/items-g&g.json" }, { "revision": "4695ab60a57637aa4652706d140600e4", "url": "data/items/items-gmg.json" }, { "revision": "476655bf214888c21123525fc6b66730", "url": "data/items/items-loag.json" }, { "revision": "4c7d26e8290c5a0563ddbf69a1c449ed", "url": "data/items/items-locg.json" }, { "revision": "68996409a2f93a08cd10cba366f9c0a8", "url": "data/items/items-logm.json" }, { "revision": "f3d363b9d9ec714c972f6b76c83811db", "url": "data/items/items-lol.json" }, { "revision": "c0ca7f048b81ec70400e6538934b8f3e", "url": "data/items/items-lome.json" }, { "revision": "8c9ffe55695cf44fdf4166ec38644315", "url": "data/items/items-lopsg.json" }, { "revision": "08d0d9974878f0d98b9fc6fe0f6022fc", "url": "data/items/items-lotgb.json" }, { "revision": "5b7babc995ecb43848035b62bb39c214", "url": "data/items/items-lowg.json" }, { "revision": "4e5c9cfca1aa75363d6f77c31a68d9ea", "url": "data/items/items-ltiba.json" }, { "revision": "2b8730fbc3e6647f4f462f3464236e97", "url": "data/items/items-sli.json" }, { "revision": "58a000ae56d2b59705b6fa228f08c953", "url": "data/items/items-som.json" }, { "revision": "4a1223afbf08364ca2709ebf17ba3e9d", "url": "data/items/items-sot1.json" }, { "revision": "3f65eb88a48f215ad2861452c3af8603", "url": "data/items/items-sot2.json" }, { "revision": "d559b45884d4ebc93d623e5fa94ba423", "url": "data/items/items-sot3.json" }, { "revision": "211ba56d975c6b1b18c912696e8b1a5f", "url": "data/items/items-tio.json" }, { "revision": "99914b932bd37a50b983c5e7c90ae93b", "url": "data/spells/fluff-index.json" }, { "revision": "40c8e3b0a77c7dc13bc9e8ae2fac4b45", "url": "data/spells/index.json" }, { "revision": "8130b33be1a404a4fe1959feee3d867e", "url": "data/spells/spells-aoa3.json" }, { "revision": "76dc4889c509f1d35f0e14effc59036b", "url": "data/spells/spells-aoa4.json" }, { "revision": "5d2ff62496a63d10ffa9619397b0eacd", "url": "data/spells/spells-aoa6.json" }, { "revision": "80984dd1df258f41b9bc4c114c221826", "url": "data/spells/spells-aoe2.json" }, { "revision": "88d775b0ab58d63532f3daed76528100", "url": "data/spells/spells-aoe4.json" }, { "revision": "fe89ce23ba2cfc81a20e15a2a682207b", "url": "data/spells/spells-aoe5.json" }, { "revision": "aa5ca2bac300635b791f1ea8b58c923c", "url": "data/spells/spells-aoe6.json" }, { "revision": "88255c97e291b81952eec9d17720936b", "url": "data/spells/spells-apg.json" }, { "revision": "f820e847e6315f4949104ac821b88109", "url": "data/spells/spells-av1.json" }, { "revision": "491d51e2379cd30bad5e9f035d603260", "url": "data/spells/spells-av2.json" }, { "revision": "b745c72dfcb71f4f1018b66d95f5903d", "url": "data/spells/spells-av3.json" }, { "revision": "e8f53ce84b04e78925c97585a48fa107", "url": "data/spells/spells-crb.json" }, { "revision": "3992c29191f0961b26c665fe8b6bccfd", "url": "data/spells/spells-ec1.json" }, { "revision": "d2cb639cf30f6b9ec413f41537123820", "url": "data/spells/spells-ec2.json" }, { "revision": "3fa872cf4a2d7cc711a835e6ccf284ba", "url": "data/spells/spells-ec3.json" }, { "revision": "93db1aa4353d292ba053bfcd4f6b5605", "url": "data/spells/spells-ec4.json" }, { "revision": "e8d826010ca361320bd3ed4e685a1a20", "url": "data/spells/spells-ec5.json" }, { "revision": "b977b8229ab4e7227a2f234a10fed607", "url": "data/spells/spells-ec6.json" }, { "revision": "401b6411ca2fcf72561683fac79e3d77", "url": "data/spells/spells-frp1.json" }, { "revision": "ab0a27e83f55e56645a6fb2123c3019f", "url": "data/spells/spells-frp3.json" }, { "revision": "4dfee814bb5315c76812571a083120ee", "url": "data/spells/spells-locg.json" }, { "revision": "78cb65bf7241552d1344f73fbfce3dc2", "url": "data/spells/spells-logm.json" }, { "revision": "5a01e154922d2f1a771464ec4eba4e38", "url": "data/spells/spells-lol.json" }, { "revision": "04747019a6c489248d65f2f866c4fb13", "url": "data/spells/spells-lopsg.json" }, { "revision": "c25eacb113fad9e7a045abf33abb5ff5", "url": "data/spells/spells-lowg.json" }, { "revision": "3e1ba1d75ead771bb2fc41964408e216", "url": "data/spells/spells-som.json" }, { "revision": "811d51f1bd17cade281bd17b7149ed75", "url": "data/spells/spells-sot1.json" }, { "revision": "3ea3c4277e12569216300a0236be59bf", "url": "data/spells/spells-sot3.json" }, { "revision": "13c6468e0fe03b9180f8106b965c48b3", "url": "abilities.html" }, { "revision": "17492fdeb8fbdffb53f0a7e4275ac60c", "url": "actions.html" }, { "revision": "1a56de2d11e656d32cc14f2eb981b2b2", "url": "adventure.html" }, { "revision": "4dcb3db0485726e7dba6dc604770e245", "url": "adventures.html" }, { "revision": "8e8e9745c55378fd6888598543cd9c71", "url": "afflictions.html" }, { "revision": "7da72c7de0b5831a2fff406c10ac293a", "url": "ancestries.html" }, { "revision": "5b66745424df8e7b45d6fe7f4ed47a1d", "url": "archetypes.html" }, { "revision": "3fa0adb160222459ba8116b7bf338a75", "url": "backgrounds.html" }, { "revision": "be7fd8477895dd043538f762be249743", "url": "bestiary.html" }, { "revision": "3c18d438a0702b174ab51a7ca8a78df9", "url": "blacklist.html" }, { "revision": "d827497868474e9b4624646c6a624435", "url": "book.html" }, { "revision": "f1334270f6405e5339a7b000b486df80", "url": "books.html" }, { "revision": "979d801064906441b01484832312cd6f", "url": "changelog.html" }, { "revision": "4718507394d30d725e864c983e209ecc", "url": "classes.html" }, { "revision": "d60112f072efe2582da09fa511db9f43", "url": "companionsfamiliars.html" }, { "revision": "8064ea39ad93a072095c7223ad36bfc8", "url": "conditions.html" }, { "revision": "17e85966dbe62441cf0c20a45301f735", "url": "deities.html" }, { "revision": "19d1a95ce905acf4ad60fa0a7fa05334", "url": "donate.html" }, { "revision": "1afcaceb3a00d2f944cb7bdcfacdac0e", "url": "feats.html" }, { "revision": "fae43d57ce816eb2d57164d7529a5e02", "url": "gmscreen.html" }, { "revision": "c4af813972668d6a35dae2e0f7f74c8a", "url": "hazards.html" }, { "revision": "60e10d0a29a9b73cdcce05e46a63ae99", "url": "index.html" }, { "revision": "797987dc567059d1f63ccb54a96774df", "url": "inittrackerplayerview.html" }, { "revision": "e95435797a11da90e46c7eb107ced788", "url": "items.html" }, { "revision": "a367036fac9eb1697d7baa4a4259c692", "url": "langdemo.html" }, { "revision": "158ab5718ba7f78ea229fed5090e3784", "url": "languages.html" }, { "revision": "361bd1813bd1c391d5ec76dbeed01a60", "url": "licenses.html" }, { "revision": "c8fe83c4c9d7755e633cb3d9581a1e9f", "url": "managebrew.html" }, { "revision": "27388e11f93e4dfef5aac7e764efb306", "url": "optionalfeatures.html" }, { "revision": "044ef29c2a4bb45659f119fdb937d0e9", "url": "organizations.html" }, { "revision": "3d271f0d4cdc38f47097c1518298a0c5", "url": "Pf2eTools.html" }, { "revision": "e28ef605691b49c3e3c631cbf3300b80", "url": "places.html" }, { "revision": "fe1fa83ebbfc44e62db894781cbd155e", "url": "privacy-policy.html" }, { "revision": "700a27abf640f48feccabbfd7e298928", "url": "quickreference.html" }, { "revision": "4db459935e6939362ce8e74c3d9b8146", "url": "renderdemo.html" }, { "revision": "b30e1d21d10a46e598c6af4d0a8e041a", "url": "rituals.html" }, { "revision": "2f344806089a2785bce524545ff6517a", "url": "search.html" }, { "revision": "59be6ab92d9efefc0b30d78e86085417", "url": "spells.html" }, { "revision": "873b4ba22f3c93fe0c520f55f6888437", "url": "tables.html" }, { "revision": "18c8762c82945046616fadd710fc25c7", "url": "textconverter.html" }, { "revision": "8abd60b2d76538d37482281088fb8272", "url": "traits.html" }, { "revision": "86a2c8cac6f095d07268a582deebb903", "url": "variantrules.html" }, { "revision": "21c8cb1ba9b5806186d4b22d5f347a90", "url": "vehicles.html" }, { "revision": "07c706820372a879332b65496ee1692f", "url": "search/index-alt-spell.json" }, { "revision": "a2c797a51147f62dc30cc0c616e035c2", "url": "search/index-item.json" }, { "revision": "dbcd82efc704d55e31477bb9536b0b38", "url": "search/index.json" }, { "revision": "a0c289acd45fd1a51591d5a907f0a267", "url": "search/traits.json" }, { "revision": "1470d76f80a58f017506786bb7c6db59", "url": "manifest.webmanifest" }, { "revision": "448c34a56d699c29117adc64c43affeb", "url": "fonts/glyphicons-halflings-regular.woff2" }, { "revision": "e18bbf611f2a2e43afc071aa2f4e1512", "url": "fonts/glyphicons-halflings-regular.ttf" }, { "revision": "d09e5b926b6fdb2a506e5909de33de23", "url": "fonts/good-pro-400.ttf" }, { "revision": "9f6134a15b7dfc5a119bc65376dbe269", "url": "fonts/good-pro-400.woff" }, { "revision": "ff1abe8ed0ef061106b68d844c8dab4d", "url": "fonts/good-pro-400.woff2" }, { "revision": "361e7ff40e96db6bbbfe90889d95afdc", "url": "fonts/good-pro-700.ttf" }, { "revision": "1997214212f12c3e4a68f5195e68cb5d", "url": "fonts/good-pro-700.woff" }, { "revision": "0fea4b7d69bbcb12a33f0922262c6421", "url": "fonts/good-pro-700.woff2" }, { "revision": "a11892b605845bf613d1a8bb06c00b04", "url": "fonts/good-pro-condensed-400.ttf" }, { "revision": "6421dccde27db5dba3399149e69f71d3", "url": "fonts/good-pro-condensed-400.woff" }, { "revision": "ea4d723a4099259aba94b84e333034f8", "url": "fonts/good-pro-condensed-700.ttf" }, { "revision": "fc0455882bdfe0c48aa7186da15c85f3", "url": "fonts/good-pro-condensed-700.woff" }, { "revision": "46aa1be77a9022bb5ee43a8513fb3057", "url": "fonts/good-pro-condensed-700.woff2" }, { "revision": "51853144d912fd5553eeb7d39c3b53bf", "url": "fonts/good-pro-condensed-italic-400.ttf" }, { "revision": "41d2455a8dea4aac5165b82743681efa", "url": "fonts/good-pro-condensed-italic-400.woff" }, { "revision": "5a10bdbc21e43df2acd07e2487820d60", "url": "fonts/good-pro-condensed-italic-700.ttf" }, { "revision": "556dd5c152d5b0739a5121f37a2baff4", "url": "fonts/good-pro-condensed-italic-700.woff" }, { "revision": "1bc04907c2bf079908e90e0313239bcd", "url": "fonts/good-pro-condensed-italic-700.woff2" }, { "revision": "ff1eae181861f44db0ab1431879a49f9", "url": "fonts/good-pro-italic-400.ttf" }, { "revision": "a9ed15953b80fedb8137f8f25839fb96", "url": "fonts/good-pro-italic-400.woff" }, { "revision": "1b23ad64d84c8cee844cf53e466e6eed", "url": "fonts/good-pro-italic-400.woff2" }, { "revision": "55ee8f359a01d66ab3b8b22d02d9ed55", "url": "fonts/good-pro-italic-700.ttf" }, { "revision": "6ee51b012748f002f234b578ab1268b7", "url": "fonts/good-pro-italic-700.woff" }, { "revision": "7489b33e26f603728567f2ccee7e508e", "url": "fonts/good-pro-italic-700.woff2" }, { "revision": "2640ba59a59d7dfbb88d0d477f7bdb0a", "url": "fonts/Pathfinder2eActions.ttf" }, { "revision": "c153508add58cc58db1ef0be5c9f8adf", "url": "fonts/Gin-Regular.ttf" }, { "revision": "b0bf2c218bf460993111010eb83a0fa8", "url": "fonts/SabonLTStd-Bold.ttf" }, { "revision": "1b97aaf6b6e56d43d0b9e370c4f50876", "url": "fonts/SabonLTStd-BoldItalic.ttf" }, { "revision": "d69ef52beb7ca47462a0f89ff028a2f3", "url": "fonts/SabonLTStd-Italic.ttf" }, { "revision": "d6e119cff761a4bee40d2f640db5af1e", "url": "fonts/SabonLTStd-Roman.ttf" }, { "revision": "778896312671ade54c606724f278bf36", "url": "fonts/AlbertusMT.ttf" }, { "revision": "918ab3311bf65e4da491aaba2f2ca5bc", "url": "fonts/Basing.ttf" }, { "revision": "2f95108599bc770e0fc66a063b0f5906", "url": "fonts/Taroca.ttf" }, { "revision": "c18c5f06b696ed2d4c1e5eda8cc204ca", "url": "img/gmscreen/moon.webp" }, { "revision": "183504177c2f7e2ccc6b88461af6000d", "url": "img/letter-dark.webp" }, { "revision": "43877a1bc57da60ca9a9aafeac9d8e2f", "url": "img/letter.webp" }, { "revision": "4279516591cee28c697c6d2f84d84da1", "url": "img/patreon.webp" }, { "revision": "12f8d0eeba4504e025f30e4bf6326cd6", "url": "fonts/fa-light-300.eot" }, { "revision": "da5526bf0f7fae09080945b15da77066", "url": "fonts/fa-light-300.ttf" }, { "revision": "83c52b7102d3b3586554677f947792e7", "url": "fonts/fa-light-300.woff" }, { "revision": "1d4e499e402761b86c26b5fa3ad51c30", "url": "fonts/fa-light-300.woff2" }, { "revision": "09554888dac30eee041e8047d3dc75b4", "url": "sw-injector.js" }]);
  var RevisionCacheFirst = class extends Strategy {
    cacheRoutesAbortController = null;
    constructor() {
      super({ cacheName: "runtime-revision" });
      this.activate = this.activate.bind(this);
      this.cacheRoutes = this.cacheRoutes.bind(this);
      addEventListener("message", (event) => {
        switch (event.data.type) {
          case "CACHE_ROUTES": {
            this.cacheRoutesAbortController = new AbortController();
            event.waitUntil(this.cacheRoutes(event.data, this.cacheRoutesAbortController.signal));
            break;
          }
          case "CANCEL_CACHE_ROUTES": {
            console.log("aborting cache!");
            this.cacheRoutesAbortController?.abort();
            this.cacheRoutesAbortController = null;
            break;
          }
        }
      });
    }
    async _handle(request, handler) {
      const url = request.url;
      const cacheKey = createCacheKey({ url, revision: runtimeManifest.get(url) }).cacheKey;
      console.log(`trying to resolve ${url} with key ${cacheKey}`);
      const cacheResponse = await handler.cacheMatch(cacheKey);
      if (cacheResponse !== void 0)
        return cacheResponse;
      console.log(`fetching ${url} over the network for RevisionFirstCache`);
      try {
        const fetchResponse = await handler.fetch(request);
        handler.cachePut(cacheKey, fetchResponse.clone());
        return fetchResponse;
      } catch (e) {
        offlineAlert(url);
        return new Response();
      }
    }
    activate(event) {
      return waitUntil2(event, async () => {
        const cache = await caches.open(this.cacheName);
        const currentCacheKeys = (await cache.keys()).map((request) => request.url);
        const validCacheKeys = new Set(Array.from(runtimeManifest).map(([url, revision]) => createCacheKey({ url, revision }).cacheKey));
        await Promise.allSettled(currentCacheKeys.map(async (key) => {
          if (!validCacheKeys.has(key)) {
            console.log(`deleting ${key} from the cache because its revision does not match`);
            await cache.delete(key);
          }
        }));
      });
    }
    async cacheRoutes(data, signal) {
      const cache = await caches.open(this.cacheName);
      const currentCacheKeys = new Set((await cache.keys()).map((request) => request.url));
      const validCacheKeys = Array.from(runtimeManifest).map(([url, revision]) => createCacheKey({ url, revision }).cacheKey);
      const routeRegex = data.payload.routeRegex;
      const routesToCache = validCacheKeys.filter((key) => !currentCacheKeys.has(key) && routeRegex.test(key));
      const fetchTotal = routesToCache.length;
      let fetched = 0;
      const postProgress = async () => {
        const clients = await self.clients.matchAll({ type: "window" });
        for (const client of clients) {
          client.postMessage({ type: "CACHE_ROUTES_PROGRESS", payload: { fetched, fetchTotal } });
        }
      };
      await postProgress();
      if (fetchTotal === 0)
        return;
      const concurrentFetches = 5;
      const fetchPromise = async () => {
        while (true) {
          const url = routesToCache.pop();
          if (url === void 0 || signal.aborted)
            return;
          const cleanUrl = url.replace(/\?__WB_REVISION__=\w+$/m, "");
          const response = await fetch(cleanUrl);
          await cache.put(url, response);
          fetched++;
          postProgress();
        }
      };
      const fetchPromises = [];
      for (let i = 0; i < concurrentFetches; i++) {
        fetchPromises.push(fetchPromise());
      }
      const fetchResults = await Promise.allSettled(fetchPromises);
      const errorResults = fetchResults.filter((fetchResult) => fetchResult.status === "rejected");
      if (errorResults.length > 0) {
        const clients = await self.clients.matchAll({ type: "window" });
        for (const client of clients)
          client.postMessage({ type: "CACHE_ROUTES_ERROR", payload: { errors: errorResults } });
      }
    }
  };
  var runtimeManifest = new Map([["data/adventure/adventure-id.json", "83c27fefb4e6b7d0d8727bbac0b191de"], ["img/covers/blank.webp", "9b2781e05d13f720e91891cbb929fe20"], ["img/covers/CRB-100.webp", "7650bb7365cbf84b20ee97c6b7c0a189"], ["img/covers/CRB-25.webp", "716475fd096ad77eee0ed1b47c3a1431"], ["img/covers/CRB-33.webp", "d7ef321523e2f1321fe8a5324ed4643c"], ["img/covers/CRB.webp", "bfc8f8b52b8faeee86027947182edcf8"], ["img/covers/GMG-100.webp", "75c327c893ef10c786f963236b4fe9d0"], ["img/covers/GMG-25.webp", "a67231c72c04e4a4c018bbd33110198b"], ["img/covers/GMG-33.webp", "6b05c52c0af37ef6ae43cf6f5d719a9c"], ["img/covers/GMG.webp", "d3610c80b6d79213177340f0c5f8db06"], ["img/covers/LOWG-100.webp", "266ffa70d70230e300ed454c612e59cf"], ["img/covers/LOWG-25.webp", "61855c40cd160dcf3bc8c39dc10844c3"], ["img/covers/LOWG-33.webp", "138e39219a0a4da133f3519125e9bc3f"], ["img/covers/LOWG.webp", "1adccec87cc1324fecd5e34ebeef69d4"], ["img/covers/SoM-100.webp", "ed511ca0c38bbe1644ec1b8729e7fb9b"], ["img/covers/SoM-25.webp", "51f0a78fa32ece446abc13ada184a2bc"], ["img/covers/SoM-33.webp", "675e9f72483daeaf814cd1ac38e232c7"], ["img/covers/SoM.webp", "880dd82ad81eda61b903d28e4bdde4f9"], ["img/gmscreen/moon.webp", "c18c5f06b696ed2d4c1e5eda8cc204ca"], ["img/letter-dark.webp", "183504177c2f7e2ccc6b88461af6000d"], ["img/letter.webp", "43877a1bc57da60ca9a9aafeac9d8e2f"], ["img/patreon.webp", "4279516591cee28c697c6d2f84d84da1"], ["img/logo/Background.svg", "c6ec599d06aa5b773e600881ceeb0460"], ["img/logo/No%20Background.svg", "6d3b2f0a213f7bc5beba9e88f20667f7"], ["android-chrome-192x192.png", "9c862118ab3423bc2d01ab42f755e07b"], ["android-chrome-256x256.png", "fad8c4a79079fa54737cb9532e141aa0"], ["android-chrome-384x384.png", "4f2267d39b6bd3389138f074c45dfe67"], ["apple-touch-icon-120x120.png", "fe434a800beb3381ad59197e29e68a2a"], ["apple-touch-icon-152x152.png", "3b23873f540b0c5271201c5f91a0c7ed"], ["apple-touch-icon-167x167.png", "e19815500c57552e18f8218fbdb5cb72"], ["apple-touch-icon-180x180.png", "c9ecf9df6e7f7f55974f45f7110d9890"], ["apple-touch-icon-360x360.png", "b5d0e83a94f7fbea21006b7479d8a898"], ["favicon-128x128.png", "c7b2e3d1de45c84588bc4711a4b50c6d"], ["favicon-144x144.png", "6770b376fb68b50e546e60d4a0dae9aa"], ["favicon-16x16.png", "3dbac8b48aaa087a66f7e3a16af56994"], ["favicon-256x256.png", "e31f4ad5d254f7faedf87bd8ac8e3d1c"], ["favicon-32x32.png", "61f449203da4d72d7669df93ef5d1a0c"], ["favicon-48x48.png", "5144e32c3e7170887ec5c99adeeaaed2"], ["favicon-64x64.png", "be61a655807353c6f8dcb86ff896c581"], ["mstile-144x144.png", "9f6d0f9700426867bddb7614da8ece66"], ["mstile-150x150.png", "ba04e45075fa41f85441a1d070b40710"], ["mstile-310x150.png", "e37a7cc30a0283d5357fd38901cb6f56"], ["mstile-310x310.png", "80a2fed08dac45aa2cfc55ddaa5b69fa"], ["mstile-70x70.png", "798a4847c77967a489d66a40ef1d8801"], ["favicon.svg", "4e6529d5bb5dc35c2edf6be6b9881967"], ["safari-pinned-tab.svg", "e84a2ecd6fd15fb32fc3f75293ef467c"]].map(([
    route,
    revision
  ]) => [
    `${self.location.origin}/${route}`,
    revision
  ]));
  var revisionCacheFirst = new RevisionCacheFirst();
  registerRoute(({ request }) => runtimeManifest.has(request.url), revisionCacheFirst);
  addEventListener("activate", revisionCacheFirst.activate);
  registerRoute(({ request }) => request.destination === "font", new CacheFirst({
    cacheName: "font-cache"
  }));
  registerRoute(({ request }) => request.destination === "image", new NetworkFirst({
    cacheName: "external-image-cache",
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 7 * 24 * 60 * 60, maxEntries: 100, purgeOnQuotaError: true })
    ]
  }));
  addEventListener("install", () => {
    self.skipWaiting();
  });
  addEventListener("activate", (event) => {
    event.waitUntil((async () => {
      const cacheNames2 = await caches.keys();
      for (const cacheName of cacheNames2) {
        if (/\d+\.\d+\.\d+/.test(cacheName)) {
          await caches.delete(cacheName);
          console.log(`deleted cache: ${cacheName} because it is from old service worker`);
        }
      }
    })());
  });
})();
