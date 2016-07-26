export function decode(ProtoBuf) {
    return function (target, key, descriptor) {
        return {
            configurable: true,
            get() {
                let fn = descriptor.value || descriptor.get.call(this);

                if (typeof fn !== 'function') {
                    throw new Error(`@decode decorator can only be applied to methods not: ${typeof fn}`);
                }

                return async (...args) => {
                    let result = await fn.apply(this, args);
                    return ProtoBuf.decode(result.returns[0]);
                }
            }
        };
    };
}

export function handleError(errorMessageOrHandler) {
    return function (target, key, descriptor) {
        return {
            configurable: true,
            get() {
                let fn = descriptor.value || descriptor.get.call(this);

                if (typeof fn !== 'function') {
                    throw new Error(`@handleError decorator can only be applied to methods not: ${typeof fn}`);
                }

                return async (...args) => {
                    let result;
                    try {
                        result = await fn.apply(this, args);
                    } catch(e) {
                        if(typeof errorMessageOrHandler === 'function') {
                            return errorMessageOrHandler(e);
                        }

                        require('../logger/Logger').error(`${errorMessageOrHandler}:`, e.message);
                        return null;
                    }
                    return result;
                };
            }
        };
    };
}