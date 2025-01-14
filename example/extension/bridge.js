function createHandler(o, context, level) {
    return {
        get(_, path) {
            context.addAccessTrace(path, level);
            return new Proxy(o[path] ?? function fake() { }, createHandler(o, context, level + 1));
        },
        apply(_, __, argArray) {
            return context.invoke(argArray);
        }
    };
}
const createProxy = (val, ctx) => {
    return new Proxy(val, createHandler(val, ctx, 1));
};

/**
 * 判断是否为 promise
 */
const isPromise = (val) => {
    return (val !== null &&
        typeof val === 'object' &&
        typeof val.then === 'function' &&
        typeof val.catch === 'function');
};
/**
 * 深拷贝
 */
const deepCopy = (target) => {
    if (!target) {
        return target;
    }
    if (Array.isArray(target)) {
        const result = [];
        for (const objElement of target) {
            result.push(deepCopy(objElement));
        }
        // @ts-expect-error value has copied
        return result;
    }
    else if (typeof target === 'object') {
        const result = {};
        Object.entries(target).forEach(([k, v]) => {
            // @ts-expect-error value has copied
            result[k] = deepCopy(v);
        });
        // @ts-expect-error value has copied
        return result;
    }
    else {
        return target;
    }
};

const UNDEFINED = '$undefined$';

const createMessageSerializer = (options) => {
    function serialise0(arg) {
        if (arg === undefined || arg === null) {
            return UNDEFINED;
        }
        if (typeof arg === 'object') {
            for (const key of Object.keys(arg)) {
                arg[key] = serialise0(arg[key]);
            }
            return arg;
        }
        else if (Array.isArray(arg)) {
            for (let i = 0; i < arg.length; i++) {
                arg[i] = serialise0(arg[i]);
            }
        }
        else if (typeof arg === 'function') {
            return '$function$' + options.registerFunction(arg);
        }
        else {
            return `$${typeof arg}$${arg}`;
        }
    }
    return {
        serialise(data) {
            return JSON.stringify(serialise0(data));
        }
    };
};

const createMessageDeserializer = (options) => {
    function resolveType(raw) {
        if (raw[0] !== '$') {
            return;
        }
        const p = raw.indexOf('$', 1);
        if (p == -1) {
            return undefined;
        }
        // @ts-expect-error result is not in 'typeof'
        return raw.substring(1, p);
    }
    function deserializes0(arg) {
        if (!arg || arg === UNDEFINED) {
            return undefined;
        }
        if (typeof arg === 'object') {
            for (const key of Object.keys(arg)) {
                arg[key] = deserializes0(arg[key]);
            }
            return arg;
        }
        else if (Array.isArray(arg)) {
            for (let i = 0; i < arg.length; i++) {
                arg[i] = deserializes0(arg[i]);
            }
            return arg;
        }
        // expected string here
        if (typeof arg !== 'string') {
            throw new Error(`Unexpected type ${typeof arg}`);
        }
        const type = resolveType(arg);
        if (!type) {
            throw new Error('No type found: ' + arg);
        }
        if (type === 'function') {
            return options.generateCallback(arg.substring(type.length + 2));
        }
        const value = arg.substring(type.length + 2);
        switch (type) {
            case 'number':
                return Number.parseInt(value);
            case 'string':
                return value;
            case 'boolean':
                return value === 'true';
            default:
                // TODO 有用到剩下的类型再加
                throw new Error(`Unexpected type ${typeof arg}`);
        }
    }
    return {
        deserialize(serialisedArgs) {
            return deserializes0(JSON.parse(serialisedArgs));
        }
    };
};

const createMessageSender = (poster, serializer) => {
    return {
        sendMessage(...args) {
            const body = {
                type: args[0],
                data: args[1]
            };
            poster.postMessage(serializer.serialise(deepCopy(body)));
        }
    };
};

const createMessageBridge = (options) => {
    const serializer = createMessageSerializer(options);
    const sender = createMessageSender(options.poster, serializer);
    const deserializer = createMessageDeserializer({
        generateCallback: (peerId) => {
            return (...args) => {
                sender.sendMessage('invokeById', {
                    id: peerId,
                    args
                });
            };
        }
    });
    const handlerMap = new Map();
    const listenerCallback = (evt) => {
        if (typeof evt.data !== 'string') {
            return;
        }
        const data = deserializer.deserialize(evt.data);
        if (data.type) {
            handlerMap.get(data.type)?.handleMessage(data.data);
        }
    };
    // TODO remove listener.
    options.poster.addEventListener('message', listenerCallback);
    return {
        addMessageHandler(handler) {
            handlerMap.set(handler.type, handler);
        },
        getMessageSender() {
            return sender;
        }
    };
};

class DefaultBridgeContext {
    delegateTarget;
    visitStackTrace = [];
    funcMapping = new Map();
    pendingPromise = new Map();
    lastId = 1;
    invokeId = 0;
    bridge;
    constructor(delegateTarget, poster) {
        this.delegateTarget = delegateTarget;
        this.bridge = createMessageBridge({
            poster,
            registerFunction: func => {
                const key = this.lastId.toString(10);
                this.lastId++;
                this.funcMapping.set(key, func);
                return key;
            }
        });
        this.bridge.addMessageHandler({
            type: 'invokeById',
            handleMessage: (data) => {
                this.funcMapping.get(data.id)?.(...data.args);
            }
        });
        this.bridge.addMessageHandler({
            type: 'invoke',
            handleMessage: (data) => {
                const full = data.path.join('.')
                let val
                if (full === 'runtime.onMessage.addListener') {
                    val = chrome.runtime.onMessage.addListener(...data.args);
                } else {
                    let current = this.delegateTarget;
                    for (const p of data.path) {
                        current = current[p];
                    }
                    console.log(full)
                    val = current(...data.args);
                }
                if (isPromise(val)) {
                    val.then(r => {
                        this.bridge.getMessageSender().sendMessage('invokeResponse', {
                            id: data.id,
                            data: r
                        });
                    }).catch(e => {
                        this.bridge.getMessageSender().sendMessage('invokeResponse', {
                            id: data.id,
                            error: e
                        });
                    });
                }
            }
        });
        this.bridge.addMessageHandler({
            type: 'invokeResponse',
            handleMessage: (data) => {
                const promise = this.pendingPromise.get(data.id);
                if (promise) {
                    if (data.data) {
                        promise.resolve(data.data);
                    }
                    else if (data.error) {
                        promise.reject(data.data);
                    }
                    else {
                        promise.resolve(data.data);
                    }
                    this.pendingPromise.delete(data.id);
                }
            }
        });
    }
    addAccessTrace(pathName, level) {
        while (this.visitStackTrace.length >= level) {
            this.visitStackTrace.pop();
        }
        this.visitStackTrace.push(pathName);
    }
    invoke(args) {
        const id = this.invokeId++;
        this.bridge.getMessageSender().sendMessage('invoke', {
            id,
            path: this.visitStackTrace,
            args,
        });
        return new Promise((resolve, reject) => {
            this.pendingPromise.set(id, { resolve, reject });
        });
    }
}

const createBridgePeerClient = (val, poster) => {
    const ctx = new DefaultBridgeContext(val, poster);
    return createProxy(val, ctx);
};
const createBridePeerClientWithTypeOnly = (poster) => {
    const ctx = new DefaultBridgeContext({}, poster);
    return createProxy({}, ctx);
};

export { createBridePeerClientWithTypeOnly, createBridgePeerClient };
