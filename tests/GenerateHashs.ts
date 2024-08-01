const bcrypt = require('bcryptjs');

const senha = 'senha123';

bcrypt.hash(senha, 10, (err, hash) => {
  if (err) {
    console.error(err);
  } else {
    console.log(hash);
  }
});