import { ObjectID } from 'mongodb';

import { getDB } from '../utils/dbUtils';
import { resolveOrReject } from '../utils/fooUtils';

class Dao {
	constructor(collectionName) {
		this.collectionName = collectionName;
	}

	getAll(filter) {
		return new Promise((resolve, reject) => {
			getDB().then( db => {
				db.collection(this.collectionName)
					.find(filter)
					.toArray(resolveOrReject(reject, resolve));
			})
		});
	};

	getOne(_id) {
		return new Promise((resolve, reject) => {
			getDB().then( db => {
				db.collection(this.collectionName)
					.findOne({ _id: ObjectID(_id) }, resolveOrReject(reject, resolve));
			})
		});
	};

	removeOne(_id) {
		return new Promise((resolve, reject) => {
			getDB().then( db => {
				db.collection(this.collectionName)
					.findOneAndDelete({ _id: ObjectID(_id) }, resolveOrReject(reject, resolve));
			})
		});
	};

	removeAllChildAndGetId(fieldKey, ids) {
		return new Promise((resolve, reject) => {
			getDB().then( db => {
				const query = { [fieldKey]: { $in: ids }};
				db.collection(this.collectionName)
					.find(query).toArray(resolveOrReject(reject, data => {
						db.collection(this.collectionName)
							.remove(query, resolveOrReject(reject,
								() => resolve(data.map(value => {
									return `${value._id}`
								}))
							));
					}))
			})
		});
	};
	
	addOne(data, authorId) {
		const now = new Date().toISOString();
		return new Promise((resolve, reject) => {
			getDB().then( db => {
				db.collection(this.collectionName)
					.insertOne({
						...data,
						createdAt: now,
						createdBy: authorId,
						updatedAt: now,
						updatedBy: authorId,
					}, resolveOrReject(reject, resolve));
			})
		});
	};

	updateOne(_id, data, authorId) {
		const now = new Date().toISOString();
		return new Promise((resolve, reject) => {
			getDB().then( db => {
				db.collection(this.collectionName)
					.findOneAndUpdate({
						_id: ObjectID(_id)
					}, {
						$set: {
							...data,
							updatedAt: now,
							updatedBy: authorId
						},
					}, {}, resolveOrReject(reject, resolve));
			})
		});
	};	
}

function DaoManager() {}

DaoManager.mapping = {};
DaoManager.getDao = function(collectionName){
	if (!DaoManager.mapping[collectionName]) {
		DaoManager.mapping[collectionName] = new Dao(collectionName);
	}
	return DaoManager.mapping[collectionName];
}

export default DaoManager;
