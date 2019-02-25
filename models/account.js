let mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');
const Account = new Schema({
    nickname: String,
    money: {
        default: 0,
        type: Number
    },
    role: {
        type: String,
        default: "user"
    },
    message: Array,
    date:Date,
});
Account.plugin(passportLocalMongoose);
module.exports = mongoose.model('Account', Account);