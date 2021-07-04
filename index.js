var express = require('express');
var app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = process.env.PORT || 5000;

app.use("/lib", express.static(__dirname + '/lib'));
app.use("/dist", express.static(__dirname + '/dist'));


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('lib/socket.js', function(req, res) {
    res.sendFile(__dirname + 'lib/socket.js');
});

Array.prototype.multiIndexOf = function (el) { 
    var idxs = [];
    for (var i = this.length - 1; i >= 0; i--) {
        if (this[i] === el) {
            idxs.unshift(i);
        }
    }
    return idxs;
};

let rooms = [];
let codes = [];
let owners = [];
let password = [];
let members = [];
let users = [];
let closed = [];

let count = 0;
io.on('connection', function(socket) {
    console.log("new connection");
    count++;

    socket.on("logIn", function(data){
        let pass = data.pass;
        if(closed.indexOf(pass) != -1){
            socket.emit("badPass","Tsharer Closed Room!");
            return true;
        }
        if(password.indexOf(pass) != -1){
            let index = password.indexOf(pass);
            if(data.id == owners[index]){
                socket.emit("badPass","Bad Reciever");
                return false;
            }
            socket.emit("success",{
                owner: owners[index],
                room: rooms[index],
                pass: password[index],
            });
        }else{
            socket.emit("badPass","Tsharer Not Found!");
        }
    })

    socket.on('createRoom', function(data) {
        console.log("On createRoom");
        
        rooms.push(data.room);
        codes.push(data.code);
        owners.push(data.owner);
        password.push(data.pass)
        members.push(1);
        users.push([]);


        socket.emit('roomCreated',{
            room: data.room,
            owner: data.owner
        });
    });

    socket.on("new", function(data){
        console.log("new user: " + JSON.stringify(data));
        let index = rooms.indexOf(data.room);
        let get_users = users[index];
        if(get_users.indexOf(data.id) != -1){
            get_users.push(data.id);
            users[index] = get_users;
            console.log(get_users.length);
        }
        
        socket.broadcast.emit("new_user",{
            id: data.id,
            total: count,
            room: data.room,
            owner: data.owner,
        });
        //socket.emit("new_msg","Hello");

    })

    socket.on("getCode", function(data){
        if(password.indexOf(data) != -1){
            let index = password.indexOf(data);
            socket.emit("code",{
                code: codes[index],
                room: rooms[index],
            });
        }
    })
    socket.on("closeRoom", function(data){
        let index = rooms.indexOf(data.room);
        if(owners.indexOf(data.id) == index){
            console.log("Closing room " + rooms[index])
            closed.push(password[index]);
            owners.splice(index,1);
            codes.splice(index,1);
            rooms.splice(index,1);
            password.splice(index,1);
            members.splice(index,1);
            users.splice(index,1);

            socket.emit("roomClosed",{

            });
        }
    })
    socket.on("closeOpenedRooms",function(data){
        let ons = owners.multiIndexOf(data);
        if(ons.length != 0){
            for(i=0;i<ons.length;i++){
                let index = ons[i];
                console.log("Closing idle room " + rooms[index])
                closed.push(password[index]);
                owners.splice(index,1);
                codes.splice(index,1);
                rooms.splice(index,1);
                password.splice(index,1);
                members.splice(index,1);
                users.splice(index,1);
            }
        } 
    });

});

io.on("disconnection", function(data){
    console.log("User Disconnected");
})



server.listen(port);
//console.log("Running on port " + process.env.PORT);
