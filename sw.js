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
  precacheAndRoute([{ "revision": "bff224138a11de78139b8edd2e28d8f5", "url": "js/abilities.js" }, { "revision": "6f87ed68416f9dc1b85997b8ba191c7a", "url": "js/actions.js" }, { "revision": "b77043701c9d0959ccbe09b16075b476", "url": "js/adventure.js" }, { "revision": "afd04a01308ea7d720080e04f2374e26", "url": "js/adventures.js" }, { "revision": "4206532cbe7967a4e8bd94ce31467a6a", "url": "js/afflictions.js" }, { "revision": "077bf5197067ef4fdf08b20390f06044", "url": "js/ancestries.js" }, { "revision": "856995b1b9e1e38dc9f27c024a540ffd", "url": "js/archetypes.js" }, { "revision": "fd642c29de4145e7c8b126d2db0f5aa9", "url": "js/backgrounds.js" }, { "revision": "3561fb5898753b5a7066ce0149a2ed17", "url": "js/bestiary-encounterbuilder.js" }, { "revision": "2e047a35bb1590c17fdfb3dc20497a0f", "url": "js/bestiary.js" }, { "revision": "c8495cf76e51fcb2a6dd3ab2b9bf024d", "url": "js/blacklist.js" }, { "revision": "cf8b1081a981252c511a55d4d4fcb794", "url": "js/book.js" }, { "revision": "005533c9f3cfa9f50763a75446a6d082", "url": "js/books.js" }, { "revision": "89b98ecfaead2407b035306079e88ac0", "url": "js/bookslist.js" }, { "revision": "2668da76cb52abadf8966976799d51c4", "url": "js/bookutils.js" }, { "revision": "fcdd2d5a5fa60ce1ba9724bfcffc10a3", "url": "js/browsercheck.js" }, { "revision": "e0528fa91953304b60397091dce3e78c", "url": "js/classes.js" }, { "revision": "34a1f21fdaa5346c6688a04bb069265b", "url": "js/companionsfamiliars.js" }, { "revision": "c8635e500d7cc69a95e411afcd58b10b", "url": "js/conditions.js" }, { "revision": "33f48ed323e642b7954344b6aaee5358", "url": "js/converter.js" }, { "revision": "5ffb506599a924367b2b35b490776976", "url": "js/converterutils.js" }, { "revision": "bf42799998e1ae9c8b93296bc9ac3b10", "url": "js/deepbg.js" }, { "revision": "3b628c50aa07372a42944585fbbf492b", "url": "js/deities.js" }, { "revision": "258b3ee09ac8b761788a24bc96d30009", "url": "js/encountergen.js" }, { "revision": "4743182d3041c1695141ffaf9aa31b25", "url": "js/feats.js" }, { "revision": "92e30ed212c31d9605475860ecf126c6", "url": "js/filter-abilities.js" }, { "revision": "a2527a50417b4388093294da19fcf61a", "url": "js/filter-actions.js" }, { "revision": "9da63f3bbd8c14034a66c7812d657e30", "url": "js/filter-afflictions.js" }, { "revision": "bef470a34450339e215be0e0c8b65c04", "url": "js/filter-ancestries.js" }, { "revision": "d02a241607c92562a6876a83b2a721e1", "url": "js/filter-archetypes.js" }, { "revision": "f226fe5265f0c187bb92d46a2c5cffcf", "url": "js/filter-backgrounds.js" }, { "revision": "f8ca54bcf3a0e39db64d8a3418e547e8", "url": "js/filter-bestiary.js" }, { "revision": "ee9b61ebde119b505c4f9857152c490a", "url": "js/filter-classes.js" }, { "revision": "b8f662a95c9c7eea96a1ed02bebc2395", "url": "js/filter-companionsfamiliars.js" }, { "revision": "01d0198d8a49c4084a8dfd284f9acdfd", "url": "js/filter-conditions.js" }, { "revision": "bdb2215b30ad279421b2879a47dd77c2", "url": "js/filter-deities.js" }, { "revision": "93ec1ed46e338065cd80b60bf0bcf5ff", "url": "js/filter-feats.js" }, { "revision": "c3342972343057c23a45d681c5d6594f", "url": "js/filter-hazards.js" }, { "revision": "afe128d86632a2f32d94dcadb128b615", "url": "js/filter-items.js" }, { "revision": "8658e3224436539cea596d85bc54a7f3", "url": "js/filter-languages.js" }, { "revision": "4869d2f8bf1cd41bcd760879277267d6", "url": "js/filter-optionalfeatures.js" }, { "revision": "07c1f28e188ae8560111a6a649668cff", "url": "js/filter-organizations.js" }, { "revision": "7450630040ac2df65f472b93065ce1b1", "url": "js/filter-places.js" }, { "revision": "f10c876c891b8fb1d3de71b63f52d2a6", "url": "js/filter-rituals.js" }, { "revision": "f1f638fc0316bb93a27ee4fb40d43e08", "url": "js/filter-spells.js" }, { "revision": "0056fa05b7e250a63ec4bff155fc5a47", "url": "js/filter-tables.js" }, { "revision": "156803c6e0498a3be476b1461c5d1126", "url": "js/filter-traits.js" }, { "revision": "53195188817e934e81fc71be0dc342ca", "url": "js/filter-variantrules.js" }, { "revision": "288f3133e37b96e77ba39b9e53a3074c", "url": "js/filter-vehicles.js" }, { "revision": "27b0eb948613a25b9364b55c4a51e203", "url": "js/filter.js" }, { "revision": "4a7391d2fc506eea0820717215205be0", "url": "js/genutils.js" }, { "revision": "1af489ed9eb6aea5cdba69ac22a3ba32", "url": "js/gmscreen-counter.js" }, { "revision": "4bb91136ae275283a67c81bfad82ee1e", "url": "js/gmscreen-initiativetracker.js" }, { "revision": "b0bd03dc47401ec8f014dcafbe63760d", "url": "js/gmscreen-mapper.js" }, { "revision": "a81574a2ea086605bd52a50c85f0b38b", "url": "js/gmscreen-moneyconverter.js" }, { "revision": "0820f3fecdf88318228c658a08f871d9", "url": "js/gmscreen-playerinitiativetracker.js" }, { "revision": "114402932f1a6e2779eb4f568d55e889", "url": "js/gmscreen-timetracker.js" }, { "revision": "bc5c371aaf9d7a8919d5a8b0f5085f3c", "url": "js/gmscreen.js" }, { "revision": "af0baf01eeaecc04159ab738fa58a3c6", "url": "js/hazards.js" }, { "revision": "55a560efb3633591522534b7d73c3b5f", "url": "js/hist.js" }, { "revision": "8877e659b11538a388eb7482af7836c3", "url": "js/initiativetrackerutils.js" }, { "revision": "06d61dec77683dc800dac3c13873c27d", "url": "js/inittrackerplayerview.js" }, { "revision": "a08c42abae40e4fc958515abe907fac7", "url": "js/items-runebuilder.js" }, { "revision": "6415b0fa9544903684b26246dbcbf3f5", "url": "js/items.js" }, { "revision": "7e74acf03990a05d3638e64a5efdc205", "url": "js/langdemo.js" }, { "revision": "e3d8782fd370b5c92cc7047cd0863630", "url": "js/langdemo2.js" }, { "revision": "33dca4f3c44b721a924c18e43b3a54b4", "url": "js/languages.js" }, { "revision": "343c13ceb38f06f3a18cc088d54cb6ce", "url": "js/list2.js" }, { "revision": "944eb688ec60d80cdac8ee15949fbae0", "url": "js/listpage.js" }, { "revision": "888780ad6c04d994f175f558f1ea2b27", "url": "js/managebrew.js" }, { "revision": "1052fda9db687a93b39e6bc10b9fa7bd", "url": "js/multisource.js" }, { "revision": "e124ab8691ae714e0af1d870a0c960a0", "url": "js/navigation.js" }, { "revision": "33f9d2873e38ee180d73882afddcb180", "url": "js/omnidexer.js" }, { "revision": "4bb739dcde0557d96bf5d9cb3506fcea", "url": "js/omnisearch.js" }, { "revision": "f0ad599c5f9dc098bb90393ba45d6072", "url": "js/optionalfeatures.js" }, { "revision": "3af68aa15b0de5c23a463d02e132a135", "url": "js/organizations.js" }, { "revision": "bd43909631590e4e7ee0ffb46abe6aeb", "url": "js/parser.js" }, { "revision": "d0d24315607c530c7a904e38e47c9e92", "url": "js/places.js" }, { "revision": "9d42f4cb495358a523d152c964a0913c", "url": "js/quickreference.js" }, { "revision": "383697f3136f80bd4d7c2ed01b0f97ba", "url": "js/render-dice.js" }, { "revision": "be0b8f827a5eb28318f2e7aa937a42c0", "url": "js/render-map.js" }, { "revision": "8b7a3b4b001c877521372bfeef6765d7", "url": "js/render.js" }, { "revision": "ef87480c73c47ff769880f3877541b16", "url": "js/renderdemo.js" }, { "revision": "a7dfeb9f9595e1817eaa847d772ef393", "url": "js/rituals.js" }, { "revision": "66d276227941a8c42bcaafe1e314f05a", "url": "js/rolang.js" }, { "revision": "e30ec26d38a51f5ca0ed1b6f1c271071", "url": "js/scalecreature.js" }, { "revision": "3d6c787f86f3431d94ae7dd64e42de4b", "url": "js/search.js" }, { "revision": "97b648b1dbc2aa0b4018104edacef065", "url": "js/seo-loader.js" }, { "revision": "2d45fa0227736bfef05224d51984f6e7", "url": "js/spells.js" }, { "revision": "fa8e47421d72536dc1bbd19863449707", "url": "js/styleswitch.js" }, { "revision": "3610377771947b8d4fcc07283e5edc27", "url": "js/tablepage.js" }, { "revision": "753d045ecd202a12aa48fa431970e4a2", "url": "js/tables.js" }, { "revision": "40dd7c73b5f0c77a1b074ccce24c0b82", "url": "js/textconverter.js" }, { "revision": "2740e833d14fe802f863ba839da3e15e", "url": "js/tokenizer.js" }, { "revision": "980ce6eeb1675a2d226402f733be0cd8", "url": "js/traits.js" }, { "revision": "c9a62d6fe47f93d83dfe8538eef2d5f2", "url": "js/utils-changelog.js" }, { "revision": "b484be895323e280877cfb9cb0cfad06", "url": "js/utils-licenses.js" }, { "revision": "6d31f474ce4e60512bc2da1134e5560e", "url": "js/utils-list.js" }, { "revision": "082622ccfee4c81d090597b1395bb06c", "url": "js/utils-p2p.js" }, { "revision": "de09565cf06e3f815ed539eb7854b8f9", "url": "js/utils-proporder.js" }, { "revision": "10cc07f685cb05670233137f91f09d1e", "url": "js/utils-ui.js" }, { "revision": "63b828d6ba5777b31e81754be50323e3", "url": "js/utils.js" }, { "revision": "e5e158ce721d3e1dd975430973109a75", "url": "js/variantrules.js" }, { "revision": "ac7bfb3047becd0c148e339427233e35", "url": "js/vehicles.js" }, { "revision": "b36e7c94c751656285d8e977cc152b10", "url": "lib/ace.js" }, { "revision": "c8f51857c2b593d5ca3e61d3e2614202", "url": "lib/bootstrap-select.min.js" }, { "revision": "76cba0afeefaac9a2c2b5fae0501563f", "url": "lib/bootstrap.min.js" }, { "revision": "7ba761cdbfa62922c3b750ac78f866eb", "url": "lib/elasticlunr.js" }, { "revision": "28dd3c8bf663c55bc9aa3d8f92945871", "url": "lib/ext-searchbox.js" }, { "revision": "a8e8282fcf516551d39204e076624b55", "url": "lib/jquery-ui-slider-pip.js" }, { "revision": "e858f6a2725af4140c1c424cf024a808", "url": "lib/jquery-ui.js" }, { "revision": "a6b6350ee94a3ea74595c065cbf58af0", "url": "lib/jquery.js" }, { "revision": "04680cb5d0adf90731746e92ef05a87b", "url": "lib/jquery.panzoom.js" }, { "revision": "862e9e065bcfe3944871cbf66229b3fd", "url": "lib/localforage.js" }, { "revision": "522bc8c23346ddf54992d531acabcb3e", "url": "lib/lzma.js" }, { "revision": "2378a4fa58c2e66792c81641346a4a40", "url": "lib/peerjs.js" }, { "revision": "fbd68ec03eeefb8972de94a196847463", "url": "css/bootstrap-select.min.css" }, { "revision": "b366268ad29ab8ac0b4fa80e4443855f", "url": "css/bootstrap.css" }, { "revision": "de97b7db2b1195829599af9cfeb914c6", "url": "css/classes.css" }, { "revision": "354613438d26956a4530d57badd1711d", "url": "css/fontawesome.css" }, { "revision": "01ef22f83fa30e6bed564ab061a79f54", "url": "css/jquery-ui-slider-pips.css" }, { "revision": "4ef12b83b1ef3ff34d711c6a78421f55", "url": "css/jquery-ui.css" }, { "revision": "a6fc67670251132e3eb14a807aa466de", "url": "css/list-page--grouped.css" }, { "revision": "939fd45be687b473e266348825fb5697", "url": "css/search.css" }, { "revision": "8c6f38ceea9b0b363037a98865515225", "url": "css/style.css" }, { "revision": "f8c7f17547945d8f710506491ef99275", "url": "homebrew/index.json" }, { "revision": "56d1681864b44129259bed3a18c63b49", "url": "data/abilities.json" }, { "revision": "10fc8ecdbcbbac89bfc1a324397529e2", "url": "data/actions.json" }, { "revision": "6d9a1634cfdfcaab46fa23df8dd32295", "url": "data/adventures.json" }, { "revision": "ca70206d2df4787ec3e2145d380a0584", "url": "data/afflictions.json" }, { "revision": "20ae3e2bf8313d65f51e007ed980bb97", "url": "data/archetypes.json" }, { "revision": "a5d127e2658052e99b38e61cb9db857a", "url": "data/books.json" }, { "revision": "e6bd132f60efe3e71d55254b6438c7e0", "url": "data/changelog.json" }, { "revision": "716ec7c14fb7186b2ceb4ae35232bb62", "url": "data/companionsfamiliars.json" }, { "revision": "d6f2779bd4842c1951994d4c73624d0b", "url": "data/conditions.json" }, { "revision": "62b7fa6ccffb87db406b80eeaad18db3", "url": "data/deities.json" }, { "revision": "d465ddfac916a507fa4da1fbd248dcdf", "url": "data/domains.json" }, { "revision": "914b6395738025547104132bb0a5cf33", "url": "data/fluff-deities.json" }, { "revision": "bf70ec7a1eea74eaa370a596306b60bf", "url": "data/fluff-items.json" }, { "revision": "309b2f5c47389945fbedb5fba0d4241b", "url": "data/fluff-organizations.json" }, { "revision": "93d8f7fda4f90c3488625e3bc5b2a1be", "url": "data/generic.json" }, { "revision": "317c438dd61985f25c83ed48fa7a5955", "url": "data/groups.json" }, { "revision": "c651008d44ac4b49b8826b30b39507a1", "url": "data/hazards.json" }, { "revision": "85a9c6c560e8afcc0ec11016d39c9f5c", "url": "data/languages.json" }, { "revision": "60cbd4da822064baa65ee9c9724bcf50", "url": "data/licenses.json" }, { "revision": "5d98fa27005a70b26c77a6bca146a1ff", "url": "data/optionalfeatures.json" }, { "revision": "27881ff3355c10aa0b159cfbe2b8f908", "url": "data/organizations.json" }, { "revision": "678ea78039df5b0a4364890b8b688f8e", "url": "data/places.json" }, { "revision": "cfd9b57144f57e797814937012893f99", "url": "data/quickrules.json" }, { "revision": "51eb8da797e31575fdac2c17f00d6310", "url": "data/renderdemo.json" }, { "revision": "079cef2a51e7220261097306487c23fa", "url": "data/rituals.json" }, { "revision": "8c40cc0410ef298d287aadc13a9eb096", "url": "data/skills.json" }, { "revision": "c17d1ab851263da9c00acfd2ba19c5e7", "url": "data/tables.json" }, { "revision": "5ee41f3d8b658f11ad62e19d59562ba9", "url": "data/traits.json" }, { "revision": "3c7d3438c8108400b916b7ea0ddf3e96", "url": "data/variantrules.json" }, { "revision": "2e0eb20c67f887ea48f1566a2b55dc48", "url": "data/vehicles.json" }, { "revision": "6cbb00f88c1e8bf54f7c7ae158e61641", "url": "data/ancestries/ancestry-anadi.json" }, { "revision": "75c253ea8c28a8c7075e5e1c63f0bace", "url": "data/ancestries/ancestry-android.json" }, { "revision": "55a6800aae487c3174b293a928f2b8e9", "url": "data/ancestries/ancestry-automaton.json" }, { "revision": "606f8cc3539e4b7731e4a3f985b35b29", "url": "data/ancestries/ancestry-azarketi.json" }, { "revision": "e6aa55cf858acf62abe40c31cc2448b7", "url": "data/ancestries/ancestry-catfolk.json" }, { "revision": "c732f30a79b40e65a2b9e4db202d0fd8", "url": "data/ancestries/ancestry-conrasu.json" }, { "revision": "7109eafe41ecc48aa9c5d573ad17f8a0", "url": "data/ancestries/ancestry-dwarf.json" }, { "revision": "aa4ee24c3f8a3b7a4f2f303b4f12a74c", "url": "data/ancestries/ancestry-elf.json" }, { "revision": "f961aae4efc4ccaa185a16e18959ad25", "url": "data/ancestries/ancestry-fetchling.json" }, { "revision": "5122026ca318b68685c3b002a2ccfcb1", "url": "data/ancestries/ancestry-fleshwarp.json" }, { "revision": "dbf185b36d87b343e5b1a19c6e9b993e", "url": "data/ancestries/ancestry-gnoll.json" }, { "revision": "a3ab0bf16491c1dfac92ccad06cd2f64", "url": "data/ancestries/ancestry-gnome.json" }, { "revision": "33c5744fd8feae2f27d26b4e7d9a4bb3", "url": "data/ancestries/ancestry-goblin.json" }, { "revision": "15e0e8a145c128b71d7af88966fbec2e", "url": "data/ancestries/ancestry-goloma.json" }, { "revision": "594e7208f9a6d64592b738d7acc61466", "url": "data/ancestries/ancestry-grippli.json" }, { "revision": "22af12fc3ecd5d6c6acb87a7683e8942", "url": "data/ancestries/ancestry-halfling.json" }, { "revision": "b81dd8f4faedfc10baa952852df6c224", "url": "data/ancestries/ancestry-hobgoblin.json" }, { "revision": "2d8614180b48eb86e5312ec8dd9fb5e9", "url": "data/ancestries/ancestry-human.json" }, { "revision": "a23ddb590b228ad691f225c750a912a3", "url": "data/ancestries/ancestry-kitsune.json" }, { "revision": "b5e154121c366e7a5a9d31f6456a408a", "url": "data/ancestries/ancestry-kobold.json" }, { "revision": "ecc80ded71b994ed989bc1412ee34e72", "url": "data/ancestries/ancestry-leshy.json" }, { "revision": "bc7ee2c9a47a28d004f478b041ee5580", "url": "data/ancestries/ancestry-lizardfolk.json" }, { "revision": "3fce3a4ebb204b987da31050ce1f52af", "url": "data/ancestries/ancestry-orc.json" }, { "revision": "58588ebcf6e1ab6c2ed72952799e2480", "url": "data/ancestries/ancestry-poppet.json" }, { "revision": "30c88065602664c1db0cdbaef24984cf", "url": "data/ancestries/ancestry-ratfolk.json" }, { "revision": "209d7e523a93d86f619983c74e6f8193", "url": "data/ancestries/ancestry-shisk.json" }, { "revision": "9589fb657cfb7a2a25d2f01387330760", "url": "data/ancestries/ancestry-shoony.json" }, { "revision": "ce19577be076357992b0c3615b92a77c", "url": "data/ancestries/ancestry-sprite.json" }, { "revision": "9418b3dc6d0004d4c80674d8fbea3c2a", "url": "data/ancestries/ancestry-strix.json" }, { "revision": "836bf660271836f93fb1f47c420ae84e", "url": "data/ancestries/ancestry-tengu.json" }, { "revision": "badaac0317b2d9650c352e756166734a", "url": "data/ancestries/index.json" }, { "revision": "36a96d49c651a28caded19b8820d4363", "url": "data/ancestries/versatile-heritages.json" }, { "revision": "48a5f08aceaf321c5fb2fa7e0f0a0ae6", "url": "data/backgrounds/backgrounds-aoa0.json" }, { "revision": "18a6fc08bf3cb566a46c6535e9397e14", "url": "data/backgrounds/backgrounds-aoa4.json" }, { "revision": "e078edee16911bf4a3ccc83a7612d58a", "url": "data/backgrounds/backgrounds-aoa6.json" }, { "revision": "e7ae09fb69ba497618aff151b7f8e491", "url": "data/backgrounds/backgrounds-aoe0.json" }, { "revision": "760e7f38b5727a3c4653ed20f5cd6d66", "url": "data/backgrounds/backgrounds-aoe4.json" }, { "revision": "a6de8ebeba03cfd4c208bc9ea276b7da", "url": "data/backgrounds/backgrounds-apg.json" }, { "revision": "ed95dfaff9809b458f1291453823f43c", "url": "data/backgrounds/backgrounds-av0.json" }, { "revision": "31b8e7593bac4fc20ac9f2ddb44b972f", "url": "data/backgrounds/backgrounds-crb.json" }, { "revision": "55b2b3708dbb199a5024aadd48e95ac4", "url": "data/backgrounds/backgrounds-ec0.json" }, { "revision": "8b1a3269a92a9ab29c0b2f5caabce7dd", "url": "data/backgrounds/backgrounds-ec3.json" }, { "revision": "fd1aadd0f3706f228562645c33efa9c2", "url": "data/backgrounds/backgrounds-frp0.json" }, { "revision": "fb547891fe70a7bcc90d52caaca7d625", "url": "data/backgrounds/backgrounds-g&g.json" }, { "revision": "1b6367a8644861eef6a518f8db93aca9", "url": "data/backgrounds/backgrounds-lopsg.json" }, { "revision": "31d2ad0e100c0ec5553da4929de67c6f", "url": "data/backgrounds/backgrounds-lowg.json" }, { "revision": "806220dea90d2b4e023e1e4964f335df", "url": "data/backgrounds/backgrounds-som.json" }, { "revision": "de810bc4c27dd0a67496b2a7fddc0d1f", "url": "data/backgrounds/backgrounds-sot0.json" }, { "revision": "5c92d8542c71097c784cab0b30d3d7de", "url": "data/backgrounds/fluff-backgrounds.json" }, { "revision": "f546e3e2de43bbd2d4bd3783830bb6a8", "url": "data/backgrounds/index.json" }, { "revision": "7a02ab1c3dbd988857172998860d6d7e", "url": "data/bestiary/creatures-aoa1.json" }, { "revision": "2f65754a2cbe1296754fc71529fff917", "url": "data/bestiary/creatures-aoa2.json" }, { "revision": "f0666bcc6cab2325abb9d9258e5660b4", "url": "data/bestiary/creatures-aoa3.json" }, { "revision": "6f2b7e949fecc2cdc8cab2aed94f8947", "url": "data/bestiary/creatures-aoa4.json" }, { "revision": "723e88f22bb24abb6c52113a072be427", "url": "data/bestiary/creatures-aoa5.json" }, { "revision": "da1137eff5110fe74b0f4ad95a2d2f4d", "url": "data/bestiary/creatures-aoa6.json" }, { "revision": "34d321443edb61e16ee25deb58bf1131", "url": "data/bestiary/creatures-aoe1.json" }, { "revision": "a56dd148297d39cd7fc2a69950864bb2", "url": "data/bestiary/creatures-aoe2.json" }, { "revision": "fb24af4710b50fffd0f6d201f9c8c1d7", "url": "data/bestiary/creatures-aoe3.json" }, { "revision": "84b24c2782114063370f77110c261d84", "url": "data/bestiary/creatures-aoe4.json" }, { "revision": "dccc9a2672b9a026347c4ce13ed6a429", "url": "data/bestiary/creatures-aoe5.json" }, { "revision": "6cce38dff44e5b44fa81d1db59a640bc", "url": "data/bestiary/creatures-aoe6.json" }, { "revision": "18b9e23203cb15f2eccc04647923bb28", "url": "data/bestiary/creatures-av1.json" }, { "revision": "1458b8e9ac110216b5ca031682374a9e", "url": "data/bestiary/creatures-av2.json" }, { "revision": "ee2915906065e0744c86ffc70cd8747e", "url": "data/bestiary/creatures-av3.json" }, { "revision": "ed9c9823df2fcb6e98b55467b3842d3a", "url": "data/bestiary/creatures-b1.json" }, { "revision": "6f973d87738b8af8800011422b70fb15", "url": "data/bestiary/creatures-b2.json" }, { "revision": "ffbedeab1103e134edd51add16677287", "url": "data/bestiary/creatures-b3.json" }, { "revision": "8a75db30b88f5d42eb3b4a7bc4c2ce9e", "url": "data/bestiary/creatures-crb.json" }, { "revision": "ac6f8e32fd4eff76c8fa19c89e33587d", "url": "data/bestiary/creatures-ec1.json" }, { "revision": "2a57b35bef011bddfb559397e4d5a5e1", "url": "data/bestiary/creatures-ec2.json" }, { "revision": "5b00641b3c35acc70fdf80714df861a9", "url": "data/bestiary/creatures-ec3.json" }, { "revision": "cf91aca864d4689f0e3780744dbc3b40", "url": "data/bestiary/creatures-ec4.json" }, { "revision": "7f7eb31fd7a8e8e5cb97895745ed28fa", "url": "data/bestiary/creatures-ec5.json" }, { "revision": "7597c4c6571e64106e2608f368c83e2f", "url": "data/bestiary/creatures-ec6.json" }, { "revision": "b4c8cfa2c6d5279f7ea4082d50a3c9a8", "url": "data/bestiary/creatures-fop.json" }, { "revision": "a19b427f3a20e96b1d003e5763575333", "url": "data/bestiary/creatures-frp1.json" }, { "revision": "cff33e7664061df1ab3db5efdf63a21a", "url": "data/bestiary/creatures-frp2.json" }, { "revision": "d860b02f789ac0fef6e34ecc75e9c132", "url": "data/bestiary/creatures-frp3.json" }, { "revision": "51f9ab41d6f5b926fb10be32d35a6a32", "url": "data/bestiary/creatures-gmg.json" }, { "revision": "d012dea28f8e62dfe8c5aa975e1f0e49", "url": "data/bestiary/creatures-lome.json" }, { "revision": "0452f0f5cf3ace6f54473dee53f31df6", "url": "data/bestiary/creatures-ltiba.json" }, { "revision": "14f2b06a928b66d65be7b0ec7da9cab3", "url": "data/bestiary/creatures-sli.json" }, { "revision": "35177d7ccdd4d689a16969ad187880d1", "url": "data/bestiary/creatures-sot1.json" }, { "revision": "436f243e87db4865d95cd1fc892d2e7f", "url": "data/bestiary/creatures-sot2.json" }, { "revision": "55a1e4c2f4818baeb9a48ddedca5c756", "url": "data/bestiary/creatures-tio.json" }, { "revision": "caaf16707e3febba9ac5420f425f79cd", "url": "data/bestiary/fluff-creatures-av3.json" }, { "revision": "5cda1d917f71145763ef9f3533929b5c", "url": "data/bestiary/fluff-creatures-bst.json" }, { "revision": "9956f250f0e3e20efbf969f6cf057dee", "url": "data/bestiary/fluff-creatures-bst2.json" }, { "revision": "4e51e07b489de9429f6595b26c72c197", "url": "data/bestiary/fluff-creatures-bst3.json" }, { "revision": "c152becb0a3a50acc61ad3c62285a4e8", "url": "data/bestiary/fluff-creatures-gmg.json" }, { "revision": "f0b6aa97a48a31b2bd5950ff175a6f69", "url": "data/bestiary/fluff-creatures-lome.json" }, { "revision": "7bf32f0c2d3988d2dec16d3adb6a98eb", "url": "data/bestiary/fluff-creatures-sot1.json" }, { "revision": "0d16a3a6fda77538eb4300210663b0d2", "url": "data/bestiary/fluff-index.json" }, { "revision": "6f949aecbae6228b5ce855183736fb4e", "url": "data/bestiary/index.json" }, { "revision": "c7f299a8079ac81906f3a7956317ae6e", "url": "data/book/book-crb.json" }, { "revision": "4509b9d3735db93dacca5a4b81a7e579", "url": "data/book/book-gmg.json" }, { "revision": "71d482f2e999e734734a6c5ba18a5ad3", "url": "data/book/book-lowg.json" }, { "revision": "3d1a97431a05bf51a9d1b26273a1ca39", "url": "data/book/book-som.json" }, { "revision": "afcc7ee26993b519eb7bc1c87b98fe32", "url": "data/class/class-alchemist.json" }, { "revision": "6ac8359cdd1b9254c4813b0d10f6f0de", "url": "data/class/class-barbarian.json" }, { "revision": "c09c04e5c67f9776891b896688ab2899", "url": "data/class/class-bard.json" }, { "revision": "1a6b057e3f3fd34e83a4d322cedad591", "url": "data/class/class-champion.json" }, { "revision": "d211c0233ce44d727f7aa4dc028409e0", "url": "data/class/class-cleric.json" }, { "revision": "808ede376b0446671ff2085940771068", "url": "data/class/class-druid.json" }, { "revision": "e8e6181d11ffb9a16b264f6351f08f13", "url": "data/class/class-fighter.json" }, { "revision": "c179d68e41d1aa2004aa7b2a2f460a4e", "url": "data/class/class-gunslinger.json" }, { "revision": "7f011cf0941eeae16a818024cef1050b", "url": "data/class/class-inventor.json" }, { "revision": "bb32bf415e250953797da10fa74ec804", "url": "data/class/class-investigator.json" }, { "revision": "068cdf9bd235418bb89c461d4371175d", "url": "data/class/class-magus.json" }, { "revision": "4f9083f694872857da95d961c89ea460", "url": "data/class/class-monk.json" }, { "revision": "e80fba83b1daf23c6a6c6950c37e49e9", "url": "data/class/class-oracle.json" }, { "revision": "c4783027db6d8f20d8e21d3a65ddde2a", "url": "data/class/class-ranger.json" }, { "revision": "09c62ea26a6b7f5e4b02cef18d689631", "url": "data/class/class-rogue.json" }, { "revision": "d3d8c246444c8edfbd9a833aec2487a7", "url": "data/class/class-sorcerer.json" }, { "revision": "9b93a2778a02d6619c5ff65dd0993c62", "url": "data/class/class-summoner.json" }, { "revision": "5412eabc7ef4d0ac03efae79ace1881c", "url": "data/class/class-swashbuckler.json" }, { "revision": "c20a713e4cfdf262193c4efcf6f007de", "url": "data/class/class-witch.json" }, { "revision": "170aa168ae264e8ea58afbf2a92f6b13", "url": "data/class/class-wizard.json" }, { "revision": "4918792f82c96f9774c2aae1eb955b17", "url": "data/class/index.json" }, { "revision": "564b1e5e95b98f88beb4780726c6befc", "url": "data/feats/feats-aoa3.json" }, { "revision": "ab80eb4fecffa4e207dc960d924c97fa", "url": "data/feats/feats-aoa4.json" }, { "revision": "46f9c12cd5f088a0b58e5316ce39c7b0", "url": "data/feats/feats-aoa5.json" }, { "revision": "c00eec5f10785095d63c1019c5ac7a9c", "url": "data/feats/feats-aoa6.json" }, { "revision": "f915c88fcdc6c7090f2ef67b6b1a5030", "url": "data/feats/feats-aoe1.json" }, { "revision": "8c4c47f150adc7bd2ac7cc264d1738c5", "url": "data/feats/feats-aoe2.json" }, { "revision": "1b6c5ab64c9997e617e9224682a8d82e", "url": "data/feats/feats-aoe3.json" }, { "revision": "e9d3d73385dd29f8f40615d2ad54644d", "url": "data/feats/feats-apg.json" }, { "revision": "2d22f151d21d8b27790707d6247b56d2", "url": "data/feats/feats-av1.json" }, { "revision": "e4fb1e1fc8d52cbbee3ad2073ea6423b", "url": "data/feats/feats-av2.json" }, { "revision": "d5588bc945dd7308def53e556b6912eb", "url": "data/feats/feats-av3.json" }, { "revision": "222ed9ad81877f9439507f0fa7293f49", "url": "data/feats/feats-crb.json" }, { "revision": "f7195ecc4e9a5be7554989a73e9d0fc5", "url": "data/feats/feats-ec1.json" }, { "revision": "0a024a20a78b5dbda524c17a0916cff4", "url": "data/feats/feats-ec2.json" }, { "revision": "330dd2395fcd3a3e1d12eae48895eb8c", "url": "data/feats/feats-ec3.json" }, { "revision": "7f31c727001efdf2ad8cdabe932c008f", "url": "data/feats/feats-ec6.json" }, { "revision": "7cb4e24e5153cead893bc588640e7075", "url": "data/feats/feats-fop.json" }, { "revision": "b125f2f3aee4058f88b1723cd7e92d1e", "url": "data/feats/feats-frp1.json" }, { "revision": "f92d1ba95a4688a124f0ab2d9d7e1d72", "url": "data/feats/feats-frp2.json" }, { "revision": "62d76771f8a07c2f35dfe8d177355a8b", "url": "data/feats/feats-frp3.json" }, { "revision": "3f5223626620b0c587849212946c8db5", "url": "data/feats/feats-g&g.json" }, { "revision": "90aa7169925660c88133037ca2862b16", "url": "data/feats/feats-gmg.json" }, { "revision": "12d7a4452d76f0760c73c7a51932a5db", "url": "data/feats/feats-loag.json" }, { "revision": "4d84e856fc4f49eb69294470484823bf", "url": "data/feats/feats-locg.json" }, { "revision": "27cb93f5b8a02dbe0efaac3bfda74bff", "url": "data/feats/feats-logm.json" }, { "revision": "8f1c4e73c86335296e1e0f179208b179", "url": "data/feats/feats-lol.json" }, { "revision": "945b6f9b5ebdd91fedff6e377126bf80", "url": "data/feats/feats-lome.json" }, { "revision": "9f915de6e93f9f5f798c88ade23e9599", "url": "data/feats/feats-lopsg.json" }, { "revision": "85fe1b667c8e2efcd360118b673644a6", "url": "data/feats/feats-lotgb.json" }, { "revision": "bc55a43bfe3fedd996f826294f427ba4", "url": "data/feats/feats-lowg.json" }, { "revision": "8120b6dfff1a035457d00e443b026a5d", "url": "data/feats/feats-ltiba.json" }, { "revision": "76395bbf6fad7760da8e9a9771a94b9d", "url": "data/feats/feats-sli.json" }, { "revision": "1428f0c5d650664366d5c2cabb5436fb", "url": "data/feats/feats-som.json" }, { "revision": "197c90beb23ac311ac2c58b343492d0a", "url": "data/feats/feats-sot2.json" }, { "revision": "46bc1cbabc1cca1d6500e08f2c41dd49", "url": "data/feats/feats-sot3.json" }, { "revision": "93e7f0ec5db866a4e3997ae1a56b4bec", "url": "data/feats/index.json" }, { "revision": "07b4a3fb8b7bf167a3500545ac1abd8d", "url": "data/generated/bookref-gmscreen-index.json" }, { "revision": "11b8f0eaef6489f894d1c3499071ae66", "url": "data/generated/bookref-gmscreen.json" }, { "revision": "7de54024d2dffdc0fde676cf5b491abb", "url": "data/generated/bookref-quick.json" }, { "revision": "688a74016f76e2edf07802a3f0ba58f4", "url": "data/generated/gendata-nav-adventure-book-index.json" }, { "revision": "0c7275b2b5ed212645a7376a670d55a2", "url": "data/items/baseitems.json" }, { "revision": "ca81ca4408f056ea5249ed5b7895ff44", "url": "data/items/fluff-index.json" }, { "revision": "1fc0fcdbb0518e8fd10d16c8c67efd6f", "url": "data/items/fluff-items-crb.json" }, { "revision": "52b95432685e32a7915fc37a37c4bf78", "url": "data/items/index.json" }, { "revision": "57763bc7a10903fb428bb3949edfaca0", "url": "data/items/items-aoa1.json" }, { "revision": "05bf8b6f43d4e31f0ada817be2d6a0cc", "url": "data/items/items-aoa2.json" }, { "revision": "1cc5fb1f62519f8d8db09dea691b2ec0", "url": "data/items/items-aoa3.json" }, { "revision": "cdd38f85a901047fcd9cc23d03f4f34c", "url": "data/items/items-aoa4.json" }, { "revision": "6d5c3365305a173f69c7db09f041172a", "url": "data/items/items-aoa5.json" }, { "revision": "d27d380e11447975d2543436b8ccaa14", "url": "data/items/items-aoa6.json" }, { "revision": "14d12700308b3f144b68c47b98448e5e", "url": "data/items/items-aoe1.json" }, { "revision": "2a889adb54ff184e69c7275b421d410e", "url": "data/items/items-aoe2.json" }, { "revision": "ea4e78794024814a38cca52e0689204f", "url": "data/items/items-aoe3.json" }, { "revision": "ea1668a62ce655dd2590c27587fb0c75", "url": "data/items/items-aoe4.json" }, { "revision": "03bbf04acc19d18f42382b497dfe1890", "url": "data/items/items-aoe5.json" }, { "revision": "412a1be30bb598fb237e1aa52ea03b64", "url": "data/items/items-aoe6.json" }, { "revision": "cf995d8f75a4456d3a9ebe43108ed637", "url": "data/items/items-apg.json" }, { "revision": "654a810f955e18896d5dd4601a8a9540", "url": "data/items/items-av1.json" }, { "revision": "0b61bf4d8b0817ef924449f6813567af", "url": "data/items/items-av2.json" }, { "revision": "bbbe7259fe67a403f73eed44715a0e9f", "url": "data/items/items-av3.json" }, { "revision": "b4c67953df9c37934bab6a2953c39404", "url": "data/items/items-crb.json" }, { "revision": "7d9c86eceb8050ead124fb9745c8d627", "url": "data/items/items-ec1.json" }, { "revision": "1181b982bbb95bc52ac31f65a06cf38d", "url": "data/items/items-ec2.json" }, { "revision": "521ac165c8df3174b1f7e7b40efc9432", "url": "data/items/items-ec3.json" }, { "revision": "086cb09f7ea6a7154c8f0dcc3486b9af", "url": "data/items/items-ec4.json" }, { "revision": "02d69315011f660ef6bc36df826eaf0f", "url": "data/items/items-ec5.json" }, { "revision": "6e0f7b404f772bf510d07628081585f2", "url": "data/items/items-ec6.json" }, { "revision": "8fcdec71f529a10ecb108d6bdc6bdc75", "url": "data/items/items-fop.json" }, { "revision": "30ddd5d4d13dd99779137aa718b3e2ed", "url": "data/items/items-frp1.json" }, { "revision": "e4f341ac6eafbe88c5629bac89017287", "url": "data/items/items-frp2.json" }, { "revision": "0b4acc987901b5fcf6c6a832b29a6828", "url": "data/items/items-g&g.json" }, { "revision": "1a565f3c3665edab5d678052947f7e2f", "url": "data/items/items-gmg.json" }, { "revision": "39b40da0da37b66d85b1649ca27ef231", "url": "data/items/items-loag.json" }, { "revision": "681febf3b660f21c2b030351bd829126", "url": "data/items/items-locg.json" }, { "revision": "09b930cb5712a3e07b8d6d9611f3bb1a", "url": "data/items/items-logm.json" }, { "revision": "fe93de984edc8e67136d34cf542d741b", "url": "data/items/items-lol.json" }, { "revision": "20a73cf06ea2340e652f72ecd739bbe6", "url": "data/items/items-lome.json" }, { "revision": "2cb87a1d87ad3f94512ee14787be18fb", "url": "data/items/items-lopsg.json" }, { "revision": "40eb51a59357640f918fc9fc34c27059", "url": "data/items/items-lotgb.json" }, { "revision": "5fc458aa024fff22e51b79635dc419f3", "url": "data/items/items-lowg.json" }, { "revision": "cf35fb704e6e806f6355deed48fe6b1d", "url": "data/items/items-ltiba.json" }, { "revision": "f4ab1784a0f20554a5d47ed978bf6430", "url": "data/items/items-sli.json" }, { "revision": "c3c38b0efff6caaef9d6da6af5210e9d", "url": "data/items/items-som.json" }, { "revision": "4376aa1db6345f1d5a28b2e59d44f7b3", "url": "data/items/items-sot1.json" }, { "revision": "7efede606cf3f03cc5d3236d79dc81a8", "url": "data/items/items-sot2.json" }, { "revision": "b2aba46af0fcc3d399d6f7214de7aee9", "url": "data/items/items-sot3.json" }, { "revision": "94431013053bbed5cedcc37a7f858e94", "url": "data/items/items-tio.json" }, { "revision": "8a80554c91d9fca8acb82f023de02f11", "url": "data/spells/fluff-index.json" }, { "revision": "40c8e3b0a77c7dc13bc9e8ae2fac4b45", "url": "data/spells/index.json" }, { "revision": "7bede3adc55d0bf7800575d0bae7d385", "url": "data/spells/spells-aoa3.json" }, { "revision": "70c7e3cc8eeaf8800d50e347e0150596", "url": "data/spells/spells-aoa4.json" }, { "revision": "ce0062cd7c3bb2d5e6760b48b95c8011", "url": "data/spells/spells-aoa6.json" }, { "revision": "3ba8e77e7abbfcd7caf4df300248c140", "url": "data/spells/spells-aoe2.json" }, { "revision": "26db22cc5383d0ad8f945d76fe76ee8c", "url": "data/spells/spells-aoe4.json" }, { "revision": "1b0f8d4578f939e5b7952212a69d49a4", "url": "data/spells/spells-aoe5.json" }, { "revision": "dc87d7a7c1a1524e0edf6c79ab1f314b", "url": "data/spells/spells-aoe6.json" }, { "revision": "f084187ffa8223f0bedbd678adb67330", "url": "data/spells/spells-apg.json" }, { "revision": "0b3fc32dbe5715e7d597e905a8ba3237", "url": "data/spells/spells-av1.json" }, { "revision": "511ab491bd01d1fc13438054a051bd44", "url": "data/spells/spells-av2.json" }, { "revision": "3efa28cf371374af7fa4c9f53ac82da7", "url": "data/spells/spells-av3.json" }, { "revision": "ad1d87d884ad2bb413e9b2d3402c0b36", "url": "data/spells/spells-crb.json" }, { "revision": "77a5573db90ff44e49d0b3582d04a34f", "url": "data/spells/spells-ec1.json" }, { "revision": "e68aca95a6ba2b183a5c8932f383a2b9", "url": "data/spells/spells-ec2.json" }, { "revision": "4363b944273c6b61f2c71a9896910de7", "url": "data/spells/spells-ec3.json" }, { "revision": "0a033714de3e3946bab0ccf207612757", "url": "data/spells/spells-ec4.json" }, { "revision": "bd28ffe624cf2952f6d0087b959c2ae9", "url": "data/spells/spells-ec5.json" }, { "revision": "2054324fdf57d1e24dacdc961eb0a222", "url": "data/spells/spells-ec6.json" }, { "revision": "5f24d32570c27a7675546e95abbcc82a", "url": "data/spells/spells-frp1.json" }, { "revision": "785fa24e272f133c25704d13796aa578", "url": "data/spells/spells-frp3.json" }, { "revision": "9c10f0330df8fa74e706e60ecc5179cc", "url": "data/spells/spells-locg.json" }, { "revision": "4970b34824027f950ae46c675efdddbb", "url": "data/spells/spells-logm.json" }, { "revision": "42eee42bcbb8f03db24e9050601ff993", "url": "data/spells/spells-lol.json" }, { "revision": "086c1aa5a4f00139224834f7b796c528", "url": "data/spells/spells-lopsg.json" }, { "revision": "9abeb5242112a6257766c5f6bb7554a2", "url": "data/spells/spells-lowg.json" }, { "revision": "9a46a8eadb78bb72ec1204da15d383d9", "url": "data/spells/spells-som.json" }, { "revision": "8ac48f4118ae012d2727e6967b07ab6b", "url": "data/spells/spells-sot1.json" }, { "revision": "d7114a5327af86e19c1462c5739c20b7", "url": "data/spells/spells-sot3.json" }, { "revision": "49739b9138274db740ffa6b9ecd5f20b", "url": "abilities.html" }, { "revision": "0804377f811a93a112345ae60ce867d9", "url": "actions.html" }, { "revision": "8f6d8f4969f45f911cd099f30b91a921", "url": "adventure.html" }, { "revision": "8533e76fc5565512f8a9252675b015a6", "url": "adventures.html" }, { "revision": "e7059fa7dee57ca2d860c1969ede14d8", "url": "afflictions.html" }, { "revision": "5c3a6ecc21d67679e0d71ecc3064dbc6", "url": "ancestries.html" }, { "revision": "532047f1e1636a366ec092470b97826e", "url": "archetypes.html" }, { "revision": "4ca62f609d4f8437ec84d1e95494fd16", "url": "backgrounds.html" }, { "revision": "75cf05722c677d799acdfce6d818800b", "url": "bestiary.html" }, { "revision": "b9a5c335461e785538a3147999676413", "url": "blacklist.html" }, { "revision": "e689a1767f20bdc6cd8e37ce969fdeee", "url": "book.html" }, { "revision": "d15ce4d611b2479a17648b58cdcd240d", "url": "books.html" }, { "revision": "1a8aef1dbe8f02993e9afe57fc82cd0a", "url": "changelog.html" }, { "revision": "ee463c3e23ca117fc3ea62c19c801fdc", "url": "classes.html" }, { "revision": "840cf1e728b2c8a5a10703a673f73767", "url": "companionsfamiliars.html" }, { "revision": "8f7d745cb0b98e3616b1467d39856467", "url": "conditions.html" }, { "revision": "e0a0f6c6e9233ef7d7b7fd2c86cf864e", "url": "deities.html" }, { "revision": "7998a112e812a9601bcdf16e5becccc6", "url": "donate.html" }, { "revision": "b2e7a83e15ae253597b906a839c58b5b", "url": "feats.html" }, { "revision": "62d54be9eac594aa53b71251098936e9", "url": "gmscreen.html" }, { "revision": "e796d9704ab86d57e1b4288c0f8965e4", "url": "hazards.html" }, { "revision": "c494789fc648c4d3b5ee22101e997260", "url": "index.html" }, { "revision": "afd5173f9fd15d4d5e3dcb1231fe8d6b", "url": "inittrackerplayerview.html" }, { "revision": "cee41147a66ecd367673af28778774b4", "url": "items.html" }, { "revision": "0500a6a52511a523046945466acd6028", "url": "langdemo.html" }, { "revision": "9533e0882099a3f98f689283192a38ae", "url": "languages.html" }, { "revision": "7863d5036cbc661ae61d52f85e643a07", "url": "licenses.html" }, { "revision": "84af0e2f385ce9500df638a6085749a0", "url": "managebrew.html" }, { "revision": "bd5b161608935ee7da3d48fe58fea079", "url": "optionalfeatures.html" }, { "revision": "ca6e80fd1e54e70b60d33d64e818c23b", "url": "organizations.html" }, { "revision": "e69b75cdb4004395d9285c3565a2fc7e", "url": "Pf2eTools.html" }, { "revision": "47e0033b27a4534ad10469cf330f9f5d", "url": "places.html" }, { "revision": "888598273170b6172d7106fd04e55ea1", "url": "privacy-policy.html" }, { "revision": "22b03cf7efc55075c722f88031cbc349", "url": "quickreference.html" }, { "revision": "ffbe0b0737a87efa9c0fda99d4ef80ee", "url": "renderdemo.html" }, { "revision": "1fb0622a66914087a58213d479ec4d3a", "url": "rituals.html" }, { "revision": "aa5a47d99ec7d32e84dc19d33cfc9e2a", "url": "search.html" }, { "revision": "5a7431d83751ab584f8c2467a0a3743b", "url": "spells.html" }, { "revision": "bb0a37c28008c521827b532b0993d7dc", "url": "tables.html" }, { "revision": "366c01a81c6975fdb440a3994139d299", "url": "textconverter.html" }, { "revision": "a465c2e5aafe4deb12131a1bf0b83282", "url": "traits.html" }, { "revision": "1c8f8c0250ff050b6ced60c3fbef6b04", "url": "variantrules.html" }, { "revision": "96066fb05492555b54afd670d6868610", "url": "vehicles.html" }, { "revision": "07c706820372a879332b65496ee1692f", "url": "search/index-alt-spell.json" }, { "revision": "a2c797a51147f62dc30cc0c616e035c2", "url": "search/index-item.json" }, { "revision": "64badd14a704af61d95994709088b4ab", "url": "search/index.json" }, { "revision": "84bfc1f94181b9f35294a2ee9d8c08eb", "url": "search/traits.json" }, { "revision": "4050573dedbe1cc64b4fdcad04351daa", "url": "manifest.webmanifest" }, { "revision": "448c34a56d699c29117adc64c43affeb", "url": "fonts/glyphicons-halflings-regular.woff2" }, { "revision": "e18bbf611f2a2e43afc071aa2f4e1512", "url": "fonts/glyphicons-halflings-regular.ttf" }, { "revision": "d09e5b926b6fdb2a506e5909de33de23", "url": "fonts/good-pro-400.ttf" }, { "revision": "9f6134a15b7dfc5a119bc65376dbe269", "url": "fonts/good-pro-400.woff" }, { "revision": "ff1abe8ed0ef061106b68d844c8dab4d", "url": "fonts/good-pro-400.woff2" }, { "revision": "361e7ff40e96db6bbbfe90889d95afdc", "url": "fonts/good-pro-700.ttf" }, { "revision": "1997214212f12c3e4a68f5195e68cb5d", "url": "fonts/good-pro-700.woff" }, { "revision": "0fea4b7d69bbcb12a33f0922262c6421", "url": "fonts/good-pro-700.woff2" }, { "revision": "a11892b605845bf613d1a8bb06c00b04", "url": "fonts/good-pro-condensed-400.ttf" }, { "revision": "6421dccde27db5dba3399149e69f71d3", "url": "fonts/good-pro-condensed-400.woff" }, { "revision": "ea4d723a4099259aba94b84e333034f8", "url": "fonts/good-pro-condensed-700.ttf" }, { "revision": "fc0455882bdfe0c48aa7186da15c85f3", "url": "fonts/good-pro-condensed-700.woff" }, { "revision": "46aa1be77a9022bb5ee43a8513fb3057", "url": "fonts/good-pro-condensed-700.woff2" }, { "revision": "51853144d912fd5553eeb7d39c3b53bf", "url": "fonts/good-pro-condensed-italic-400.ttf" }, { "revision": "41d2455a8dea4aac5165b82743681efa", "url": "fonts/good-pro-condensed-italic-400.woff" }, { "revision": "5a10bdbc21e43df2acd07e2487820d60", "url": "fonts/good-pro-condensed-italic-700.ttf" }, { "revision": "556dd5c152d5b0739a5121f37a2baff4", "url": "fonts/good-pro-condensed-italic-700.woff" }, { "revision": "1bc04907c2bf079908e90e0313239bcd", "url": "fonts/good-pro-condensed-italic-700.woff2" }, { "revision": "ff1eae181861f44db0ab1431879a49f9", "url": "fonts/good-pro-italic-400.ttf" }, { "revision": "a9ed15953b80fedb8137f8f25839fb96", "url": "fonts/good-pro-italic-400.woff" }, { "revision": "1b23ad64d84c8cee844cf53e466e6eed", "url": "fonts/good-pro-italic-400.woff2" }, { "revision": "55ee8f359a01d66ab3b8b22d02d9ed55", "url": "fonts/good-pro-italic-700.ttf" }, { "revision": "6ee51b012748f002f234b578ab1268b7", "url": "fonts/good-pro-italic-700.woff" }, { "revision": "7489b33e26f603728567f2ccee7e508e", "url": "fonts/good-pro-italic-700.woff2" }, { "revision": "2640ba59a59d7dfbb88d0d477f7bdb0a", "url": "fonts/Pathfinder2eActions.ttf" }, { "revision": "c153508add58cc58db1ef0be5c9f8adf", "url": "fonts/Gin-Regular.ttf" }, { "revision": "b0bf2c218bf460993111010eb83a0fa8", "url": "fonts/SabonLTStd-Bold.ttf" }, { "revision": "1b97aaf6b6e56d43d0b9e370c4f50876", "url": "fonts/SabonLTStd-BoldItalic.ttf" }, { "revision": "d69ef52beb7ca47462a0f89ff028a2f3", "url": "fonts/SabonLTStd-Italic.ttf" }, { "revision": "d6e119cff761a4bee40d2f640db5af1e", "url": "fonts/SabonLTStd-Roman.ttf" }, { "revision": "778896312671ade54c606724f278bf36", "url": "fonts/AlbertusMT.ttf" }, { "revision": "918ab3311bf65e4da491aaba2f2ca5bc", "url": "fonts/Basing.ttf" }, { "revision": "2f95108599bc770e0fc66a063b0f5906", "url": "fonts/Taroca.ttf" }, { "revision": "c18c5f06b696ed2d4c1e5eda8cc204ca", "url": "img/gmscreen/moon.webp" }, { "revision": "183504177c2f7e2ccc6b88461af6000d", "url": "img/letter-dark.webp" }, { "revision": "43877a1bc57da60ca9a9aafeac9d8e2f", "url": "img/letter.webp" }, { "revision": "4279516591cee28c697c6d2f84d84da1", "url": "img/patreon.webp" }, { "revision": "12f8d0eeba4504e025f30e4bf6326cd6", "url": "fonts/fa-light-300.eot" }, { "revision": "da5526bf0f7fae09080945b15da77066", "url": "fonts/fa-light-300.ttf" }, { "revision": "83c52b7102d3b3586554677f947792e7", "url": "fonts/fa-light-300.woff" }, { "revision": "1d4e499e402761b86c26b5fa3ad51c30", "url": "fonts/fa-light-300.woff2" }, { "revision": "09554888dac30eee041e8047d3dc75b4", "url": "sw-injector.js" }]);
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
  var runtimeManifest = new Map([["data/adventure/adventure-id.json", "1c29701a3abdebba387f6b92237fcff5"], ["img/covers/blank.webp", "9b2781e05d13f720e91891cbb929fe20"], ["img/covers/CRB-100.webp", "7650bb7365cbf84b20ee97c6b7c0a189"], ["img/covers/CRB-25.webp", "716475fd096ad77eee0ed1b47c3a1431"], ["img/covers/CRB-33.webp", "d7ef321523e2f1321fe8a5324ed4643c"], ["img/covers/CRB.webp", "bfc8f8b52b8faeee86027947182edcf8"], ["img/covers/GMG-100.webp", "75c327c893ef10c786f963236b4fe9d0"], ["img/covers/GMG-25.webp", "a67231c72c04e4a4c018bbd33110198b"], ["img/covers/GMG-33.webp", "6b05c52c0af37ef6ae43cf6f5d719a9c"], ["img/covers/GMG.webp", "d3610c80b6d79213177340f0c5f8db06"], ["img/covers/LOWG-100.webp", "266ffa70d70230e300ed454c612e59cf"], ["img/covers/LOWG-25.webp", "61855c40cd160dcf3bc8c39dc10844c3"], ["img/covers/LOWG-33.webp", "138e39219a0a4da133f3519125e9bc3f"], ["img/covers/LOWG.webp", "1adccec87cc1324fecd5e34ebeef69d4"], ["img/covers/SoM-100.webp", "ed511ca0c38bbe1644ec1b8729e7fb9b"], ["img/covers/SoM-25.webp", "51f0a78fa32ece446abc13ada184a2bc"], ["img/covers/SoM-33.webp", "675e9f72483daeaf814cd1ac38e232c7"], ["img/covers/SoM.webp", "880dd82ad81eda61b903d28e4bdde4f9"], ["img/gmscreen/moon.webp", "c18c5f06b696ed2d4c1e5eda8cc204ca"], ["img/letter-dark.webp", "183504177c2f7e2ccc6b88461af6000d"], ["img/letter.webp", "43877a1bc57da60ca9a9aafeac9d8e2f"], ["img/patreon.webp", "4279516591cee28c697c6d2f84d84da1"], ["img/logo/Background.svg", "c6ec599d06aa5b773e600881ceeb0460"], ["img/logo/No%20Background.svg", "6d3b2f0a213f7bc5beba9e88f20667f7"], ["android-chrome-192x192.png", "9c862118ab3423bc2d01ab42f755e07b"], ["android-chrome-256x256.png", "fad8c4a79079fa54737cb9532e141aa0"], ["android-chrome-384x384.png", "4f2267d39b6bd3389138f074c45dfe67"], ["apple-touch-icon-120x120.png", "fe434a800beb3381ad59197e29e68a2a"], ["apple-touch-icon-152x152.png", "3b23873f540b0c5271201c5f91a0c7ed"], ["apple-touch-icon-167x167.png", "e19815500c57552e18f8218fbdb5cb72"], ["apple-touch-icon-180x180.png", "c9ecf9df6e7f7f55974f45f7110d9890"], ["apple-touch-icon-360x360.png", "b5d0e83a94f7fbea21006b7479d8a898"], ["favicon-128x128.png", "c7b2e3d1de45c84588bc4711a4b50c6d"], ["favicon-144x144.png", "6770b376fb68b50e546e60d4a0dae9aa"], ["favicon-16x16.png", "3dbac8b48aaa087a66f7e3a16af56994"], ["favicon-256x256.png", "e31f4ad5d254f7faedf87bd8ac8e3d1c"], ["favicon-32x32.png", "61f449203da4d72d7669df93ef5d1a0c"], ["favicon-48x48.png", "5144e32c3e7170887ec5c99adeeaaed2"], ["favicon-64x64.png", "be61a655807353c6f8dcb86ff896c581"], ["mstile-144x144.png", "9f6d0f9700426867bddb7614da8ece66"], ["mstile-150x150.png", "ba04e45075fa41f85441a1d070b40710"], ["mstile-310x150.png", "e37a7cc30a0283d5357fd38901cb6f56"], ["mstile-310x310.png", "80a2fed08dac45aa2cfc55ddaa5b69fa"], ["mstile-70x70.png", "798a4847c77967a489d66a40ef1d8801"], ["favicon.svg", "959b9c72ddadfdf4a067012231a84afb"], ["safari-pinned-tab.svg", "e84a2ecd6fd15fb32fc3f75293ef467c"]].map(([
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
