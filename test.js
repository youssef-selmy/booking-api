require('dotenv').config({path:'config.env'});
console.log('root open router:',process.env.OPENROUTER_API_KEY);
const rc=require('./controller/recommendationController');
console.log('controller value now:',process.env.OPENROUTER_API_KEY);
