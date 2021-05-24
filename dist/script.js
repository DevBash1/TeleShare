var socket = io.connect("/");

socket.emit("closeOpenedRooms",get("id"));

socket.on("connect", function(){
    console.log("Connected!");
})
socket.on("error", function(){
    console.log("An Error Occurred");
})

func set(key,data){
    localStorage.setItem(key,data);
}
func get(key){
    return localStorage.getItem(key);
}


//Create a Pager
func page(id){
	let total_page = 10;
	for(i=0;i<total_page;i++){
		try{
			let page = @("#page"+i);
			page.style.display = "none";
		}catch(e){
			
		}
	}
	@("#page"+id).style.display = "block";
	var ani = anime({
        targets: '#page' + id,
        duration:500,
        delay:0,
        translateX:[360,0],
        loop:false,
        easing: 'linear',
        direction: 'alternate',
    });
}

func notify(text, type="info") {

    var notifier = new Notifier({
        position: 'bottom-right',
        direction: 'top',
    });
    var notification = notifier.notify(type, text);
    notification.push();
}

#page("1");

let share = @find("Share");
share.on("click", function(){
    setTimeout(function(){
        editor.refresh();
    },100)
	page("2");
});

let send = @find("Send");
send.on("click", function(){
	page("3");
	let code = editor.getValue();
	let rand = get("id") +"1"+ Math.floor(Math.random() * 100) + Math.floor(Math.random() * 1000);
	let pass = @("#password");
	pass.text(rand);
	
	let sharer = rand;

    socket.emit('createRoom',{
        room: sharer,
        owner: get("id"),
        code: code,
        pass: rand,
    });

    socket.on("roomCreated", function(data){
        console.log(JSON.stringify(data))
        if(data.owner == get("id")){
            qr(encodeURI(data.room));
            let joined = @("#joined");
            joined.html("<div class='wait'>Waiting for Users...</div>");
            let link = @("#link");
            link.val(document.location.origin + "?ts="+rand);
            link.on("click", function(){
                  link.focus();
                  link.select();

                  try {
                    var successful = document.execCommand('copy');
                    var msg = successful ? notify("Link Copied to clipboard","success") : console.log("failed");

                  } catch (err) {
                    console.log('Oops, unable to copy');
                  }
            })
        }
    })
    
    @("#disconnect").on("click",function(){
        this.text("Disconnecting...");
        socket.emit("closeRoom",{
            room: rand,
            id: get("id"),
        });
    })

    socket.on("roomClosed", function(data){
        notify("Disconnected")
        @("#joined").text("");
        @("#disconnect").text("Disconnect");
        @("#qrcode").text("");
        editor.setValue("");
        page("1");
    })

    let recievers = [];

    socket.on("new_user",function(data){

        if(recievers.indexOf(data.id) == -1){
            recievers[] = data.id;
            if(@(".wait")){
                @(".wait").remove();
            }
            notify("User_" + encodeURI(data.id) + " Joined Your Room");
            if(data.owner == get("id") && data.owner != data.id){
                let joined = @("#joined");
                joined.html() += "<p class='user'>User_"+encodeURI(data.id)+"</p>";
            }
            log JSON.stringify(data);
        }
    });

});

func qr(id) {
    var name = "User_" + get("id");
    var image = "dist/dp.png";
    var text = id;

    var qrcode = new QRCode(document.getElementById("qrcode"),{
        text: text,

        subTitle: "",
        subTitleFont: "14px font1",
        subTitleColor: "4fc74d",
        subTitleTop: 0,

        logo: image,
        logoWidth: 50,
        logoHeight: 50,
        logoBackgroundColor: '#ffffff',
        logoBackgroundTransparent: true,

        height: 150,
        width: 150

    });

}


func isLogin(){
    if(get("isLogin") != "true"){
        return false;
    }
    return true;
}

func modal(msg){
    bootbook.alert({
        message: "<span class='alert-title'>"+msg+"</span>",
        size: "small",
        backdrop: true
    });
}

if(!isLogin()){
    let usr = @("#user");
    let usr1 = @("#user1");
    let id = Math.floor(Math.random() * 100000);
    usr1.text("User_" + id);
    usr.text("User_" + id);
    set("id",id);
    set("isLogin","true");
}else{
    let usr = @("#user");
    usr.text("User_" + get("id"));
    let usr1 = @("#user1");
    usr1.text("User_" + get("id"));
}

let rec = @find("Recieve");
rec.on("click",function(){
    page("5");
    //let vid = @("#qr_video");
    //const qrScanner = new QrScanner(vid, result => alert('decoded qr code:', result));
    //qrScanner.start();
})

let enter = @find("Enter");
let pass = @("#pass_enter");
enter.on("click", function(){

    socket.emit("logIn",{
        id: get("id"),
        pass: pass.val(),
    });

    socket.on("badPass", function(data){
        notify(data,"error");
    })
    socket.on("success", function(data){
        notify("Connected To User_" + data.owner,"success")

        let myroom = encodeURI(data.room);
        let sender = encodeURI(data.owner);

        let buttom = @("#buttom");
        buttom.html("<p class='connected'>Connected To User_" + encodeURI(data.owner));
        page("2");
        let key = encodeURI(data.pass);
        
        socket.emit("new",{
            id: get("id"),
            room: myroom,
            owner: sender,
        })

        socket.emit("getCode",data.pass);

        socket.on("code", function(data){
            if(myroom == data.room){
                editor.setValue(data.code);
            }
        })

        socket.on("new_msg", function(data){
            log data;
        });

    })
})

let url = new URL(document.location.href).search;
if(url != "" && url.indexOf("?ts=") != -1){
    let passcode = url.substring(url.indexOf("=")+1,url.length).trim();
    passcode = encodeURI(passcode);
    notify("Auto Link Detected");
    setTimeout(function(){
        page("5");
        setTimeout(function(){
            @("#pass_enter").val(passcode);
        },1000)
        setTimeout(function(){
            @("#pass_button").click();
        },2000)

    },2000)
}