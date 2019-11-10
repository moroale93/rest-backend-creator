import getEntitiesStructureInstance from '../utils/entitiesStructure';
import DaoManager from '../dao';

let middleware = require('./loginMiddleware');

export default class Api {
    constructor(expressMiddleware, dao) {
        this.expressMiddleware = expressMiddleware;
        this.dao = dao;
        this.services = [];
    }

    setupGetAll(needsAuthorization, endpoint, parentIdKey) {
        const service = () => {
            const self = this;
            console.log(`Start [GET]: ${endpoint}`);
            const handler = function(req, res) {
                const filter = {};
                if(parentIdKey) {
                    filter[parentIdKey] = req.params[parentIdKey];
                }
                self.dao.getAll(filter)
                    .then(data => res.send(data))
                    .catch(err => res.status(400).send(err));
            }
            if(needsAuthorization) {
                self.expressMiddleware.get(endpoint, middleware.checkToken, handler);
            } else {
                self.expressMiddleware.get(endpoint, handler);
            }
        }
        this.services.push(service);
    }

    setupGetOne(needsAuthorization, endpoint, paramName) {
        const service = () => {
            const self = this;
            console.log(`Start [GET]: ${endpoint}`);
            const handler = function(req, res) {
                self.dao.getOne(req.params[paramName])
                    .then(data => res.send(data))
                    .catch(err => res.status(400).send(err));
            }
            if(needsAuthorization) {
                self.expressMiddleware.get(endpoint, middleware.checkToken, handler);
            } else {
                self.expressMiddleware.get(endpoint, handler);
            }
        }
        this.services.push(service);
    }

    removeAllChild(group, structure) {
        const self=this;
        return new Promise((resolve, reject) => {
            const arrayOfPromises = [];
            const arrayOfNextGroup = [];
            if(!group || !group.length){
                resolve();
                return;
            }
            /**
             * ids: id rimossi del padre
             * fieldKey: il nome del campo della chiave esterna che fa riferimento al padre
             * childEntities: le informazioni dell'entità dei figli da rimuovere
             */
            group.forEach(({ids, fieldKey, childEntities}) => {
                childEntities.forEach(({ id: nodeId, value: { entity, idParam } }) => {
                    const prom = DaoManager.getDao(entity)
                        .removeAllChildAndGetId(fieldKey, ids);
                    arrayOfPromises.push(prom);
                    const nextChildren = structure.getChildren(nodeId);
                    arrayOfNextGroup.push({fieldKey: idParam, childEntities: nextChildren});
                })
            });
            /**
             * results: [[array di id gruppo 1], [array di id gruppo 2]]
             */
            Promise.all(arrayOfPromises)
                .then(results => {
                    if(!results || !results.length){
                        resolve();
                        return;
                    }
                    results.forEach((ids, index) => {
                        arrayOfNextGroup[index].ids = ids;
                    });
                    self.removeAllChild(arrayOfNextGroup, structure).then(resolve).catch(reject);
                })
                .catch(reject);
        })
    }

    setupDeleteOne(needsAuthorization, endpoint, structure, serviceNode) {
        const service = () => {
            const self = this;
            console.log(`Start [DELETE]: ${endpoint}`);
            const handler = function (req, res) {
                const idToRemove = req.params[serviceNode.value.idParam];
                self.dao.removeOne(idToRemove)
                    .then(data => {
                        const childEntities = structure.getChildren(serviceNode.id);
                        self.removeAllChild([{
                            ids: [idToRemove],
                            fieldKey: serviceNode.value.idParam,
                            childEntities
                        }], structure)
                            .then(() => {
                                res.send(data.value);
                            })
                            .catch(err => res.status(400).send(err));
                    })
                    .catch(err => res.status(400).send(err));
            };
            if(needsAuthorization) {
                self.expressMiddleware.delete(endpoint, middleware.checkToken, handler);
            } else {
                self.expressMiddleware.delete(endpoint, handler);
            }
        }
        this.services.push(service);
    }

    setupInsertOne(needsAuthorization, endpoint, parentIdKey) {
        const service = () => {
            const self = this;
            console.log(`Start [POST]: ${endpoint}`);
            const handler = function (req, res) {
                req.body[parentIdKey] = req.params[parentIdKey];
                self.dao.addOne(req.body, req.decoded && req.decoded.userId)
                    .then(data => res.send(data.ops[0]))
                    .catch(err => res.status(400).send(err));
            };
            if(needsAuthorization) {
                self.expressMiddleware.post(endpoint, middleware.checkToken, handler);
            } else {
                self.expressMiddleware.post(endpoint, handler);
            }
        }
        this.services.push(service);
    }

    setupEditOne(needsAuthorization, endpoint, paramName) {
        const service = () => {
            const self = this;
            console.log(`Start [PATCH]: ${endpoint}`);
            const handler = function (req, res) {
                self.dao.updateOne(req.params[paramName], req.body, req.decoded && req.decoded.userId)
                    .then(() => {
                        self.dao.getOne(req.params[paramName])
                            .then(data => res.send(data))
                    })
                    .catch(err => res.status(400).send(err));
            };
            if(needsAuthorization) {
                self.expressMiddleware.patch(endpoint, middleware.checkToken, handler);
            } else {
                self.expressMiddleware.patch(endpoint, handler);
            }
        }
        this.services.push(service);
    }

    setupServices(endpoint, paramName, structureId, needsAuthorization) {
		const structureInstance = getEntitiesStructureInstance();
        const structure = structureInstance.getStructure();
        const node = structure.getNode(structureId);
        const parentNode = node && node.parent && structure.getNode(node.parent);
        this.setupGetAll(needsAuthorization, endpoint.general, parentNode && parentNode.value.idParam);
        this.setupGetOne(needsAuthorization, endpoint.detail, paramName);
        this.setupDeleteOne(needsAuthorization, endpoint.detail, structure, node);
        this.setupInsertOne(needsAuthorization, endpoint.general, parentNode && parentNode.value.idParam);
        this.setupEditOne(needsAuthorization, endpoint.detail, paramName);
    }

    start() {
        this.services.forEach(service => service());
    }
}
