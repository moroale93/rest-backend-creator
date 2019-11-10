## How to use

```js
// modules =================================================
const app = require('express')();
const ApiCreator = require('./src/api');
const server = require('http').createServer(app);

// configs ==================================================
const servicesConfigs = [
	{
		idParam: 'postId',
		entity: 'posts',
		needsAuthorization: true,
		subEntities: [
			{
				idParam: 'commentId',
				entity: 'comments',
				needsAuthorization: true,
				subEntities: [
					{
						idParam: 'likeId',
						entity: 'likes',
						needsAuthorization: true,
					}
				]
			},
			{
				idParam: 'likeId',
				entity: 'likes',
				needsAuthorization: true,
			}
		]
	},
	{
		idParam: 'commentId',
		entity: 'comments',
		needsAuthorization: true,
	}, 
	{
		idParam: 'profileId',
		entity: 'profiles',
		subEntities: [
			{
				idParam: 'postId',
				entity: 'posts',
				needsAuthorization: true,
			}
		]
	}
];
const loginConfig = {
	entity: 'profiles',
}

// setup backend ===========================================
const apiRestCreator = new ApiCreator(app);
apiRestCreator.setupEndpoints(servicesConfigs, loginConfig);

// start app ===============================================
server.listen(process.env.PORT);
```