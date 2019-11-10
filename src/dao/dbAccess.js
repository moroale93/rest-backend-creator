import { MongoClient } from 'mongodb';

var url = process.env.MONGODB_URI;

class Database {
    constructor() {
        if (!!Database.instance) {
            return Database.instance;
        }

		Database.instance = this;
		
        return this;
	}
	
	getConnection() {
		const self = this;
		return new Promise((resolve, reject) => {
			if(!!self.db){
				resolve(self.db);
				return;
			}
			MongoClient.connect(url, {
				useNewUrlParser: true,
				useUnifiedTopology: true
			}, function(err, client){
				if(err){
					reject(err);
				} else {
					self.db = client.db();
					resolve(self.db);
				}
			});
		});
	}

	closeConnection() {
		if(!!self.db) {
			this.db.close();
			delete this.db;
		}
	}
}

Database.getInstance = function() {
	return new Database();
}

export default Database.getInstance;
