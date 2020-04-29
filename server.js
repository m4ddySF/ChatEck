var express=require('express')
var app=express();
var server=require('http').Server(app);
var client=require('socket.io')(server).sockets
var path=require('path')
var ip=require('ip');
var mongo=require('mongodb').MongoClient;

var port=8080;

//connect to mongodb
mongo.connect('mongodb://localhost/chatdb',function(err,db){
    if(err){
        throw err; 
    }
    console.log('Mongo Connected')
    //connect to socket.io
    client.on('connection',function(socket){
        console.log('a new user is connected')
        let chat=db.collection('chats');

        //create function to send status
        SendStatus=function(s){
            socket.emit('status',s)
        }
        //get chats from mongo collections
        chat.find().limit(100).sort({_id:1}).toArray(function(err,res){
            if(err){
                throw err;
            }else{
                //emit the messages
                socket.emit('output',res)
            }    
        })
        
        //handle input event
        socket.on('input',function(data){
            let name=data.name;
            let message=data.message;
            if(name==''||message==''){
                //send error status
                SendStatus('Please enter a Name or Message')
            }else{
            //insert messages
            chat.insert({"name":"name","message":"message"},function(){
                client.emit('output',[data])

                SendStatus({
                    message:'Message sent',
                    clear:true
                })
            })
            }
        })
        //handle clear
        socket.on('clear',function(data){
            //remove all chats from collection
            chat.remove({},function(){
                socket.emit('cleared')
            })
        })
        
        //send status objects
        socket.on('disconnect',function(){
            console.log('user is disconnected')
        })
    })

})

app.get('/',function(req,res){
    res.sendfile("index.html");
});

server.listen(port,function(){
    console.log('server is listening at http://' + ip.address()+":"+port);
});



//var port= 8080;
//var users=[];

//io.on('connection',function(socket){
 //   console.log('new connection');
   // socket.on('disconnect',function(){
     //   console.log('user disconnected')
    //})
//});
