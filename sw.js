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
  precacheAndRoute([{ "revision": "ea9668afe866cf94144aea54975de4c1", "url": "js/abilities.js" }, { "revision": "adcb0a482e48de5b8bbb1dfd81425d64", "url": "js/actions.js" }, { "revision": "61aaeee9b159854c0f032b22105c2545", "url": "js/adventure.js" }, { "revision": "21771bc05dd0464b1aa9e4649c2e16eb", "url": "js/adventures.js" }, { "revision": "0f82e1aeb2232f77e834890e47490d77", "url": "js/afflictions.js" }, { "revision": "7f34fa11b33f7a28f306d719ef23a3e0", "url": "js/ancestries.js" }, { "revision": "70dd3f16a4a9dd81be1be8d4bbde69a6", "url": "js/archetypes.js" }, { "revision": "52335573df1f6003573a124a86cdac0f", "url": "js/backgrounds.js" }, { "revision": "619a1b3c2117cc9abce56fe247d33471", "url": "js/bestiary-encounterbuilder.js" }, { "revision": "8003b62a5b1febe69c4171c90faa1e69", "url": "js/bestiary.js" }, { "revision": "e2f42425112f388bf1a51b5be9cf5ec2", "url": "js/blacklist.js" }, { "revision": "fdb1c3a0212bd25dd422a427812e3da1", "url": "js/book.js" }, { "revision": "9bcc769ac4898ad4ca69defd9d83814c", "url": "js/books.js" }, { "revision": "2bb08db00ab38596c02fd448c47aba99", "url": "js/bookslist.js" }, { "revision": "c3c783549c4f0fe486c6ddb290587c0c", "url": "js/bookutils.js" }, { "revision": "8bb8ed8c10d8d474a44293a4045a1be9", "url": "js/browsercheck.js" }, { "revision": "844ccfe9d29136e9d1fb9308c4a083d0", "url": "js/classes.js" }, { "revision": "8bfad5efe8e8548f8523b36c13ccad07", "url": "js/companionsfamiliars.js" }, { "revision": "5229964912670180f3a584178628c600", "url": "js/conditions.js" }, { "revision": "bef7a927c0bbb8f0622f9393443f310b", "url": "js/converter.js" }, { "revision": "c7c8256345f8aba195403bd2dda4d296", "url": "js/converterutils.js" }, { "revision": "0c23c18c67cf9e7a5c12e5f43d560ae1", "url": "js/creaturetemplates.js" }, { "revision": "16131f19f9027cf586d2bfe7e7277557", "url": "js/deepbg.js" }, { "revision": "7064134efb459ba9faa9e0261f04446a", "url": "js/deities.js" }, { "revision": "9b955e8e8bd978ae94b5700b99ba04e3", "url": "js/encountergen.js" }, { "revision": "5352d236bca92f5653eeb4759ea91bda", "url": "js/feats.js" }, { "revision": "f464e5aa6a015b371a2eb4999509a63a", "url": "js/filter-abilities.js" }, { "revision": "dfd57c8244d6d0409960710f43381209", "url": "js/filter-actions.js" }, { "revision": "2f6936194afe875ca23d2f0d5bd7ef14", "url": "js/filter-afflictions.js" }, { "revision": "e49f20a14353f52b0f9a3123e75a16e3", "url": "js/filter-ancestries.js" }, { "revision": "d6ddb5a2458a723bd3c92e533b47c9d2", "url": "js/filter-archetypes.js" }, { "revision": "a8d67d5657213aac8172eab7f556b71f", "url": "js/filter-backgrounds.js" }, { "revision": "5b3f61e76972f1dccba79cee9945ba6e", "url": "js/filter-bestiary.js" }, { "revision": "968cbaebdacaec84cfd9ed14a5681ab0", "url": "js/filter-classes.js" }, { "revision": "ed2c0468526aaf9bb52c44797a6b8f78", "url": "js/filter-companionsfamiliars.js" }, { "revision": "be67b652c59bfca13ae2dfa1a53ff8df", "url": "js/filter-conditions.js" }, { "revision": "005e430356281ab33276d5b6f3d3f83d", "url": "js/filter-creaturetemplates.js" }, { "revision": "a91ea05ee1b07ee40527c520df8582d7", "url": "js/filter-deities.js" }, { "revision": "8cba93a5fde8a3a57b617e49148336c4", "url": "js/filter-feats.js" }, { "revision": "7c270870b9dfc417373a328b0cfe6403", "url": "js/filter-hazards.js" }, { "revision": "b871a2e041de8f1d30463b3300a7d1a6", "url": "js/filter-items.js" }, { "revision": "7d409c372a3b5679d336447894dab9cd", "url": "js/filter-languages.js" }, { "revision": "90cf0c8ea7a5490c7176fa32eba9dec2", "url": "js/filter-optionalfeatures.js" }, { "revision": "c4f02954f337d509ea28ecfff15c283f", "url": "js/filter-organizations.js" }, { "revision": "ed719db1351f48c6fbe53cb735af4c11", "url": "js/filter-places.js" }, { "revision": "7e5100cb82172b0efe10d58fadc76dee", "url": "js/filter-rituals.js" }, { "revision": "8a80c70990945747c090ab5ea6ac9c9c", "url": "js/filter-spells.js" }, { "revision": "1a66c97336877234e1e95cc592934da1", "url": "js/filter-tables.js" }, { "revision": "2947025006376a0c46432272a301b110", "url": "js/filter-traits.js" }, { "revision": "ced5b81eaa6b6968aee339052d498b16", "url": "js/filter-variantrules.js" }, { "revision": "291f440dd1b34f30bce7af7c1bf4d9e0", "url": "js/filter-vehicles.js" }, { "revision": "67fd3f400232db4ce72b8505d2c07fbd", "url": "js/filter.js" }, { "revision": "b918393b488c94f17f3aae526913be18", "url": "js/genutils.js" }, { "revision": "ce4d531479463db31e1671be891bebae", "url": "js/gmscreen-counter.js" }, { "revision": "053f90ed005fcefcdc914895cb0f6c67", "url": "js/gmscreen-initiativetracker.js" }, { "revision": "b27a0e033f574ad2efaad2f03446d967", "url": "js/gmscreen-mapper.js" }, { "revision": "7086e2c4f27fa1b6e8c18de668406a1b", "url": "js/gmscreen-moneyconverter.js" }, { "revision": "807def90ceacbd00b0da2dd6d1ba6795", "url": "js/gmscreen-playerinitiativetracker.js" }, { "revision": "6e353bbf66b1b80f210064e67af4f787", "url": "js/gmscreen-timetracker.js" }, { "revision": "7fe457e1b1e47c1b327b9c229503b95b", "url": "js/gmscreen.js" }, { "revision": "01cf3b549851deb976708b7d7e84102f", "url": "js/hazards.js" }, { "revision": "fe621e48fa923f682d31fbf6677e838a", "url": "js/hist.js" }, { "revision": "9948771a03f77f4a1c8d4ec3ca9084b9", "url": "js/initiativetrackerutils.js" }, { "revision": "fc687277a94712c304678389dd191333", "url": "js/inittrackerplayerview.js" }, { "revision": "6a7db024f50e578775103f497b5172fb", "url": "js/items-runebuilder.js" }, { "revision": "00b827d5f12c0da694b6db9e4dd01610", "url": "js/items.js" }, { "revision": "5af89260cf41c44ea047fc0275e45f96", "url": "js/langdemo.js" }, { "revision": "453df8120a0f7c7e7597177064dda26e", "url": "js/langdemo2.js" }, { "revision": "3030328d4efb34ea18e73c329c06027e", "url": "js/languages.js" }, { "revision": "9a60555ba889bc97bad5ed148b263ef1", "url": "js/list2.js" }, { "revision": "63563afffd6163eb55e69edee8e660e0", "url": "js/listpage.js" }, { "revision": "f8d0b4fcf44162e50d30aceafca7f03e", "url": "js/managebrew.js" }, { "revision": "fa7ea74e1df4e5328ac3486ddceb7cd7", "url": "js/multisource.js" }, { "revision": "888d854f6bfa7bff5d5e4059d0d9cff7", "url": "js/navigation.js" }, { "revision": "67e619ab3a8056302b508711033d7fbd", "url": "js/omnidexer.js" }, { "revision": "ebf344ae9608c6c6f3123902f99cbfa9", "url": "js/omnisearch.js" }, { "revision": "8cb199a149a7c353436b4b23774f0dc8", "url": "js/optionalfeatures.js" }, { "revision": "d4ce795f0e69cf2002ed1bd784b7d6c8", "url": "js/organizations.js" }, { "revision": "4ea20acdd6f375a489c5a2f333696624", "url": "js/parser.js" }, { "revision": "06b625b60f6911d2b65275448f0fe5ae", "url": "js/places.js" }, { "revision": "140816e674533979f522f02970780444", "url": "js/quickreference.js" }, { "revision": "15a9b390a1b82f52342a011fbe89a3d3", "url": "js/render-dice.js" }, { "revision": "ef7adf7b06925b8143a14b1bafad3251", "url": "js/render-map.js" }, { "revision": "ab3fd933b00b421b78f2074334d97d54", "url": "js/render.js" }, { "revision": "bdcd0d0ec164abbd8ae81854951614c3", "url": "js/renderdemo.js" }, { "revision": "25f700f035aa50408d9688f26f9aa46a", "url": "js/rituals.js" }, { "revision": "680994cb961eeaaa22a0a10715a9fcbd", "url": "js/rolang.js" }, { "revision": "6e8ca507644b9daf2c3987ee56eb995e", "url": "js/scalecreature.js" }, { "revision": "b823cf704b3f8a1aa3a24f0bf1c6735d", "url": "js/search.js" }, { "revision": "0c333c70f3c4d894b4785840eff3c992", "url": "js/seo-loader.js" }, { "revision": "59b9f2929670a72479915ee1da137719", "url": "js/spells.js" }, { "revision": "3687490b20e78d4414d388f1f923f6d8", "url": "js/styleswitch.js" }, { "revision": "ba3ec2d14497337b47ccdf9d31738570", "url": "js/tablepage.js" }, { "revision": "8a1ab0bfa508055a179b3fa01aa7fd67", "url": "js/tables.js" }, { "revision": "2e47b55e4536de82410da7840155a633", "url": "js/textconverter.js" }, { "revision": "cecd5e06a1233bdf8f9a0631f7f3c0d3", "url": "js/tokenizer.js" }, { "revision": "6f5d4c18beff74ca0fc15a9c69c693c7", "url": "js/traits.js" }, { "revision": "4d0c372242ba98d838d756da18dc9c0d", "url": "js/utils-changelog.js" }, { "revision": "ce389a1ad746ffd019bb30189f5bbf4a", "url": "js/utils-licenses.js" }, { "revision": "47b87a283906b5558ee54733ee4389c9", "url": "js/utils-list.js" }, { "revision": "3e9239b11afe89a33d5eaad63847b5bc", "url": "js/utils-p2p.js" }, { "revision": "ae21056e23e21826b34b8245bfc4c93c", "url": "js/utils-proporder.js" }, { "revision": "82adb2c24289fc25abb32163f08056b2", "url": "js/utils-ui.js" }, { "revision": "6e4d169425b810fbe17e154925fb75df", "url": "js/utils.js" }, { "revision": "65d4253bd1636a9a26d4d59e9b808720", "url": "js/variantrules.js" }, { "revision": "2838d4562ea735105a75477c12c8a66e", "url": "js/vehicles.js" }, { "revision": "b36e7c94c751656285d8e977cc152b10", "url": "lib/ace.js" }, { "revision": "f841812c750b396f454daee1aa5c4213", "url": "lib/bootstrap-select.min.js" }, { "revision": "cad6941d32006acbc61f7bab05918150", "url": "lib/bootstrap.min.js" }, { "revision": "7ba761cdbfa62922c3b750ac78f866eb", "url": "lib/elasticlunr.js" }, { "revision": "28dd3c8bf663c55bc9aa3d8f92945871", "url": "lib/ext-searchbox.js" }, { "revision": "a8e8282fcf516551d39204e076624b55", "url": "lib/jquery-ui-slider-pip.js" }, { "revision": "e858f6a2725af4140c1c424cf024a808", "url": "lib/jquery-ui.js" }, { "revision": "a6b6350ee94a3ea74595c065cbf58af0", "url": "lib/jquery.js" }, { "revision": "04680cb5d0adf90731746e92ef05a87b", "url": "lib/jquery.panzoom.js" }, { "revision": "862e9e065bcfe3944871cbf66229b3fd", "url": "lib/localforage.js" }, { "revision": "522bc8c23346ddf54992d531acabcb3e", "url": "lib/lzma.js" }, { "revision": "2378a4fa58c2e66792c81641346a4a40", "url": "lib/peerjs.js" }, { "revision": "fcf66afa34d87ce0bd47437c0c31816e", "url": "css/bootstrap-select.min.css" }, { "revision": "1264a8c9b7b1a57b2213a96859326e9f", "url": "css/bootstrap.css" }, { "revision": "de97b7db2b1195829599af9cfeb914c6", "url": "css/classes.css" }, { "revision": "354613438d26956a4530d57badd1711d", "url": "css/fontawesome.css" }, { "revision": "01ef22f83fa30e6bed564ab061a79f54", "url": "css/jquery-ui-slider-pips.css" }, { "revision": "4ef12b83b1ef3ff34d711c6a78421f55", "url": "css/jquery-ui.css" }, { "revision": "a6fc67670251132e3eb14a807aa466de", "url": "css/list-page--grouped.css" }, { "revision": "939fd45be687b473e266348825fb5697", "url": "css/search.css" }, { "revision": "eace5582f3c32a7a0acb5ce377873ebc", "url": "css/style.css" }, { "revision": "f8c7f17547945d8f710506491ef99275", "url": "homebrew/index.json" }, { "revision": "0318c92fe2e5274880079a080b006dd3", "url": "data/abilities.json" }, { "revision": "43e9b74614c3e9915c109b32ea70dcc1", "url": "data/actions.json" }, { "revision": "e234bbe57da2898f8cfb1a9833448c15", "url": "data/adventures.json" }, { "revision": "2cbe16a16792b29c858a325da4d73986", "url": "data/afflictions.json" }, { "revision": "5be7f5f1e5d37a2bbb5285983052589a", "url": "data/archetypes.json" }, { "revision": "b1cc8af061816f37619279a606724431", "url": "data/books.json" }, { "revision": "5e21b64f8207f238037b3bba1402f4da", "url": "data/changelog.json" }, { "revision": "d76b1ecdf3e6cfa848503b6b463b5058", "url": "data/companionsfamiliars.json" }, { "revision": "e7cdc4c8e9d400ddc6e6af4b0b02ffed", "url": "data/conditions.json" }, { "revision": "487f033900b7a24857aa987a490ac112", "url": "data/creaturetemplates.json" }, { "revision": "75c870daa4d5e6e6d5e85e29ae44baed", "url": "data/deities.json" }, { "revision": "d465ddfac916a507fa4da1fbd248dcdf", "url": "data/domains.json" }, { "revision": "6769668fa4bf28130db02dce2e910fd8", "url": "data/fluff-creaturetemplates.json" }, { "revision": "50dfd5ee1cb794a67b1840eff566dc6c", "url": "data/fluff-deities.json" }, { "revision": "8a4e89af5ea6dfa1b90cf5fce0a55def", "url": "data/fluff-organizations.json" }, { "revision": "317c438dd61985f25c83ed48fa7a5955", "url": "data/groups.json" }, { "revision": "48749bbb9c7e12feb8ee657928c1bc3b", "url": "data/hazards.json" }, { "revision": "85a9c6c560e8afcc0ec11016d39c9f5c", "url": "data/languages.json" }, { "revision": "67522b3553bc6b7653559897f84ba5a8", "url": "data/licenses.json" }, { "revision": "5d98fa27005a70b26c77a6bca146a1ff", "url": "data/optionalfeatures.json" }, { "revision": "8ec36d8b1324d4cb80a3788fff02d098", "url": "data/organizations.json" }, { "revision": "a2ac2bf3bff2708a36258d8be14f7d03", "url": "data/places.json" }, { "revision": "1f4d6403293d3bab69892b0cc9618ccd", "url": "data/quickrules.json" }, { "revision": "d554374a7d60bc110a5eb15426f8f673", "url": "data/renderdemo.json" }, { "revision": "7c7b78c439fcd6ce303fffad82026ff1", "url": "data/rituals.json" }, { "revision": "18bec43201ae30d075af68e3a2907f2d", "url": "data/skills.json" }, { "revision": "b7c317bf08a4c0503c6ca92594b5f78c", "url": "data/tables.json" }, { "revision": "99a75608f5141ce103a80d6c5fd9df7c", "url": "data/traits.json" }, { "revision": "4a2d96e842e10318bb64abdb4ebd5d56", "url": "data/variantrules.json" }, { "revision": "87187fbb5a757285e8b740aa0f73e4f7", "url": "data/vehicles.json" }, { "revision": "e4cb66a6c0be0668d18bfc879fe7a685", "url": "data/ancestries/ancestry-anadi.json" }, { "revision": "ab8e64a04a41125b7d06e0f83a81d093", "url": "data/ancestries/ancestry-android.json" }, { "revision": "54fad8c9e575b235ed51d447e5b87ac7", "url": "data/ancestries/ancestry-automaton.json" }, { "revision": "24dc25b437d7a4094ca544fc0bdf1f56", "url": "data/ancestries/ancestry-azarketi.json" }, { "revision": "8bc99af27a330fadf6845efdc99e1117", "url": "data/ancestries/ancestry-catfolk.json" }, { "revision": "e943a63f74e60967c3e474daa2b97074", "url": "data/ancestries/ancestry-conrasu.json" }, { "revision": "ebecf63092b566f3441e6d30ca1d8425", "url": "data/ancestries/ancestry-dwarf.json" }, { "revision": "a3d4ee1c586f80d6bcab0fe05c43c2bd", "url": "data/ancestries/ancestry-elf.json" }, { "revision": "5188e7d09ef224232a9844206e3529c2", "url": "data/ancestries/ancestry-fetchling.json" }, { "revision": "2fe17dbad88e0cbf0e181712961f2cca", "url": "data/ancestries/ancestry-fleshwarp.json" }, { "revision": "7baa6f5df1c02be83b6a1bad01880be2", "url": "data/ancestries/ancestry-gnoll.json" }, { "revision": "8091f4fbb91c27b5d47c9f7307ef5665", "url": "data/ancestries/ancestry-gnome.json" }, { "revision": "77bdc4d553fe2e2f05a764186ae72677", "url": "data/ancestries/ancestry-goblin.json" }, { "revision": "f91e813ce3298792e6fea1f9c8b9ba68", "url": "data/ancestries/ancestry-goloma.json" }, { "revision": "26909c39afe2354ae3fc584db0aa52b5", "url": "data/ancestries/ancestry-grippli.json" }, { "revision": "507a596e57b93f7d8443093974699aa7", "url": "data/ancestries/ancestry-halfling.json" }, { "revision": "af2c6e890fe8b5f899ad6e8381aafe0b", "url": "data/ancestries/ancestry-hobgoblin.json" }, { "revision": "fdbc463f7546da11c2ee3fabcd929bb5", "url": "data/ancestries/ancestry-human.json" }, { "revision": "a8884422a7156473da823456cab49e48", "url": "data/ancestries/ancestry-kitsune.json" }, { "revision": "f3832a4613df79e1ce35e1448450f607", "url": "data/ancestries/ancestry-kobold.json" }, { "revision": "5f702cc519978695b579aaa5b0b70c49", "url": "data/ancestries/ancestry-leshy.json" }, { "revision": "5676775dfa19225f6087be3783966cca", "url": "data/ancestries/ancestry-lizardfolk.json" }, { "revision": "a1c636195cedc70301e1f6d1639caaa4", "url": "data/ancestries/ancestry-orc.json" }, { "revision": "5447c53eecf04b61957000e8a35ae033", "url": "data/ancestries/ancestry-poppet.json" }, { "revision": "d887ebbc068558819a0367ed4fb673f4", "url": "data/ancestries/ancestry-ratfolk.json" }, { "revision": "395b09bf86f27ec367167f88739e46fe", "url": "data/ancestries/ancestry-shisk.json" }, { "revision": "4441b328953dd49ef0e8564861a5ef2d", "url": "data/ancestries/ancestry-shoony.json" }, { "revision": "0de0dc6695d287c0c61a2cb2cc3aa5c2", "url": "data/ancestries/ancestry-skeleton.json" }, { "revision": "1bb374c9f098522abc0877f148ac786f", "url": "data/ancestries/ancestry-sprite.json" }, { "revision": "448a4033032ea8da33b1dfc569545667", "url": "data/ancestries/ancestry-strix.json" }, { "revision": "da39dcf01cd5f867d36a417661f46bfc", "url": "data/ancestries/ancestry-tengu.json" }, { "revision": "fe5066650daec8641a35bd924c8dc37e", "url": "data/ancestries/index.json" }, { "revision": "eb4f849be03b7dc276dca3f856c4c933", "url": "data/ancestries/versatile-heritages.json" }, { "revision": "48a5f08aceaf321c5fb2fa7e0f0a0ae6", "url": "data/backgrounds/backgrounds-aoa0.json" }, { "revision": "18a6fc08bf3cb566a46c6535e9397e14", "url": "data/backgrounds/backgrounds-aoa4.json" }, { "revision": "e078edee16911bf4a3ccc83a7612d58a", "url": "data/backgrounds/backgrounds-aoa6.json" }, { "revision": "d1f4fa4ebd28a00bd423664a0adbee98", "url": "data/backgrounds/backgrounds-aoe0.json" }, { "revision": "760e7f38b5727a3c4653ed20f5cd6d66", "url": "data/backgrounds/backgrounds-aoe4.json" }, { "revision": "c329b621daf0a3e0cadb103211c34bff", "url": "data/backgrounds/backgrounds-apg.json" }, { "revision": "ed95dfaff9809b458f1291453823f43c", "url": "data/backgrounds/backgrounds-av0.json" }, { "revision": "2ae57b22bdd49cdfe181cd3529e75b49", "url": "data/backgrounds/backgrounds-botd.json" }, { "revision": "31b8e7593bac4fc20ac9f2ddb44b972f", "url": "data/backgrounds/backgrounds-crb.json" }, { "revision": "25a30b78e22d18f216a3d8d554b86bc5", "url": "data/backgrounds/backgrounds-ec0.json" }, { "revision": "93d1d458d191b41d42375746c2596866", "url": "data/backgrounds/backgrounds-ec3.json" }, { "revision": "d08dab68c3792e18b13e7e38aa44d9f4", "url": "data/backgrounds/backgrounds-frp0.json" }, { "revision": "992956a3935c92946d34ce7b50c32068", "url": "data/backgrounds/backgrounds-g&g.json" }, { "revision": "3d6da7e6515e1e3eed3bf0f8d44b2c44", "url": "data/backgrounds/backgrounds-lopsg.json" }, { "revision": "e8575e9ef69b9091cb38846a84f4e1d4", "url": "data/backgrounds/backgrounds-lowg.json" }, { "revision": "63961cd8ce3f1baa8e107fc1c73e30c0", "url": "data/backgrounds/backgrounds-som.json" }, { "revision": "de810bc4c27dd0a67496b2a7fddc0d1f", "url": "data/backgrounds/backgrounds-sot0.json" }, { "revision": "5c92d8542c71097c784cab0b30d3d7de", "url": "data/backgrounds/fluff-backgrounds.json" }, { "revision": "75f6ed4c12d0673123018fdb8e3d1d5f", "url": "data/backgrounds/index.json" }, { "revision": "c38dd42ae29002cef356b9524f095dc2", "url": "data/bestiary/creatures-aoa1.json" }, { "revision": "9c1ad1f6253c36cfe434776ca7eb8c7e", "url": "data/bestiary/creatures-aoa2.json" }, { "revision": "b1d4151eeaa6f498cf0096f1823dde63", "url": "data/bestiary/creatures-aoa3.json" }, { "revision": "7feb3c5b481e64b10cc7c2b30ae3c27d", "url": "data/bestiary/creatures-aoa4.json" }, { "revision": "239035bfeb938257dcfe3eeb4f456aaa", "url": "data/bestiary/creatures-aoa5.json" }, { "revision": "ffa6c7e25911f4661df27076c38bbb6b", "url": "data/bestiary/creatures-aoa6.json" }, { "revision": "873e779548ac92ba8c937d47eca435ea", "url": "data/bestiary/creatures-aoe1.json" }, { "revision": "fa0a186ffbfaba9bb8f3ed452a06ebe1", "url": "data/bestiary/creatures-aoe2.json" }, { "revision": "3ad120ffe7b116341d773d5ecbcf3c31", "url": "data/bestiary/creatures-aoe3.json" }, { "revision": "88bc9301db3403909ba54b1bfdc9276e", "url": "data/bestiary/creatures-aoe4.json" }, { "revision": "b160f3d0f5d9f8e3af752e0e1fb8d071", "url": "data/bestiary/creatures-aoe5.json" }, { "revision": "0b2cc7d08be226cd02fc136296050dec", "url": "data/bestiary/creatures-aoe6.json" }, { "revision": "641aeb1699caa964d95150532d5a0167", "url": "data/bestiary/creatures-av1.json" }, { "revision": "ac03d3bafdde75c67f768b7807905556", "url": "data/bestiary/creatures-av2.json" }, { "revision": "95f7e01dba9fa281cf4157cfb164699b", "url": "data/bestiary/creatures-av3.json" }, { "revision": "aee7e87948c899648c683a5e977b5a7c", "url": "data/bestiary/creatures-b1.json" }, { "revision": "a2f800714117621777c7d85a16118c31", "url": "data/bestiary/creatures-b2.json" }, { "revision": "92aac55443cc87e0d28e1c74d8dca3f7", "url": "data/bestiary/creatures-b3.json" }, { "revision": "a64f9ab3dea678f4a7a6fcff50bf0929", "url": "data/bestiary/creatures-botd.json" }, { "revision": "8a75db30b88f5d42eb3b4a7bc4c2ce9e", "url": "data/bestiary/creatures-crb.json" }, { "revision": "059e6b583a9e512b4033026037330988", "url": "data/bestiary/creatures-ec1.json" }, { "revision": "a3c3ad0fa552eeade0df234ed5c67d7a", "url": "data/bestiary/creatures-ec2.json" }, { "revision": "0823a7a02a47e04e9ba50618631f93a5", "url": "data/bestiary/creatures-ec3.json" }, { "revision": "b43c09ef59270a069c7d4160173cc54e", "url": "data/bestiary/creatures-ec4.json" }, { "revision": "ee07420c8960e1cb7b3826d88db0d131", "url": "data/bestiary/creatures-ec5.json" }, { "revision": "f5ef77903cf5df868351575701504e32", "url": "data/bestiary/creatures-ec6.json" }, { "revision": "aa0d29ee5856201022e5c3390e4d7715", "url": "data/bestiary/creatures-fop.json" }, { "revision": "a9e3d95ba176792911ad48d5eb54123b", "url": "data/bestiary/creatures-frp1.json" }, { "revision": "4b66eb817a3032bcde597506ea6b0a35", "url": "data/bestiary/creatures-frp2.json" }, { "revision": "6bbbad52c8c6d34f6a613200ef7e811a", "url": "data/bestiary/creatures-frp3.json" }, { "revision": "27a7fdc6b255ae9ea3ab614728895daf", "url": "data/bestiary/creatures-gmg.json" }, { "revision": "48f1dfc8c2b688ee5b1362f7f60bbf87", "url": "data/bestiary/creatures-lome.json" }, { "revision": "63a1a8f0b14ddfb6f5dda99590c37660", "url": "data/bestiary/creatures-ltiba.json" }, { "revision": "d10ccddb6e804423feb5b6669b056e10", "url": "data/bestiary/creatures-sli.json" }, { "revision": "4ed3baaacf423f72c6261bcf4d06dd16", "url": "data/bestiary/creatures-sot1.json" }, { "revision": "bc0cb9e22a98ff9710bd072a8c474ea4", "url": "data/bestiary/creatures-sot2.json" }, { "revision": "8539ad97d374b1e8b7fc4149f56469e3", "url": "data/bestiary/creatures-sot3.json" }, { "revision": "d39cdc00b9ee13f4b137bf1f9076d3b2", "url": "data/bestiary/creatures-sot4.json" }, { "revision": "add03f9417e5cb200a3fe3547ccd507d", "url": "data/bestiary/creatures-sot5.json" }, { "revision": "09dff442efb65b2babe89564684bcdb6", "url": "data/bestiary/creatures-sot6.json" }, { "revision": "298b00ad7382f4d5a0126c047242cb79", "url": "data/bestiary/creatures-tio.json" }, { "revision": "caaf16707e3febba9ac5420f425f79cd", "url": "data/bestiary/fluff-creatures-av3.json" }, { "revision": "41ecca6113579fd10e8462d76930eeb5", "url": "data/bestiary/fluff-creatures-b1.json" }, { "revision": "9956f250f0e3e20efbf969f6cf057dee", "url": "data/bestiary/fluff-creatures-b2.json" }, { "revision": "4e51e07b489de9429f6595b26c72c197", "url": "data/bestiary/fluff-creatures-b3.json" }, { "revision": "234ac3d70f3043e88cad0726c55eec07", "url": "data/bestiary/fluff-creatures-gmg.json" }, { "revision": "f0b6aa97a48a31b2bd5950ff175a6f69", "url": "data/bestiary/fluff-creatures-lome.json" }, { "revision": "16addc75a4a672a3989b61df9bdeac32", "url": "data/bestiary/fluff-creatures-sot1.json" }, { "revision": "e597e9de684c06f35916193c652fc07d", "url": "data/bestiary/fluff-index.json" }, { "revision": "b95a5de59e7b390794017c5a34f1ebd1", "url": "data/bestiary/index.json" }, { "revision": "70449de343fea299336d3bafd08bf0c8", "url": "data/book/book-crb.json" }, { "revision": "74b92da7b3d53fc8aa3cd073fdb7918c", "url": "data/book/book-gmg.json" }, { "revision": "f6dc642a1a7f9f400edc19b6ecacf125", "url": "data/book/book-lowg.json" }, { "revision": "4fbf63c7e5bedf423b374b8e08015dcb", "url": "data/book/book-som.json" }, { "revision": "0c3963e200f2ff63a5657981c7d3c5d3", "url": "data/class/class-alchemist.json" }, { "revision": "d1e7a181bda984d712f0eba2fa6ee953", "url": "data/class/class-barbarian.json" }, { "revision": "ca27024ad217c27286f47d2339c93aba", "url": "data/class/class-bard.json" }, { "revision": "0de4ab56d6b18b57f8afec6ab90b9bab", "url": "data/class/class-champion.json" }, { "revision": "31dbb765c596fd16c7d4dc16ff8d4e74", "url": "data/class/class-cleric.json" }, { "revision": "1eea2b98bc16b447d3af4d6ad17d2c8c", "url": "data/class/class-druid.json" }, { "revision": "f74b60c14bc36d9ece13dbe38b0c2b89", "url": "data/class/class-fighter.json" }, { "revision": "c179d68e41d1aa2004aa7b2a2f460a4e", "url": "data/class/class-gunslinger.json" }, { "revision": "44a006cd1ce057efe4ac515ced691ad7", "url": "data/class/class-inventor.json" }, { "revision": "cc95d2fa3476c89c0eaa7b7a9330edc2", "url": "data/class/class-investigator.json" }, { "revision": "068cdf9bd235418bb89c461d4371175d", "url": "data/class/class-magus.json" }, { "revision": "f0b5a557c2cf577f2a44b11636e61073", "url": "data/class/class-monk.json" }, { "revision": "ef7be29190028ff7add88bda55aced1a", "url": "data/class/class-oracle.json" }, { "revision": "7d82bd5d46d1e1a507140e550e296b36", "url": "data/class/class-psychic.json" }, { "revision": "c2d99260f6c3366d365a94d01e69ae44", "url": "data/class/class-ranger.json" }, { "revision": "68a287e86cc7cec05e9d52244dc7c761", "url": "data/class/class-rogue.json" }, { "revision": "4da5ca79fcced2425b6d789a05e5ec9f", "url": "data/class/class-sorcerer.json" }, { "revision": "296ac1a2bf01afa0aa8361179aa77083", "url": "data/class/class-summoner.json" }, { "revision": "384556e64d752dfb39931079ec1f3261", "url": "data/class/class-swashbuckler.json" }, { "revision": "508d811ef4fce8efc6b757996d168104", "url": "data/class/class-thaumaturge.json" }, { "revision": "51f4f2db158311de5425f97a58472da4", "url": "data/class/class-witch.json" }, { "revision": "dd1a7f6672951f80d93e2644b29babf1", "url": "data/class/class-wizard.json" }, { "revision": "0c52a011ec39df14e8ef5b4082f769b4", "url": "data/class/index.json" }, { "revision": "f06d9f811d2bd5d2895a047a4f9d24ee", "url": "data/feats/feats-aoa3.json" }, { "revision": "4813066168fd931dedd9a972af58b8d4", "url": "data/feats/feats-aoa4.json" }, { "revision": "299ab38cdfa40261cb0c09c125cd4edd", "url": "data/feats/feats-aoa5.json" }, { "revision": "c00eec5f10785095d63c1019c5ac7a9c", "url": "data/feats/feats-aoa6.json" }, { "revision": "ae4c7855a818f4b0e3c21e99c5684793", "url": "data/feats/feats-aoe1.json" }, { "revision": "55227250e15ae838898b7ce9ac543018", "url": "data/feats/feats-aoe2.json" }, { "revision": "80201fd013f6c674d4e2d4997d7890fa", "url": "data/feats/feats-aoe3.json" }, { "revision": "1263d201c009db45fc62acf04a532cab", "url": "data/feats/feats-apg.json" }, { "revision": "e27d36f8dc88b6ad6a9570cfee819633", "url": "data/feats/feats-av1.json" }, { "revision": "28eedcd44fa991afa4095de96cfd21ed", "url": "data/feats/feats-av2.json" }, { "revision": "996022e9c1ac115da3df8c4f71fa9de2", "url": "data/feats/feats-av3.json" }, { "revision": "956f0599d4febc390edb454d70742466", "url": "data/feats/feats-botd.json" }, { "revision": "d7a5bfe7f83562ab7fbed7c2f05e21de", "url": "data/feats/feats-crb.json" }, { "revision": "6ca020b9400545deb29e5348467b41e0", "url": "data/feats/feats-da.json" }, { "revision": "0e49c6b28d5272e0ce04608dd802cd3e", "url": "data/feats/feats-ec1.json" }, { "revision": "340e93641d23ed3ccaa18cb6e300b421", "url": "data/feats/feats-ec2.json" }, { "revision": "c60d3f4d08948d5b8db366fcd3b63831", "url": "data/feats/feats-ec3.json" }, { "revision": "7f31c727001efdf2ad8cdabe932c008f", "url": "data/feats/feats-ec6.json" }, { "revision": "2679acd5f9129bc065dd6a93b027bce6", "url": "data/feats/feats-fop.json" }, { "revision": "894ffbf6d9a01c33ae5286770129901d", "url": "data/feats/feats-frp1.json" }, { "revision": "6932d4cc7b5c9890a0f08707fee13945", "url": "data/feats/feats-frp2.json" }, { "revision": "a6f5fe4207cfa285cce9db80256d64e7", "url": "data/feats/feats-frp3.json" }, { "revision": "1deb02feeb1336051b34ad3f496b23c7", "url": "data/feats/feats-g&g.json" }, { "revision": "90aa7169925660c88133037ca2862b16", "url": "data/feats/feats-gmg.json" }, { "revision": "3bd7807bea97b42b73a69eec363a3a4e", "url": "data/feats/feats-loag.json" }, { "revision": "8785ef2b6efed214f4b3bc1106b19389", "url": "data/feats/feats-locg.json" }, { "revision": "577fe62588929b9267f4d1a3f2e5ab5a", "url": "data/feats/feats-logm.json" }, { "revision": "450cc98a26b9308e3f48b18ee89c5086", "url": "data/feats/feats-lol.json" }, { "revision": "c5615888d2a1f2c88ac349af9242fdba", "url": "data/feats/feats-lome.json" }, { "revision": "4ea13bc182b4c06cd0b10d3b43bad21f", "url": "data/feats/feats-lopsg.json" }, { "revision": "a385fca217460a194f7928a96f9608cd", "url": "data/feats/feats-lotgb.json" }, { "revision": "9d81f9de3fa30f7bcd1d1d31582d8292", "url": "data/feats/feats-lowg.json" }, { "revision": "8120b6dfff1a035457d00e443b026a5d", "url": "data/feats/feats-ltiba.json" }, { "revision": "8361d7596a6aed3b3c317d24c1fc42a5", "url": "data/feats/feats-sli.json" }, { "revision": "fe110fbce62445f8bad928d1d7548bb5", "url": "data/feats/feats-som.json" }, { "revision": "9d5fcd1dc805bc30e3b63af69264fc99", "url": "data/feats/feats-sot2.json" }, { "revision": "1e187e3b695532b73fac3598bb3fe857", "url": "data/feats/feats-sot3.json" }, { "revision": "1d195719dcf88c24648226a4c3e776e7", "url": "data/feats/feats-sot4.json" }, { "revision": "216a2dd4bd7828ef83f9356df66330b1", "url": "data/feats/feats-sot6.json" }, { "revision": "3a09390fad7efd5df03af6cd50d97e6d", "url": "data/feats/index.json" }, { "revision": "6374485f85a565df9bba364c0002f33e", "url": "data/generated/bookref-gmscreen-index.json" }, { "revision": "867fc2a4799d989ef8dff7965786b156", "url": "data/generated/bookref-gmscreen.json" }, { "revision": "e2c1e02f9c8a0dde62701cab44a94769", "url": "data/generated/bookref-quick.json" }, { "revision": "688a74016f76e2edf07802a3f0ba58f4", "url": "data/generated/gendata-nav-adventure-book-index.json" }, { "revision": "999f4c93c5b39eedce2488b1af23f219", "url": "data/items/baseitems.json" }, { "revision": "2a0e961a2e9181d5c599cfc1c56ae880", "url": "data/items/fluff-index.json" }, { "revision": "1fc0fcdbb0518e8fd10d16c8c67efd6f", "url": "data/items/fluff-items-crb.json" }, { "revision": "4b8cfdc47b16e8917e02d80dbabc34fb", "url": "data/items/fluff-items-lome.json" }, { "revision": "544cc213fc4b87024c25ccd198ba65e2", "url": "data/items/fluff-items-som.json" }, { "revision": "7837bc17825ebb0551a6727a81bcd094", "url": "data/items/index.json" }, { "revision": "2b27a7968e2c78c013f7bd7b2b02150f", "url": "data/items/items-aoa1.json" }, { "revision": "92e1c6c149ff994136ed22afde62f459", "url": "data/items/items-aoa2.json" }, { "revision": "8040bb1c7d284f9ae2c318d2bc4f1aef", "url": "data/items/items-aoa3.json" }, { "revision": "301ea0b97b5c75f91399f4b5b3c7d9fc", "url": "data/items/items-aoa4.json" }, { "revision": "d144244faae90b6caee4c4ec3d6e144e", "url": "data/items/items-aoa5.json" }, { "revision": "620a9d0652f00790daafbcc362f18d2b", "url": "data/items/items-aoa6.json" }, { "revision": "f388a33b6fcb63f2231f5ac9f10f6535", "url": "data/items/items-aoe1.json" }, { "revision": "0ee6713fe10b1df9f09016b45c1e2355", "url": "data/items/items-aoe2.json" }, { "revision": "ea4e78794024814a38cca52e0689204f", "url": "data/items/items-aoe3.json" }, { "revision": "a644c7de091cde94db915600dd7ba05a", "url": "data/items/items-aoe4.json" }, { "revision": "be8cf843b68f3bfc6afa22298edd670a", "url": "data/items/items-aoe5.json" }, { "revision": "9512007298c8b8b34d07300c23b51273", "url": "data/items/items-aoe6.json" }, { "revision": "5829c4f02d223987b711f12bd462a4b8", "url": "data/items/items-apg.json" }, { "revision": "da37bd5d379b0cf6514637304c842de2", "url": "data/items/items-av1.json" }, { "revision": "0b61bf4d8b0817ef924449f6813567af", "url": "data/items/items-av2.json" }, { "revision": "6930e38347c700ec67417b8f341e98f2", "url": "data/items/items-av3.json" }, { "revision": "e5eaed34041530c2ac191992b597b182", "url": "data/items/items-b1.json" }, { "revision": "b36534fc5fab847e2bde3e5b965ef4b0", "url": "data/items/items-botd.json" }, { "revision": "2d41e6b806be58767bb1608ba0ad695b", "url": "data/items/items-crb.json" }, { "revision": "d975688fa60c18eeb66424de07f34bad", "url": "data/items/items-ec1.json" }, { "revision": "a3c214058ce66bc52ab0d766bfb746cf", "url": "data/items/items-ec2.json" }, { "revision": "fbb9a5984826f3aa9a1d85a8e6ba980c", "url": "data/items/items-ec3.json" }, { "revision": "086cb09f7ea6a7154c8f0dcc3486b9af", "url": "data/items/items-ec4.json" }, { "revision": "80ea7005ac742594e93e651f209935e3", "url": "data/items/items-ec5.json" }, { "revision": "9389ccf464fd96ee2d2d1c527ca07d9a", "url": "data/items/items-ec6.json" }, { "revision": "f309e5819078c9706795c8a911f2bc02", "url": "data/items/items-fop.json" }, { "revision": "dfcc8db2122748add0cea90f66c64138", "url": "data/items/items-frp1.json" }, { "revision": "e4f341ac6eafbe88c5629bac89017287", "url": "data/items/items-frp2.json" }, { "revision": "3628d966b2406e1bdbe242f528ae262b", "url": "data/items/items-g&g.json" }, { "revision": "9ccbb5c10ca33e40fcfa5df42bcfb7e7", "url": "data/items/items-gmg.json" }, { "revision": "39b40da0da37b66d85b1649ca27ef231", "url": "data/items/items-loag.json" }, { "revision": "39ca9a97cf3bdb5cdc3dd66b5db6aec0", "url": "data/items/items-locg.json" }, { "revision": "4f996041572aa0d60ca8bb4cbf942403", "url": "data/items/items-logm.json" }, { "revision": "e98ff4608822fb41299774026c6d35f0", "url": "data/items/items-lol.json" }, { "revision": "83756a937d981a12270e5deec2bfecc7", "url": "data/items/items-lome.json" }, { "revision": "c04e894f7067be971380b3a92d274d61", "url": "data/items/items-lopsg.json" }, { "revision": "857ab1d7be2c99021dba342fd3f82173", "url": "data/items/items-lotgb.json" }, { "revision": "5fc458aa024fff22e51b79635dc419f3", "url": "data/items/items-lowg.json" }, { "revision": "f70d275b684cadd2b199f185d8fc10bd", "url": "data/items/items-ltiba.json" }, { "revision": "69e1fd21d44db08a236ca255bf9c40a6", "url": "data/items/items-sli.json" }, { "revision": "ae597d50e2e8d7236c7c40fbff8d45ea", "url": "data/items/items-som.json" }, { "revision": "36860c51f29389aeea4a56fdc9f9c785", "url": "data/items/items-sot1.json" }, { "revision": "8ae93310a76708291a3d4f86aede8f9a", "url": "data/items/items-sot2.json" }, { "revision": "6f2fb88effa644233c1ed511887b174f", "url": "data/items/items-sot3.json" }, { "revision": "a72fc58b555045b2d6db3bcaaf4757f6", "url": "data/items/items-sot4.json" }, { "revision": "30f538d6dbbef01791b481495ed833fc", "url": "data/items/items-sot5.json" }, { "revision": "73b0f646b4031c86100aa45382073e6d", "url": "data/items/items-sot6.json" }, { "revision": "869c873dc073c9358e2f9e79ac8fe255", "url": "data/items/items-tio.json" }, { "revision": "8a80554c91d9fca8acb82f023de02f11", "url": "data/spells/fluff-index.json" }, { "revision": "f920085231e757757cb468c13478dc69", "url": "data/spells/index.json" }, { "revision": "e833ba0daa770b902a729e79e5e79001", "url": "data/spells/spells-aoa3.json" }, { "revision": "71265c9a3305ce5ecbc35935dc84496c", "url": "data/spells/spells-aoa4.json" }, { "revision": "c17f9a0212e24d921c2515a8f2886cb7", "url": "data/spells/spells-aoa6.json" }, { "revision": "eadc381922aea8b3ccb3c79171009531", "url": "data/spells/spells-aoe2.json" }, { "revision": "fdf988f55cdd74f76caec74eb3b947c3", "url": "data/spells/spells-aoe4.json" }, { "revision": "dfc54760478102c6b52d494ccc651026", "url": "data/spells/spells-aoe5.json" }, { "revision": "357deb119298e9ed8fb3d69bd0aac347", "url": "data/spells/spells-aoe6.json" }, { "revision": "141daa0f302caf353b8f8d1104784c94", "url": "data/spells/spells-apg.json" }, { "revision": "f295604dad976d394bba8aeaed0895be", "url": "data/spells/spells-av1.json" }, { "revision": "8114c429781f52295b8a4fd8680985c0", "url": "data/spells/spells-av2.json" }, { "revision": "9a12c464f858f63aaf8883683d0a8017", "url": "data/spells/spells-av3.json" }, { "revision": "e89be024004cee5edc5250dcacfb9e3d", "url": "data/spells/spells-botd.json" }, { "revision": "2472dcc10ce8ba6f8ee604cd2724f493", "url": "data/spells/spells-crb.json" }, { "revision": "c9cd0d0bf10fc4badf82f661e8d8bf14", "url": "data/spells/spells-da.json" }, { "revision": "14c7dd516d259d8bea2458f70277d46c", "url": "data/spells/spells-ec1.json" }, { "revision": "457fc909b3d610b7eb4e17eab708626f", "url": "data/spells/spells-ec2.json" }, { "revision": "fbe4e09f3228c9636b6140ae26ed0bb5", "url": "data/spells/spells-ec3.json" }, { "revision": "cb0e3111ae867d4fdfbf69128387aa88", "url": "data/spells/spells-ec4.json" }, { "revision": "da2e308c456c1f9b212d7bb867954afe", "url": "data/spells/spells-ec5.json" }, { "revision": "aa9379b337c92703b37133011f7db47c", "url": "data/spells/spells-ec6.json" }, { "revision": "895dd3bfd99a7f65a54406c525e9e760", "url": "data/spells/spells-frp1.json" }, { "revision": "169421c4672b543f4b7fa00c8d243f72", "url": "data/spells/spells-frp3.json" }, { "revision": "bdcbc2c264f93fd6bd3e8476c5efb014", "url": "data/spells/spells-locg.json" }, { "revision": "18fb28eea390cdea1fe0b3d99815cfe3", "url": "data/spells/spells-logm.json" }, { "revision": "900afd06d1a92ae68b6f73e991dbf71c", "url": "data/spells/spells-lol.json" }, { "revision": "2a3e5d04a3a376f7957aa9e7a08b6e35", "url": "data/spells/spells-lopsg.json" }, { "revision": "a5603e5f79a4fd10dc87b4eff8961205", "url": "data/spells/spells-lowg.json" }, { "revision": "1fae82fd282ca3929fcd45988bc4a8f8", "url": "data/spells/spells-som.json" }, { "revision": "f73c30d9e4333665c57d39babba84449", "url": "data/spells/spells-sot1.json" }, { "revision": "7301ca80c2b7ff4889181901c1b6ed64", "url": "data/spells/spells-sot3.json" }, { "revision": "6df78da6fed19185c923c698af953e4d", "url": "data/spells/spells-sot4.json" }, { "revision": "52eb4d835888e9b4df0ceece216fdf3c", "url": "data/spells/spells-sot5.json" }, { "revision": "4d30098a93e1b3de38ea661b3aed95a5", "url": "abilities.html" }, { "revision": "45e674213259f82f4d1724e658550935", "url": "actions.html" }, { "revision": "1df5cfea4d0143108be6df12c603d178", "url": "adventure.html" }, { "revision": "064f1aab3a0b194cc930813db2f78ed8", "url": "adventures.html" }, { "revision": "719f1b15116292a6f76f5caca717943a", "url": "afflictions.html" }, { "revision": "d685f1f9de61393bf087e93071829060", "url": "ancestries.html" }, { "revision": "08598b89973d46e338716c40b3bb5fd7", "url": "archetypes.html" }, { "revision": "c57039ea5c6c8cc8fd370d95dc6fd2ef", "url": "backgrounds.html" }, { "revision": "df834b8d68a5ff74e7585f6ff6740e1a", "url": "bestiary.html" }, { "revision": "2ca8c1914c92e7489cc1dfbe970122c6", "url": "blacklist.html" }, { "revision": "6c98ed9625a7dd14ae21eed278108d7c", "url": "book.html" }, { "revision": "8c93c39cde65be9d90321054079b8b90", "url": "books.html" }, { "revision": "9dd45817118ec898363cb4f09f52d380", "url": "changelog.html" }, { "revision": "1a15926685dd0b2ded742dbadce4b193", "url": "classes.html" }, { "revision": "f58637255c12732a1eaeb091f010bb07", "url": "companionsfamiliars.html" }, { "revision": "edc076f47e0bb5deb9c4419da456fe3e", "url": "conditions.html" }, { "revision": "810b56b526244c976e586f9646b09179", "url": "creaturetemplates.html" }, { "revision": "0f97080fcd19913b2b7681844c515f41", "url": "deities.html" }, { "revision": "f433280b3ad9d97acbc0c290b9b60682", "url": "donate.html" }, { "revision": "4b27fc77a19bf4e93fd83661dd7cb7bc", "url": "feats.html" }, { "revision": "39f97b348d41cf8a97c197ba602965d2", "url": "gmscreen.html" }, { "revision": "ff32aba6400842a60a712afef0a63b9d", "url": "hazards.html" }, { "revision": "8a3b54a77e9bfa708f13421d3760a229", "url": "index.html" }, { "revision": "298e11b359967b37d2c23d8b0942781d", "url": "inittrackerplayerview.html" }, { "revision": "7e699ee518fb89661e5ff6cf6f42dcd2", "url": "items.html" }, { "revision": "52e63b01c5697f5f68003ce4285b0553", "url": "langdemo.html" }, { "revision": "14ee89bf592cd0e18349c9469d48db78", "url": "languages.html" }, { "revision": "6c5eadde0c4fc3149a71e5e6a84921df", "url": "licenses.html" }, { "revision": "fb282ffd69f619cc583423403e82e4ae", "url": "managebrew.html" }, { "revision": "3ac875c1710306dce6431ce2549e7cae", "url": "optionalfeatures.html" }, { "revision": "fc02ecf1afb90e4e0c52d4c32817ea46", "url": "organizations.html" }, { "revision": "14cdd2d2a26bd643781d17f14217221d", "url": "Pf2eTools.html" }, { "revision": "5ff8a7cdef3e0381ddc4518fdc17d8d8", "url": "places.html" }, { "revision": "345fa1f7f5471ab11192237c03f2c86e", "url": "privacy-policy.html" }, { "revision": "e3a76437e38a1343d6e03773e23f77dc", "url": "quickreference.html" }, { "revision": "6a155ecb78441a94b117e52df26b134c", "url": "renderdemo.html" }, { "revision": "735062d33d767fb4c2ce52917533ca2b", "url": "rituals.html" }, { "revision": "d19c1e7c1199a72d71daac27cd7f3e14", "url": "search.html" }, { "revision": "0dc24ba6fb44e77afe4ef248c913d107", "url": "spells.html" }, { "revision": "6c24153f82a044dc047001f6805254f5", "url": "tables.html" }, { "revision": "af5f4672ec879916d5a61ba628a8c29f", "url": "textconverter.html" }, { "revision": "728f8a10bb3e8afe858465f1cadf04ae", "url": "traits.html" }, { "revision": "abe874e1bebc1df6e4adaa724ae19eba", "url": "variantrules.html" }, { "revision": "1453f603d4bf89028def5efc6f96ebfb", "url": "vehicles.html" }, { "revision": "1eafdb500d59233b7d0b74bcb25babd5", "url": "search/index-alt-spell.json" }, { "revision": "a2c797a51147f62dc30cc0c616e035c2", "url": "search/index-item.json" }, { "revision": "4a391003b18febea6d407d24021fca4f", "url": "search/index.json" }, { "revision": "f8308b09f20ef5e10d7f8cd7bbf95ef0", "url": "search/traits.json" }, { "revision": "4050573dedbe1cc64b4fdcad04351daa", "url": "manifest.webmanifest" }, { "revision": "448c34a56d699c29117adc64c43affeb", "url": "fonts/glyphicons-halflings-regular.woff2" }, { "revision": "e18bbf611f2a2e43afc071aa2f4e1512", "url": "fonts/glyphicons-halflings-regular.ttf" }, { "revision": "d09e5b926b6fdb2a506e5909de33de23", "url": "fonts/good-pro-400.ttf" }, { "revision": "9f6134a15b7dfc5a119bc65376dbe269", "url": "fonts/good-pro-400.woff" }, { "revision": "ff1abe8ed0ef061106b68d844c8dab4d", "url": "fonts/good-pro-400.woff2" }, { "revision": "361e7ff40e96db6bbbfe90889d95afdc", "url": "fonts/good-pro-700.ttf" }, { "revision": "1997214212f12c3e4a68f5195e68cb5d", "url": "fonts/good-pro-700.woff" }, { "revision": "0fea4b7d69bbcb12a33f0922262c6421", "url": "fonts/good-pro-700.woff2" }, { "revision": "a11892b605845bf613d1a8bb06c00b04", "url": "fonts/good-pro-condensed-400.ttf" }, { "revision": "6421dccde27db5dba3399149e69f71d3", "url": "fonts/good-pro-condensed-400.woff" }, { "revision": "ea4d723a4099259aba94b84e333034f8", "url": "fonts/good-pro-condensed-700.ttf" }, { "revision": "fc0455882bdfe0c48aa7186da15c85f3", "url": "fonts/good-pro-condensed-700.woff" }, { "revision": "46aa1be77a9022bb5ee43a8513fb3057", "url": "fonts/good-pro-condensed-700.woff2" }, { "revision": "51853144d912fd5553eeb7d39c3b53bf", "url": "fonts/good-pro-condensed-italic-400.ttf" }, { "revision": "41d2455a8dea4aac5165b82743681efa", "url": "fonts/good-pro-condensed-italic-400.woff" }, { "revision": "5a10bdbc21e43df2acd07e2487820d60", "url": "fonts/good-pro-condensed-italic-700.ttf" }, { "revision": "556dd5c152d5b0739a5121f37a2baff4", "url": "fonts/good-pro-condensed-italic-700.woff" }, { "revision": "1bc04907c2bf079908e90e0313239bcd", "url": "fonts/good-pro-condensed-italic-700.woff2" }, { "revision": "ff1eae181861f44db0ab1431879a49f9", "url": "fonts/good-pro-italic-400.ttf" }, { "revision": "a9ed15953b80fedb8137f8f25839fb96", "url": "fonts/good-pro-italic-400.woff" }, { "revision": "1b23ad64d84c8cee844cf53e466e6eed", "url": "fonts/good-pro-italic-400.woff2" }, { "revision": "55ee8f359a01d66ab3b8b22d02d9ed55", "url": "fonts/good-pro-italic-700.ttf" }, { "revision": "6ee51b012748f002f234b578ab1268b7", "url": "fonts/good-pro-italic-700.woff" }, { "revision": "7489b33e26f603728567f2ccee7e508e", "url": "fonts/good-pro-italic-700.woff2" }, { "revision": "2640ba59a59d7dfbb88d0d477f7bdb0a", "url": "fonts/Pathfinder2eActions.ttf" }, { "revision": "c153508add58cc58db1ef0be5c9f8adf", "url": "fonts/Gin-Regular.ttf" }, { "revision": "b0bf2c218bf460993111010eb83a0fa8", "url": "fonts/SabonLTStd-Bold.ttf" }, { "revision": "1b97aaf6b6e56d43d0b9e370c4f50876", "url": "fonts/SabonLTStd-BoldItalic.ttf" }, { "revision": "d69ef52beb7ca47462a0f89ff028a2f3", "url": "fonts/SabonLTStd-Italic.ttf" }, { "revision": "d6e119cff761a4bee40d2f640db5af1e", "url": "fonts/SabonLTStd-Roman.ttf" }, { "revision": "778896312671ade54c606724f278bf36", "url": "fonts/AlbertusMT.ttf" }, { "revision": "918ab3311bf65e4da491aaba2f2ca5bc", "url": "fonts/Basing.ttf" }, { "revision": "2f95108599bc770e0fc66a063b0f5906", "url": "fonts/Taroca.ttf" }, { "revision": "c18c5f06b696ed2d4c1e5eda8cc204ca", "url": "img/gmscreen/moon.webp" }, { "revision": "183504177c2f7e2ccc6b88461af6000d", "url": "img/letter-dark.webp" }, { "revision": "43877a1bc57da60ca9a9aafeac9d8e2f", "url": "img/letter.webp" }, { "revision": "4279516591cee28c697c6d2f84d84da1", "url": "img/patreon.webp" }, { "revision": "12f8d0eeba4504e025f30e4bf6326cd6", "url": "fonts/fa-light-300.eot" }, { "revision": "da5526bf0f7fae09080945b15da77066", "url": "fonts/fa-light-300.ttf" }, { "revision": "83c52b7102d3b3586554677f947792e7", "url": "fonts/fa-light-300.woff" }, { "revision": "1d4e499e402761b86c26b5fa3ad51c30", "url": "fonts/fa-light-300.woff2" }, { "revision": "09554888dac30eee041e8047d3dc75b4", "url": "sw-injector.js" }]);
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
  var runtimeManifest = new Map([["data/adventure/adventure-id.json", "0c5df72c500b54de8c5914107bb0da92"], ["img/covers/blank.webp", "9b2781e05d13f720e91891cbb929fe20"], ["img/covers/CRB-100.webp", "7650bb7365cbf84b20ee97c6b7c0a189"], ["img/covers/CRB-25.webp", "716475fd096ad77eee0ed1b47c3a1431"], ["img/covers/CRB-33.webp", "d7ef321523e2f1321fe8a5324ed4643c"], ["img/covers/CRB.webp", "bfc8f8b52b8faeee86027947182edcf8"], ["img/covers/GMG-100.webp", "75c327c893ef10c786f963236b4fe9d0"], ["img/covers/GMG-25.webp", "a67231c72c04e4a4c018bbd33110198b"], ["img/covers/GMG-33.webp", "6b05c52c0af37ef6ae43cf6f5d719a9c"], ["img/covers/GMG.webp", "d3610c80b6d79213177340f0c5f8db06"], ["img/covers/LOWG-100.webp", "266ffa70d70230e300ed454c612e59cf"], ["img/covers/LOWG-25.webp", "61855c40cd160dcf3bc8c39dc10844c3"], ["img/covers/LOWG-33.webp", "138e39219a0a4da133f3519125e9bc3f"], ["img/covers/LOWG.webp", "1adccec87cc1324fecd5e34ebeef69d4"], ["img/covers/SoM-100.webp", "ed511ca0c38bbe1644ec1b8729e7fb9b"], ["img/covers/SoM-25.webp", "51f0a78fa32ece446abc13ada184a2bc"], ["img/covers/SoM-33.webp", "675e9f72483daeaf814cd1ac38e232c7"], ["img/covers/SoM.webp", "880dd82ad81eda61b903d28e4bdde4f9"], ["img/gmscreen/moon.webp", "c18c5f06b696ed2d4c1e5eda8cc204ca"], ["img/letter-dark.webp", "183504177c2f7e2ccc6b88461af6000d"], ["img/letter.webp", "43877a1bc57da60ca9a9aafeac9d8e2f"], ["img/patreon.webp", "4279516591cee28c697c6d2f84d84da1"], ["img/logo/Background.svg", "c6ec599d06aa5b773e600881ceeb0460"], ["img/logo/No%20Background.svg", "6d3b2f0a213f7bc5beba9e88f20667f7"], ["android-chrome-192x192.png", "9c862118ab3423bc2d01ab42f755e07b"], ["android-chrome-256x256.png", "fad8c4a79079fa54737cb9532e141aa0"], ["android-chrome-384x384.png", "4f2267d39b6bd3389138f074c45dfe67"], ["apple-touch-icon-120x120.png", "fe434a800beb3381ad59197e29e68a2a"], ["apple-touch-icon-152x152.png", "3b23873f540b0c5271201c5f91a0c7ed"], ["apple-touch-icon-167x167.png", "e19815500c57552e18f8218fbdb5cb72"], ["apple-touch-icon-180x180.png", "c9ecf9df6e7f7f55974f45f7110d9890"], ["apple-touch-icon-360x360.png", "b5d0e83a94f7fbea21006b7479d8a898"], ["favicon-128x128.png", "c7b2e3d1de45c84588bc4711a4b50c6d"], ["favicon-144x144.png", "6770b376fb68b50e546e60d4a0dae9aa"], ["favicon-16x16.png", "3dbac8b48aaa087a66f7e3a16af56994"], ["favicon-256x256.png", "e31f4ad5d254f7faedf87bd8ac8e3d1c"], ["favicon-32x32.png", "61f449203da4d72d7669df93ef5d1a0c"], ["favicon-48x48.png", "5144e32c3e7170887ec5c99adeeaaed2"], ["favicon-64x64.png", "be61a655807353c6f8dcb86ff896c581"], ["mstile-144x144.png", "9f6d0f9700426867bddb7614da8ece66"], ["mstile-150x150.png", "ba04e45075fa41f85441a1d070b40710"], ["mstile-310x150.png", "e37a7cc30a0283d5357fd38901cb6f56"], ["mstile-310x310.png", "80a2fed08dac45aa2cfc55ddaa5b69fa"], ["mstile-70x70.png", "798a4847c77967a489d66a40ef1d8801"], ["favicon.svg", "959b9c72ddadfdf4a067012231a84afb"], ["safari-pinned-tab.svg", "e84a2ecd6fd15fb32fc3f75293ef467c"]].map(([
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
