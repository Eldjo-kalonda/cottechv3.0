// MQTT variables
var mqtt;
var reconnectTimeout = 2000;
var host = "broker.hivemq.com";
var port = 8884;

// Initialiser la carte et la liste des marqueurs
var lat = -11.664722;
var lon = 27.479444;
var macarte = null;
var markerClusters;
var markers = {};
var villes = {
    "HUACHIN": { "lat": -11.682806, "lon": 27.486470 },
    "KAIPENG": { "lat": -11.668330, "lon": 27.503387 },
    "GCM": { "lat": -11.678543, "lon": 27.477662 },
    "RUBAMIN": { "lat": -11.708576, "lon": 27.449766 },
    "MIKAS": { "lat": -11.688576, "lon": 27.459766 },
    "COMIKA": { "lat": -11.698576, "lon": 27.469766 }
};

// Initialisation de la carte
macarte = L.map('map').setView([lat, lon], 11);
markerClusters = L.markerClusterGroup();

// Charger les tuiles de la carte
L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    attribution: 'Snel data',
    minZoom: 1,
    maxZoom: 20
}).addTo(macarte);

// Ajouter des marqueurs à la carte
for (var ville in villes) {
    var myIcon = L.icon({
        iconUrl: "Mark_red.png",
        iconSize: [50, 50],
        iconAnchor: [25, 50],
        popupAnchor: [-3, -76],
    });
    
    // Ajouter un marqueur avec un label
    var marker = L.marker([villes[ville].lat, villes[ville].lon], { icon: myIcon })
        .bindPopup(ville)
        .bindTooltip(ville, { permanent: true, direction: 'right' }) // Afficher le label en permanence à droite du marqueur

    marker.on('click', function (e) {
        this.openPopup(); // Afficher le popup au clic
    });

    markerClusters.addLayer(marker);
    markers[ville] = marker;
}

macarte.addLayer(markerClusters);

// Fonction pour mettre à jour les informations du marqueur
function markerUpdate(data) {
    var data_splited = data[0].split(",");
    var ville = data_splited[0].substring(2); // Le nom de la ville est supposé être au début des données

    if (markers[ville]) {
        var marker = markers[ville];
        var popupContent = `
           
            <div style="text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 10px;">
                ${ville}</div>
            <table style="width: 100%; text-align: center; border-collapse: collapse;">
                <tr>
                    <th >Phase A 🔴</th>
                    <th >Phase B 🔵</th>
                    <th >Phase C 🟡</th>
                </tr>
                <tr>
                    <td style="padding: 10px;">
                        Voltage: ${data_splited[1]} V<br>
                        Current: ${data_splited[2]} A<br>
                        Power: ${data_splited[3]} W<br>
                        Factor Power: ${data_splited[4]}
                    </td>
                    <td style="border-left: 2px solid #000; padding: 10px;">
                        Voltage: ${data_splited[5]} V<br>
                        Current: ${data_splited[6]} A<br>
                        Power: ${data_splited[7]} W<br>
                        Factor Power: ${data_splited[8]}
                    </td>
                    <td style="border-left: 2px solid #000; padding: 10px;">
                        Voltage: ${data_splited[9]} V<br>
                        Current: ${data_splited[10]} A<br>
                        Power: ${data_splited[11]} W<br>
                        Factor Power: ${data_splited[12]}
                    </td>
                </tr>
            </table>
        `;
        marker.bindPopup(popupContent); // Met à jour le contenu du popup sans l'ouvrir
    }
}



// Ajouter un événement de clic pour chaque lien de navigation
document.getElementById("link-huachin").addEventListener("click", function () {
    goToMarker("HUACHIN");
});
document.getElementById("link-kaipeng").addEventListener("click", function () {
    goToMarker("KAIPENG");
});
document.getElementById("link-gcm").addEventListener("click", function () {
    goToMarker("GCM");
});
document.getElementById("link-rubamin").addEventListener("click", function () {
    goToMarker("RUBAMIN");
});
document.getElementById("link-mikas").addEventListener("click", function () {
    goToMarker("MIKAS");
});
document.getElementById("link-comika").addEventListener("click", function () {
    goToMarker("COMIKA");
});

// Fonction pour déplacer la carte vers un marqueur spécifique
function goToMarker(ville) {
    var marker = markers[ville];
    if (marker) {
        macarte.setView(marker.getLatLng(), 13); // Zoom sur le marqueur
        marker.openPopup(); // Ouvrir la popup du marqueur
    }
}

/* MQTT Code */

function onFailure(message) {
    console.log("Connection Attempt to Host " + host + " Failed");
    document.getElementById("footer").innerHTML = "Connection Attempt to Host " + host + " Failed";
    setTimeout(MQTTconnect, reconnectTimeout);
}

function onMessageArrived(msg) {
    out_msg = msg.payloadString.split();
    console.log(out_msg);
    markerUpdate(out_msg);
}

function onConnect() {
    console.log("Connected ");
    document.getElementById("footer").innerHTML = "Connected to broker";
    mqtt.subscribe("Snel/data/Station_Karavia");
}

function MQTTconnect() {
    console.log("connecting to " + host + " " + port);
    var x = Math.floor(Math.random() * 10000);
    var cname = "orderform-" + x;
    mqtt = new Paho.MQTT.Client(host, port, cname);
    var options = {
        timeout: 3,
        onSuccess: onConnect,
        onFailure: onFailure,
    };
    mqtt.onMessageArrived = onMessageArrived;

    mqtt.connect(options); // Connect to the broker
}

// Fonction pour vérifier la connectivité au broker
function checkConnectivity() {
    if (!mqtt.isConnected()) {
        console.log("Disconnected from broker. Attempting to reconnect...");
        document.getElementById("footer").innerHTML = "Disconnected from broker. Attempting to reconnect...";
        mqtt = new Paho.MQTT.Client(host, port, cname);
        var options = {
            timeout: 3,
            onSuccess: onConnect,
            onFailure: onFailure,
        };
        mqtt.connect(options); // Connect to the broker
    } else {
        console.log("Still connected to broker.");
    }
}

// Gérer la perte de connexion
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("Connection lost: " + responseObject.errorMessage);
        document.getElementById("footer").innerHTML = "Connection lost: " + responseObject.errorMessage;
        setTimeout(MQTTconnect, reconnectTimeout);
    }
}

// Vérification de la connectivité toutes les 5 secondes
setInterval(checkConnectivity, 5000);

MQTTconnect(); // Initiate the MQTT connection

function checkDataReceived(lastReceivedTime) {
    var currentTime = new Date().getTime();
    if (currentTime - lastReceivedTime > 600000) { // 10 minutes en millisecondes
        alert("Aucune donnée reçue depuis 10 minutes. Vérifiez votre connexion.");
    }
}

// Appeler cette fonction régulièrement pour vérifier la réception des données
setInterval(function() {
    checkDataReceived(lastDataReceivedTime);
}, 60000); // Vérifier toutes les minutes


function onMessageArrived(msg) {
    lastDataReceivedTime = new Date().getTime();
    var out_msg = msg.payloadString.split();
    console.log(out_msg);
    markerUpdate(out_msg);
    setTimeout(1000)
}

