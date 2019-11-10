export function resolveOrReject(reject, resolve) {
    return (err, value) => {
        if(err) {
            reject(err)
        } else {
            resolve(value);
        }
    };
}