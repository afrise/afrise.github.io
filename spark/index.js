var Printer = new Vue({
    el: "#Printer",
    data: {
        bluetooth: {
            encoder: new TextEncoder('utf-8'),
            decoder: new TextDecoder('utf-8'),
            services: null,
            connecting: false,
            connected: false,
            buffer: "",
            com: {
              tx: null,
              rx: null
            }
        },
        file: {
            selected: null,
            list: [],
            listCache: [],
            currentLayer: 0,
            totalLayers: 0
        },
        ui: {
          showAdvanced: false,
          showFiles: false
        },
        printer: {
          status: "disconnected",
          online: false
        }
    },
    computed: {
        color: function(){
            switch(this.printer.status){
                case "printing":        return "red"; break;
                case "paused":          return "blue"; break;
                case "standby":         return "green"; break;
                case "connecting":      return "purple"; break;
                case "default":         return "black"; break;
                case "no sd card":      return "cyan"; break;
            }
        },
        percent: function(){return this.file.totalLayers > 0 ? Math.floor((this.file.currentLayer / this.file.totalLayers)*100) : 0}
    },
    methods: {
        start:          function(event){this.send("Start Printing;")},
        stop:           function(event){this.send("Stop Printing;")},
        clean:          function(event){this.send("Clean;")},
        display:        function(event){this.send("Display;")},
        emergency:      function(event){this.send("Emergency;")},
        fReturn:        function(event){this.send("Return;")},
        pause:          function(event){ if (this.printer.status=="paused")this.send("Keep Printing;"); if (this.printer.status=="printing")this.send("Pause Printing;")},
        send:           function(message) {this.bluetooth.com.tx.writeValue(this.bluetooth.encoder.encode(message));console.log("SEND:"+message)},
        setFile:        function(file) {this.send("file-"+file); this.ui.showFiles = false;},
        connect: function(event) {
            navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb'
                                , '0000ffe5-0000-1000-8000-00805f9b34fb']
            }).then(device => {
                this.printer.status = "connecting"
                this.bluetooth.connecting=true;
                return device.gatt.connect();
            }).catch((error)=>{
                console.log("error connecting to device.")
                this.printer.status="disconnected"
                this.bluetooth.connecting=false;
            }).then(server =>{return server.getPrimaryServices();
            }).catch(error => {
                console.log("error getting services")
                this.printer.status="disconnected"
                this.bluetooth.connecting=false;
            }).then(services => {
                this.bluetooth.services = services;
                this.setReceiver();
                this.setTransmitter();
                
            }).catch(error => {console.log(error);this.connect()})
        },
        setTransmitter: function() {
            this.bluetooth.services[0].getCharacteristic("0000ffe9-0000-1000-8000-00805f9b34fb")
              .then(characteristic => {
              this.bluetooth.com.tx = characteristic 
              this.bluetooth.connected=true;  
            }).then(()=>{this.send("scan-file")})
            .catch((error=>{console.log("error: setting tx line")}));
        },
        setReceiver: function() {
            this.bluetooth.services[1].getCharacteristic("0000ffe4-0000-1000-8000-00805f9b34fb")
            .then(characteristic => {
                this.bluetooth.com.rx = characteristic
                this.bluetooth.com.rx.addEventListener("characteristicvaluechanged", this.handleIncomingMessages);
                this.bluetooth.com.rx.startNotifications();
            }).catch((error=>{console.log("error: setting rx line")}));
        },
        flushFiles: function(){
            this.file.list = this.file.listCache;
            this.file.listCache = [];
        },
        handleIncomingMessages: function(event) {
            let message = this.bluetooth.decoder.decode(event.target.value)
            if (message.slice(-1)=="\n") {
                let messages = (this.bluetooth.buffer + message).split("\n")
                this.bluetooth.buffer = ""
                for (let i in messages) {
                    let m = messages[i]
                    if (m.includes("pf_")) {
                        if (m.length>3)
                            this.file.selected = m.split('_')[1]
                    }
                    else if (m.includes("F/S=")) {
                        var fs = m.split("=")[1].split("/")
                        this.file.currentLayer = parseFloat(fs[0])
                        this.file.totalLayers = parseFloat(fs[1])
                    }
                    else if (m.includes("P-")) {this.send("PWD-OK\n")}
                    else if (m.includes("f-")) {
                        let file = m.split("-")[1]
                        let part = file.split(".")
                        let fileObj = {id: part[2], name: part[0]+"."+part[1]}
                        this.file.listCache.push(fileObj)
                    }
                    else {
                        switch (m){
                            case "online":       this.printer.online = true; break; //should be timestamp...
                            case "":             break;
                            case "scan-finish":  this.flushFiles();break;
                            case "standby_sts":  this.send("scan-file");
                                                 this.printer.status = "standby";   break;
                            case "printing_sts": this.printer.status = "printing";  break;
                            case "pause_sts":    this.printer.status = "paused";    break;
                            case "pause-over":   this.printer.status = "printing";  break;
                            case "stop_sts":     this.printer.status = "stopped";   break;
                            case "printo_sts":   this.printer.status = "print over";break;
                            case "nocard_sts":   this.printer.status = "no sd card";break;
                            case "update_sts":   this.printer.status = "updating";  break;
                            default: console.log("RECV:"+m); break;
                        }
                    }                        
                }
            }
            else this.bluetooth.buffer += message;
        }
    }
});