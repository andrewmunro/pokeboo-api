export function requiresAuth(target, key, descriptor) {
    let fn = descriptor.value;

    if (typeof fn !== 'function') {
        throw new Error(`@requiresAuth decorator can only be applied to methods not: ${typeof fn}`);
    }

    return {
        configurable: true,
        get() {
            return () => {
                console.log(this);
                if(!this.token) {
                    throw new Error(`Unable to call ${fn.name}() before login()!`);
                } else {
                    fn();
                }
            }
        }
    };
};
