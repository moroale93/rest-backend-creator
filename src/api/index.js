import Api from './api';
import LoginApi from './loginApi';
import DaoManager from '../dao';
import getEntitiesStructureInstance from '../utils/entitiesStructure';

function getEndpointsFromChain(structure, id, detail) {
	if (!id) {
		return '';
	}
	const { value, parent } = structure.getNode(id);
	let endpoint = getEndpointsFromChain(structure, parent, true) + `/${value.entity}`;
	if (detail) {
		endpoint += `/:${value.idParam}`;
	}
	return endpoint;
}

export default class ApiCreator{
	constructor(expressMiddleware) {
		this.expressMiddleware = expressMiddleware; 
	}

	setupEndpoint(config) {
		const structureInstance = getEntitiesStructureInstance();
		const structure = structureInstance.getStructure();
		const { value: { idParam, entity, needsAuthorization }, id, children } = config;
		const api = new Api(this.expressMiddleware, DaoManager.getDao(entity));

		const endpoints = {
			detail: getEndpointsFromChain(structure, id, true),
			general: getEndpointsFromChain(structure, id, false),
		}
		api.setupServices(endpoints, idParam, id, needsAuthorization);
		api.start();
		if (children && children.length) {
			children.map(childId => structure.getNode(childId))
				.forEach(subConfig => this.setupEndpoint(subConfig));
		}
	}

	setupEndpoints(configs, loginConfig){
		const structureInstance = getEntitiesStructureInstance();
		structureInstance.setStructure(configs);
		const structure = structureInstance.getStructure();

		const loginApi = new LoginApi(this.expressMiddleware, loginConfig)
		loginApi.setupServices();
		loginApi.start();

		const setupEndpoint = this.setupEndpoint.bind(this);
		structure.getChildren().forEach((config) => setupEndpoint(config));
	}
};
