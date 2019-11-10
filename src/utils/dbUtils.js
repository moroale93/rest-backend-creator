import getInstance from '../dao/dbAccess';

export function getDB() {
    return new Promise((resolve, reject) => {
        getInstance()
        .getConnection()
        .then(db => resolve(db))
        .catch(reject);
    });
}