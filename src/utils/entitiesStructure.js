class MyStructure {
    constructor() {}

    _addNodes(serviceConfig, parentId) {
        return (serviceConfig || []).map(({
            subEntities,
            ...value
        }) => {
            const newOne = {
                id: ++this.lastId,
                value: value,
                parent: parentId,
            };
            if (subEntities) {
                newOne.children = this._addNodes(subEntities, newOne.id);
            }
            this.tree[newOne.id] = newOne;
            return newOne.id;
        });
    }
    
    setup(serviceConfig) {
        this.lastId=0;
        this.tree = { 0: { id: 0 } };
        this.tree[0].children = this._addNodes(serviceConfig, 0);
    }

    getChildren(nodeId) {
        const {children} = this.tree[nodeId?`${nodeId}` : '0'];
        return (children || []).map(id => this.tree[`${id}`]);
    }

    getNode(nodeId) {
        if(!nodeId){
            return null;
        }
        return this.tree[nodeId];
    }
}

class EntitiesStructure {
    constructor() {
        if (!!EntitiesStructure.instance) {
            return EntitiesStructure.instance;
        }

		EntitiesStructure.instance = this;
		
        return this;
    }

    setStructure(serviceConfig) {
        this.structure = new MyStructure();
        this.structure.setup(serviceConfig);
    }
    
    getStructure() {
        return this.structure;
    }
}

EntitiesStructure.getInstance = function() {
	return new EntitiesStructure();
}

export default EntitiesStructure.getInstance;
