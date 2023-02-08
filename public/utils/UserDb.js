const { default: mongoose } = require('mongoose');
const moongose= require('mongoose');

const msgSchema = new mongoose.Schema({
    msg:{
        type:String,
        require:true
    },
    username:{
        type:String,
        require:true
    }
})


const Msg=mongoose.model('msg',msgSchema);

module.exports=Msg;