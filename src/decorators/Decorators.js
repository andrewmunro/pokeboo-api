export function decode(ProtoBuf) {
    return function (target, key, descriptor) {
        let fn = descriptor.value;

        if (typeof fn !== 'function') {
            throw new Error(`@decode decorator can only be applied to methods not: ${typeof fn}`);
        }

        return {
            configurable: true,
            get() {
                return async () => {
                    let result = await fn.call(this);

                    return ProtoBuf.decode(result.returns[0]);
                }
            }
        };
    }
};
