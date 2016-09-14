
(function() {
    'use strict';
    var isMobile = false;
    var canvas = document.getElementById("gameCanvas");
    var ctx = canvas.getContext("2d");
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    var peer = new Peer({key: 'qtvbo0kwdqz7iudi'});
    var conn;
    var buttons = [], scrollableElements = [], playerList;
    var mousePos;
    var now = Date.now();
    var then = Date.now();
    var mouseDown = 0;
    var fps = 0, deltaPrev = 0;
    var playerName = prompt("What is your name?");
    var defaultState = {lobby: {
        name: "lobby",
        selectedRoom: null,
        scroll: 0,
        rooms: [],
        players: [],
        newRoomButton: null
    }};
    var state;
    changeState(defaultState.lobby);







    peer.on('open', function() {
        console.log('Peer connecting!');
        conn = peer.connect('server');
        conn.on('open', function () {
            // Receive messages
            conn.on('data', function (data) {
                console.log('Received data: ', data);
                var dataObj = JSON.parse(data.split("|")[1]);
                if (data.indexOf("lobbyObject") == 0) {
                    state.rooms = (dataObj.lobbyRooms);
                    state.players = (dataObj.lobbyPlayers);
                    updatePlayerListScrollableElement();
                }
                else if (data.indexOf("playerJoinedLobby") == 0) {
                    state.players.push(dataObj);
                    console.log("Added player to lobby", dataObj);
                    updatePlayerListScrollableElement();
                }
                else if (data.indexOf("playerLeftLobby") == 0) {
                    state.players.splice(getPlayerIndexFromId(dataObj.id), 1);
                    console.log("Removed player to lobby", dataObj);
                    updatePlayerListScrollableElement();
                }
            });

            // Send messages
            conn.send("requestLobby|\"[]\"");
            conn.send('addPlayerToLobby|'+JSON.stringify({name: playerName, id: peer.id}));
        });
    });
    function updatePlayerListScrollableElement() {
        playerList.clear();
        console.log("Clearing player list");
        for (var a = 0; a < state.players.length; a++) {
            playerList.addItem(state.players[a].name);
            console.log("Adding player to list: " + state.players[a].name);
        }
    }
    function getPlayerIndexFromId(id) {
        for (var a = 0; a < state.players.length; a++) {
            if (state.players[a].id == id) {
                return a;
            }
        }
        return -1;
    }
    var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.mozRequestAnimationFrame;
    function gameLoop() {
        now = Date.now();
        var delta = now - then;


        update(delta / 1000);
        fps = 2000 / (delta + deltaPrev);
        deltaPrev = delta;

        render();
        then = now;

        // Request to do this again ASAP
        requestAnimationFrame(gameLoop);
    }
    function update(delta) {
        _.forEach(buttons, function(button) {
            button.update();
        });
        _.forEach(scrollableElements, function(scrollableElement) {
            scrollableElement.update();
        });
        if (mouseDown == 2) {
            mouseDown = 1;
        }
    }
    function changeState(newState) {

        state = $.extend(true, {}, newState);
        if (newState == defaultState.lobby) {
            //add buttons
            state.newRoomButton = new Button("Create New Room", {x: 500, y: 3}, {w: 200, h: 27}, function() {alert("Button pressed");});

        }
        playerList = new ScrollableElement([], {x: 600, y: 80}, {w: 200, h: 80});
    }
    function render() {
        ctx.fillStyle = "silver";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        if (state.name === "lobby") {
            //render the game rooms, etc
            ctx.fillStyle = "black";

            ctx.font="30px Calibri";
            ctx.fillText("Join a room or create your own", 10, 0);
            ctx.font="24px Calibri";
            ctx.fillText("fps: " + Math.floor(fps), 1120, 0);
            drawLine(5, 35, canvas.width - 5, 35, {lineWidth: 4});

            ctx.font="18px Calibri";
            ctx.fillText("Players in lobby:", 655, 45);
            drawLine(655, 70, 895, 70, {lineWidth: 2});


            _.forEach(buttons, function(button) {
                button.draw();
            });
            _.forEach(scrollableElements, function(scrollableElement) {
                scrollableElement.draw();
            });
            ctx.stroke();

        }
    }
    function click() {
        if (mouseDown == 0) {
            mouseDown = 2;
        }
        _.forEach(buttons, function(button) {
            button.clickIfNecessary();
        });
        _.forEach(scrollableElements, function(scrollableElement) {
            scrollableElement.clickIfNecessary();
        });
    }
    function mouseUp() {
        console.log("mouse released");
        mouseDown = 0;
    }
    function drawLine(x1, y1, x2, y2, params) {
        if (params) {
            if (params.lineWidth) {
                ctx.lineWidth = params.lineWidth;
            }
        }
        ctx.moveTo(x1,y1);
        ctx.lineTo(x2,y2);
        ctx.lineWidth = 1;
    }
    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }
    canvas.addEventListener('mousemove', function(evt) {
        mousePos = getMousePos(canvas, evt);
    }, false);
    canvas.addEventListener('mousedown', function(evt) {
        click();
    }, false);
    canvas.addEventListener('mouseup', function(evt) {
        mouseUp();
    }, false);
    function Button(text, position, dimensions, action, params) {
        this.text = text;
        this.position = position;
        this.dimensions = dimensions;
        this.action = action;
        this.params = params || {normal: {fillStyle: "silver", borderStyle: "black", textStyle: "black", font: "18px Arial"}, mouseOver: {fillStyle: "yellow", borderStyle: "black", textStyle: "black", font: "18px Arial"}, mouseClicked: {fillStyle: "blue", borderStyle: "black", textStyle: "black", font: "18px Arial"}};
        this.mouseOver = false;
        this.mouseClicked = false;
        buttons.push(this);
    }
    Button.prototype.update = function() {
        this.mouseOver = inBounds(mousePos, this.position, this.dimensions);
        this.mouseClicked = this.mouseClicked && (mouseDown !=0);
    };
    Button.prototype.draw = function() {
        var param = this.mouseClicked ? this.params.mouseClicked : (this.mouseOver ? this.params.mouseOver : this.params.normal);
        ctx.fillStyle = param.fillStyle;
        ctx.fillRect(this.position.x, this.position.y, this.dimensions.w, this.dimensions.h);
        ctx.fillStyle = param.textStyle;
        ctx.font = param.font;
        ctx.fillText(this.text, this.position.x + 2, this.position.y + 2);
        ctx.strokeStyle = param.borderStyle;
        ctx.rect(this.position.x, this.position.y, this.dimensions.w, this.dimensions.h);
    };
    Button.prototype.clickIfNecessary = function(){
        if (this.mouseOver) {
            this.mouseClicked = true;
            this.action();
        }
    };

    function ScrollableElement(elements, position, dimensions, params) {
        this.elements = elements;
        this.position = position;
        this.scrollbarHeight = dimensions.h;
        this.scrollPercent = 0;
        this.dimensions = dimensions;
        this.params = params || {normal: {fillStyle: "silver", borderStyle: "black", textStyle: "black", font: "18px Arial"}, mouseOver: {fillStyle: "yellow", borderStyle: "black", textStyle: "black", font: "18px Arial"}, draggingScrollbar: {fillStyle: "blue", borderStyle: "black", textStyle: "black", font: "18px Arial"}};
        this.mouseOver = false;
        this.rowSize = 20;
        this.clickPrevMouseY = 0;
        this.scrollbarDragging = false;
        scrollableElements.push(this);
    }
    ScrollableElement.prototype.clear = function() {
        this.elements = [];
    };
    ScrollableElement.prototype.update = function() {
        this.scrollbarDragging = this.scrollbarDragging && (mouseDown != 0);
        if (isMobile) {
            this.mouseOver = inBounds(mousePos, this.position, this.dimensions);
            return;
        }
        this.mouseOver = inBounds(mousePos, {x: this.position.x + this.dimensions.w - 30, y: this.position.y + (this.dimensions.h - this.scrollbarHeight) * this.scrollPercent}, {w: 30, h: this.scrollbarHeight});
        if (this.scrollbarDragging && this.scrollbarHeight != this.dimensions.h) {
            this.scrollPercent = Math.min(Math.max(0, this.scrollPercent + (mousePos.y - this.clickPrevMouseY)/(this.dimensions.h - this.scrollbarHeight)), 1);
            this.clickPrevMouseY = mousePos.y;
        }
    };
    ScrollableElement.prototype.addItem = function(text) {
        this.elements.push(text);
        remakeScrollbar(this);
    };
    ScrollableElement.prototype.removeItem = function(text) {
        this.elements.splice(this.elements.indexOf(text), 1);
        remakeScrollbar(this);
    };
    var remakeScrollbar = function(se) {
        if ((se.elements.length * se.rowSize) == 0) {
            se.scrollbarHeight = se.dimensions.h;
        }
        se.scrollbarHeight = Math.min(se.dimensions.h, se.dimensions.h * se.dimensions.h / (se.elements.length * se.rowSize));
    };
    ScrollableElement.prototype.draw = function() {
        var param = this.params.normal;
        ctx.fillStyle = param.fillStyle;
        ctx.fillRect(this.position.x, this.position.y, this.dimensions.w, this.dimensions.h);
        ctx.fillStyle = param.textStyle;
        ctx.font = param.font;

        for (var a = 0; a < this.elements.length; a++) {
            var drawY = this.position.y + this.rowSize * a - (Math.max(0, this.rowSize * (this.elements.length) - this.dimensions.h) * this.scrollPercent);
            if (drawY + this.rowSize <= this.position.y + this.dimensions.h && drawY >= this.position.y) {
                ctx.fillText(this.elements[a], this.position.x + 2, drawY);
            }
        }
        ctx.strokeStyle = param.borderStyle;
        ctx.rect(this.position.x, this.position.y, this.dimensions.w, this.dimensions.h);


        drawLine(this.position.x + this.dimensions.w - 30, this.position.y, this.position.x + this.dimensions.w - 30, this.position.y + this.dimensions.h);
        param = this.scrollbarDragging ? this.params.draggingScrollbar : (this.mouseOver ? this.params.mouseOver : this.params.normal);
        ctx.fillStyle = param.fillStyle;
        ctx.rect(this.position.x + this.dimensions.w - 30, this.position.y + (this.dimensions.h - this.scrollbarHeight) * this.scrollPercent, 30, this.scrollbarHeight);
        ctx.fillRect(this.position.x + this.dimensions.w - 30, this.position.y + (this.dimensions.h - this.scrollbarHeight) * this.scrollPercent, 30, this.scrollbarHeight);
    };
    ScrollableElement.prototype.clickIfNecessary = function(){
        if (this.mouseOver) {
            this.scrollbarDragging = true;
            this.clickPrevMouseY = mousePos.y;
        }
    };

    function inBounds(location, position, dimensions){
        if (!location || !position || !dimensions) {
            return false;
        }
        if (location.x >= position.x && location.y >=position.y && location.x<=position.x + dimensions.w && location.y<=position.y + dimensions.h){
            return true;
        }
        return false;
    }
    gameLoop();
})();