var app;
$(function() {
    var socket = io();
    app = new Vue({
        el: '#app',
        data: {
            users: [],
            messages: [],
            curUser: "admin",
            inmsg: "",
        },
        methods: {
            onSubmit: function() {
                socket.emit('chat message', {
                    to: this.curUser,
                    msg: this.inmsg,
                });
                this.inmsg = "";
            },
            onChangeUser: function(username) {
                var user = this.users.find((user) => {
                    return (username == user.username)
                });
                this.curUser = user.username;
                this.messages = user.message;
            },
            usersSort: function() {
                this.users.sort(function(x, y) {
                    if (moment(x.date).format("X") > moment(y.date).format("X")) {
                        return -1;
                    } else {
                        return 1;
                    }
                });
            },
            onAddMoney:function(){
                $.ajax("/addmoney").then((data)=>{
                    console.dir(data);
                    location.reload();
                });
            }
        },
        created: function() {
            $.ajax("/getallusers").then((data) => {
                if (data) {
                    this.users = data;
                    this.usersSort();
                }
                this.onChangeUser(this.users[0].username);
                socket.on('chat message', (data) => {
                    var exist = this.users.some((user, index) => {
                        if (user.username === data.to) {
                            this.users[index].date = Date.now();
                            this.users[index].message.push(data);
                            this.$set(this.users, index, this.users[index]);
                            return true;
                        } else {
                            return false;
                        }
                    });
                    if (!exist) {
                        this.users.push({
                            username: data.username,
                            message: [{
                                msg: data.msg,
                                username: data.username
                            }]
                        })
                    }
                    this.usersSort();
                });
            });
        },
    });
});