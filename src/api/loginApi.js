import DaoManager from '../dao';

let jwt = require('jsonwebtoken');

class HandlerGenerator {
  constructor(dao){
    this.dao = dao;
  }

  login (req, res) {
    let userId = req.body.id;
    if (userId) {
      this.dao.getOne(userId)
        .then(function(user) {
          if (user) {
            let token = jwt.sign({userId: userId},
                process.env.SECRET,
              { expiresIn: '24h' // expires in 24 hours
              }
            );
            res.setHeader('Authorization', 'Bearer '+ token); 
            res.json({
              success: true,
              message: 'Authentication successful!',
              token: token,
              user
            });
          } else {
            res.status(403).json({
              success: false,
              message: 'Incorrect user ID'
            });
          }
        })
        .catch(function(error) {
          res.status(403).json({
            success: false,
            message: error
          });
        })
      
    } else {
      res.status(400).json({
        success: false,
        message: 'Authentication failed! Please check the request'
      });
    }
  }
}

export default class LoginApi {
    constructor(expressMiddleware, loginConfig) {
      this.expressMiddleware = expressMiddleware;
      this.dao = DaoManager.getDao(loginConfig.entity);
      this.services = [];
    }

    setupLogin() {
      const self = this;
      const service = () => {
          console.log(`Start [POST]: /login`);
          let handlers = new HandlerGenerator(self.dao);
          const loginHandler = handlers.login.bind(self);
          this.expressMiddleware.post('/login', loginHandler);
      }
      this.services.push(service);
    }

    setupServices() {
      this.setupLogin();
    }

    start() {
      this.services.forEach(service => service());
    }
}
