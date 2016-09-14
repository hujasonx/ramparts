(function() {
    var peer = new Peer("server", {key: 'qtvbo0kwdqz7iudi'});
    var connections = [];
    var numConnectionsLifetime = 0;
    var lobby =
        {lobbyRooms: [],
        lobbyPlayers: []};
    peer.on('open', function(id) {
        console.log('Server Started with ID: ' + id);
    });
    peer.on('error', function(err) {console.log("Peer Error: " , err);});
    peer.on('connection', function(conn) {
        connections.push(conn);
        numConnectionsLifetime++;
        conn.location = "lobby";
        conn.isAlive = true;
        conn.on('data', function(data) {
            console.log('Received data: ', data);
            var dataObj = JSON.parse(data.split("|")[1]);
            if (data.indexOf("addPlayerToLobby") == 0) {
                lobby.lobbyPlayers.push(dataObj);
                sendAll("lobby", "playerJoinedLobby|"+JSON.stringify(dataObj));
            }
            else if (data.indexOf("requestLobby") == 0) {
                conn.send("lobbyObject|" + JSON.stringify(lobby));
            }
        });
        conn.on('error', function(err) {console.log("Connection Error", err);});
        conn.on('close', function() {
            conn.isAlive = false;
            if (conn.location === "lobby") {
                lobby.lobbyPlayers.splice(getPlayerIndexFromId(conn.peer), 1);
                sendAll(conn.location, 'playerLeftLobby|'+JSON.stringify({id: conn.peer}));
            }
        });

    });

    function getPlayerIndexFromId(id) {
        for (var a = 0; a < lobby.lobbyPlayers.length; a++) {
            if (lobby.lobbyPlayers[a].id == id) {
                return a;
            }
        }
        return -1;
    }
    function sendAll(filter, json) {
        _.forEach(connections, function(conn) {
            if (!conn.isAlive) {
                connections.splice(connections.indexOf(conn), 1);
                return;
            }
            if (filter === "all" || conn.location === filter) {
                conn.send(json);
            }
        })
    }




})();